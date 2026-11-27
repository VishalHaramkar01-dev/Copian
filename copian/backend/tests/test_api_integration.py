"""End-to-end FastAPI integration tests covering RBAC, rate limits, tracking, and B2B order funnel."""

import sys
import unittest
from pathlib import Path

from fastapi import BackgroundTasks, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, get_db
from app.main import app
from app.models import InventoryItem, InventoryTransaction, Product
from app.security import InMemoryRateLimiter
from app.seed import seed_database
from app.services.storage_service import save_upload_file


class ApiIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=cls.engine)
        cls.TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        db = cls.TestingSession()
        try:
            seed_database(db)
        finally:
            db.close()

        def override_get_db():
            session = cls.TestingSession()
            try:
                yield session
            finally:
                session.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=cls.engine)
        cls.engine.dispose()

    def _auth_headers(self, email: str = "arjun@copian.in") -> dict:
        resp = self.client.post("/api/auth/login", json={"email": email, "password": "copian@2026"})
        self.assertEqual(resp.status_code, 200)
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    def test_health_and_unauthenticated_guards(self):
        self.assertEqual(self.client.get("/api/health").status_code, 200)
        for ep in ["/api/customers", "/api/orders", "/api/inventory", "/api/roles"]:
            self.assertEqual(self.client.get(ep).status_code, 401)
        self.assertEqual(self.client.put("/api/cms", json={}).status_code, 401)

    def test_rbac_permission_matrix(self):
        # Inventory manager (sharma@copian.in) can view inventory but cannot edit Website & SEO CMS
        inv_headers = self._auth_headers("sharma@copian.in")
        self.assertEqual(self.client.get("/api/inventory", headers=inv_headers).status_code, 200)
        self.assertEqual(self.client.put("/api/cms", json={}, headers=inv_headers).status_code, 403)

    def test_rate_limiter_enforces_threshold(self):
        limiter = InMemoryRateLimiter()
        limiter.check("bucket", "10.0.0.1", max_calls=2, window_seconds=60)
        limiter.check("bucket", "10.0.0.1", max_calls=2, window_seconds=60)
        with self.assertRaises(HTTPException) as ctx:
            limiter.check("bucket", "10.0.0.1", max_calls=2, window_seconds=60)
        self.assertEqual(ctx.exception.status_code, 429)

    def test_upload_validation_rejects_executable_extension(self):
        with self.assertRaises(HTTPException) as ctx:
            save_upload_file("malware.exe", b"mz")
        self.assertEqual(ctx.exception.status_code, 400)

    def test_full_b2b_inquiry_to_dispatch_tracking_funnel(self):
        headers = self._auth_headers("arjun@copian.in")
        sid = "test-funnel-session"

        # 1. Public shopper adds SKU to cart
        r_cart = self.client.post(
            "/api/cart",
            json={"session_id": sid, "sku": "CPN-HP-88A", "product_name": "Copian 88A", "quantity": 25},
        )
        self.assertEqual(r_cart.status_code, 200)

        # 2. Public shopper submits Bulk Inquiry
        r_inq = self.client.post(
            "/api/inquiries",
            json={
                "company_name": "Star Print Solutions",
                "contact_name": "Vikram Desai",
                "phone": "9820012345",
                "email": "vikram@starprint.in",
                "gstin": "27AAACS9999K1Z5",
                "delivery_city": "Mumbai",
                "notes": "Urgent A4 toner shipment",
                "session_id": sid,
                "items": [{"sku": "CPN-HP-88A", "product_name": "Copian 88A", "quantity": 25}],
            },
        )
        self.assertEqual(r_inq.status_code, 200)
        inq = r_inq.json()

        # 3. Admin converts inquiry -> quotation -> sends -> converts to order
        r_qt = self.client.post(f"/api/inquiries/{inq['id']}/convert-quotation", headers=headers)
        self.assertEqual(r_qt.status_code, 200)
        qt = r_qt.json()

        r_send = self.client.post(f"/api/quotations/{qt['id']}/send", headers=headers)
        self.assertEqual(r_send.status_code, 200)
        self.assertEqual(r_send.json()["status"], "Sent")

        r_ord = self.client.post(f"/api/quotations/{qt['id']}/convert-order", headers=headers)
        self.assertEqual(r_ord.status_code, 200)
        ord_data = r_ord.json()

        # 4. Admin updates courier + tracking number
        r_upd = self.client.patch(
            f"/api/orders/{ord_data['id']}",
            headers=headers,
            json={"fulfilment_status": "Dispatched", "courier_name": "BlueDart", "tracking_number": "AWB998877"},
        )
        self.assertEqual(r_upd.status_code, 200)
        self.assertEqual(r_upd.json()["tracking_number"], "AWB998877")

        # 5. Public buyer self-service tracker verifies code + phone digits, rejects wrong contact
        r_trk_bad = self.client.post(
            "/api/track",
            json={"reference_code": ord_data["order_code"], "contact": "wrong@other.com"},
        )
        self.assertEqual(r_trk_bad.status_code, 404)

        r_trk_ok = self.client.post(
            "/api/track",
            json={"reference_code": ord_data["order_code"], "contact": "2345"},
        )
        self.assertEqual(r_trk_ok.status_code, 200)
        trk = r_trk_ok.json()
        self.assertEqual(trk["tracking_number"], "AWB998877")
        self.assertEqual(trk["courier_name"], "BlueDart")
        self.assertEqual(trk["status"], "Dispatched")

        # 6. Verify auto stock outward transaction recorded cleanly for order dispatch
        db = self.TestingSession()
        try:
            txn = (
                db.query(InventoryTransaction)
                .filter(InventoryTransaction.reference_code == ord_data["order_code"])
                .first()
            )
            self.assertIsNotNone(txn)
            self.assertEqual(txn.txn_type, "Outward")
        finally:
            db.close()

        # 7. Verify downloadable PDF endpoints emit real %PDF bytes
        r_qpdf = self.client.get(f"/api/quotations/{qt['id']}/pdf", headers=headers)
        self.assertEqual(r_qpdf.status_code, 200)
        self.assertEqual(r_qpdf.headers["content-type"], "application/pdf")
        self.assertTrue(r_qpdf.content.startswith(b"%PDF"))

        r_opdf = self.client.get(f"/api/orders/{ord_data['id']}/pdf", headers=headers)
        self.assertEqual(r_opdf.status_code, 200)
        self.assertTrue(r_opdf.content.startswith(b"%PDF"))

        # 8. Verify Customer credit ledger fields returned cleanly
        r_cust = self.client.get("/api/customers", headers=headers)
        self.assertEqual(r_cust.status_code, 200)
        star_cust = next((c for c in r_cust.json() if c["company_name"] == "Star Print Solutions"), None)
        self.assertIsNotNone(star_cust)
        self.assertIn("credit_limit", star_cust)
        self.assertIn("credit_used", star_cust)
        self.assertIn("overdue_30d_amount", star_cust)

    def test_gstin_validation_rejects_malformed_gstin(self):
        r_bad = self.client.post(
            "/api/inquiries",
            json={
                "company_name": "Bad GST Co",
                "contact_name": "Test Buyer",
                "phone": "9999988888",
                "email": "test@badgst.in",
                "gstin": "INVALIDGST123",
                "delivery_city": "Pune",
                "items": [{"sku": "CPN-HP-88A", "product_name": "Copian 88A", "quantity": 10}],
            },
        )
        self.assertEqual(r_bad.status_code, 422)

    def test_buyer_portal_auth_credit_and_scoped_invoice_pdf(self):
        # Customer 2 (Deccan Office Supplies) has orders & 30-day credit in seed
        r_bad = self.client.post("/api/buyer/login", json={"email": "orders@deccanoffice.in", "verification": "0000"})
        self.assertEqual(r_bad.status_code, 401)
        self.assertEqual(self.client.get("/api/buyer/portal").status_code, 401)

        r_ok = self.client.post("/api/buyer/login", json={"email": "orders@deccanoffice.in", "verification": "2311"})
        self.assertEqual(r_ok.status_code, 200)
        buyer_headers = {"Authorization": f"Bearer {r_ok.json()['access_token']}"}

        r_portal = self.client.get("/api/buyer/portal", headers=buyer_headers)
        self.assertEqual(r_portal.status_code, 200)
        portal = r_portal.json()
        self.assertEqual(portal["customer"]["company_name"], "Deccan Office Supplies")
        self.assertGreaterEqual(len(portal["orders"]), 1)

        own_order_id = portal["orders"][0]["id"]
        r_pdf = self.client.get(f"/api/buyer/orders/{own_order_id}/pdf", headers=buyer_headers)
        self.assertEqual(r_pdf.status_code, 200)
        self.assertTrue(r_pdf.content.startswith(b"%PDF"))

    def test_pagination_headers_and_limits(self):
        headers = self._auth_headers("arjun@copian.in")
        r_prod = self.client.get("/api/products?limit=2&offset=0")
        self.assertEqual(r_prod.status_code, 200)
        self.assertLessEqual(len(r_prod.json()), 2)
        self.assertIn("x-total-count", {k.lower(): v for k, v in r_prod.headers.items()})
        total_prods = int(r_prod.headers["x-total-count"])
        self.assertGreaterEqual(total_prods, len(r_prod.json()))

        r_cust = self.client.get("/api/customers?limit=1&offset=0", headers=headers)
        self.assertEqual(r_cust.status_code, 200)
        self.assertEqual(len(r_cust.json()), 1)
        self.assertGreaterEqual(int(r_cust.headers["x-total-count"]), 1)

        r_inq = self.client.get("/api/inquiries?limit=2&offset=0", headers=headers)
        self.assertEqual(r_inq.status_code, 200)
        self.assertLessEqual(len(r_inq.json()["inquiries"]), 2)
        self.assertGreaterEqual(int(r_inq.headers["x-total-count"]), len(r_inq.json()["inquiries"]))

        r_ord = self.client.get("/api/orders?limit=1&offset=0", headers=headers)
        self.assertEqual(r_ord.status_code, 200)
        self.assertLessEqual(len(r_ord.json()), 1)
        self.assertGreaterEqual(int(r_ord.headers["x-total-count"]), len(r_ord.json()))

    def test_smtp_dispatch_queued_in_background_tasks(self):
        from app.schemas import InquiryCreate, InquiryItemIn
        from app.services import sales_service

        db = self.TestingSession()
        try:
            bg = BackgroundTasks()
            res = sales_service.create_inquiry(
                db,
                InquiryCreate(
                    company_name="BgQueue Corp",
                    contact_name="Neha Patel",
                    phone="9820099988",
                    email="neha@bgqueue.in",
                    delivery_city="Ahmedabad",
                    items=[InquiryItemIn(sku="CPN-HP-88A", product_name="Copian 88A", quantity=10)],
                ),
                background_tasks=bg,
            )
            self.assertEqual(res["company_name"], "BgQueue Corp")
            self.assertEqual(len(bg.tasks), 1)
            self.assertEqual(bg.tasks[0].func.__name__, "notify_inquiry_received")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
