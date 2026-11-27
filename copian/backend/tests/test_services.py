"""Unit tests for backend service utilities and domain business rules."""

import asyncio
import json
import sys
import unittest
from pathlib import Path

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.auth import create_access_token, hash_password, verify_password
from app.main import (
    integrity_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.services.catalog_service import slugify
from app.services.sales_service import compute_quote_totals


class ServiceLayerTests(unittest.TestCase):
    def test_compute_quote_totals_with_discount_and_gst(self):
        items = [
            {"quantity": 40, "unit_price": 420.0},
            {"quantity": 20, "unit_price": 650.0},
        ]
        subtotal, gst, grand_total = compute_quote_totals(
            items=items, discount=1000.0, shipping=800.0, gst_rate=18
        )
        self.assertEqual(subtotal, 29800.0)
        self.assertEqual(gst, 5328.0)  # (29800 - 1000 + 800) * 0.18
        self.assertEqual(grand_total, 34928.0)

    def test_compute_quote_totals_floors_taxable_at_zero(self):
        items = [{"quantity": 1, "unit_price": 100.0}]
        subtotal, gst, grand_total = compute_quote_totals(
            items=items, discount=500.0, shipping=0.0, gst_rate=18
        )
        self.assertEqual(subtotal, 100.0)
        self.assertEqual(gst, 0.0)
        self.assertEqual(grand_total, 0.0)

    def test_slugify_handles_special_chars(self):
        self.assertEqual(slugify("Copian 88A / Black Toner!"), "copian-88a-black-toner")
        self.assertTrue(slugify("   ").startswith("sku-"))

    def test_password_hashing_and_jwt_token(self):
        pw_hash = hash_password("copian@2026")
        self.assertTrue(verify_password("copian@2026", pw_hash))
        self.assertFalse(verify_password("wrong", pw_hash))
        token = create_access_token(1, "arjun@copian.in", "super-admin")
        self.assertEqual(len(token.split(".")), 3)

    def test_global_exception_handlers_return_safe_json(self):
        fake_req = Request({"type": "http", "method": "POST", "path": "/api/test", "headers": []})

        val_resp = asyncio.run(
            validation_exception_handler(
                fake_req,
                RequestValidationError([{"loc": ("body", "sku"), "msg": "Field required", "type": "missing"}]),
            )
        )
        self.assertEqual(val_resp.status_code, 422)
        self.assertIn("sku", json.loads(val_resp.body)["detail"])

        int_resp = asyncio.run(
            integrity_exception_handler(fake_req, IntegrityError("INSERT", {}, Exception("duplicate key")))
        )
        self.assertEqual(int_resp.status_code, 409)
        self.assertIn("Duplicate or conflicting record", json.loads(int_resp.body)["detail"])

        unh_resp = asyncio.run(unhandled_exception_handler(fake_req, RuntimeError("boom")))
        self.assertEqual(unh_resp.status_code, 500)
        self.assertNotIn("boom", json.loads(unh_resp.body)["detail"])


if __name__ == "__main__":
    unittest.main()
