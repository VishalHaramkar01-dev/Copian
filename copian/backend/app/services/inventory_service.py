"""Multi-warehouse inventory valuation, stock ledger, and stock adjustment services."""

import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from app.models import AuditLog, InventoryItem, InventoryTransaction, Product, Warehouse
from app.schemas import InventoryActionRequest, WarehouseCreate


def sync_product_stock_status(db: Session, product: Product) -> None:
    """Recompute product stock status from aggregated warehouse balances."""
    items = db.query(InventoryItem).filter(InventoryItem.product_id == product.id).all()
    total = sum(i.available_qty for i in items)
    min_reorder = min((i.reorder_level for i in items), default=50)
    if total <= 0:
        product.stock_status = "Out of Stock"
    elif total <= min_reorder:
        product.stock_status = "Low Stock"
    else:
        product.stock_status = "In Stock"


def get_or_create_inventory_item(db: Session, sku: str, warehouse_name: str) -> tuple[Product, InventoryItem]:
    """Locate product SKU and its matching warehouse inventory row, creating if absent."""
    product = db.query(Product).filter(Product.sku.ilike(sku.strip())).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product SKU {sku} not found")
    wh = db.query(Warehouse).filter(Warehouse.name == warehouse_name).first() or db.query(Warehouse).first()
    if not wh:
        raise HTTPException(status_code=400, detail="No warehouse configured")
    inv = (
        db.query(InventoryItem)
        .filter(InventoryItem.product_id == product.id, InventoryItem.warehouse_id == wh.id)
        .first()
    )
    if not inv:
        inv = db.query(InventoryItem).filter(InventoryItem.product_id == product.id).first()
    if not inv:
        inv = InventoryItem(product_id=product.id, warehouse_id=wh.id, available_qty=0, reserved_qty=0, reorder_level=50)
        db.add(inv)
        db.flush()
    return product, inv


def _record_stock_transaction(
    db: Session,
    product: Product,
    inv: InventoryItem,
    txn_type: str,
    prev_qty: int,
    delta_qty: int,
    new_qty: int,
    reference_code: str,
    reason: str,
    performed_by: str,
    audit_action: str,
    audit_details: str,
) -> dict:
    """Persist an inventory transaction ledger entry, sync status, and commit audit log."""
    txn_code = f"TXN-{9042 + db.query(InventoryTransaction).count()}"
    db.add(
        InventoryTransaction(
            txn_code=txn_code,
            product_id=product.id,
            warehouse_id=inv.warehouse_id,
            txn_type=txn_type,
            prev_qty=prev_qty,
            delta_qty=delta_qty,
            new_qty=new_qty,
            reference_code=reference_code,
            reason=reason,
            performed_by=performed_by,
        )
    )
    sync_product_stock_status(db, product)
    db.add(
        AuditLog(
            user_name=performed_by,
            action=audit_action,
            module="Inventory",
            entity_id=product.sku,
            details=audit_details,
        )
    )
    db.commit()
    return {"txn_code": txn_code, "sku": product.sku, "new_qty": new_qty}


def get_inventory_overview(db: Session) -> dict:
    items = (
        db.query(InventoryItem)
        .options(joinedload(InventoryItem.product), joinedload(InventoryItem.warehouse))
        .order_by(InventoryItem.id)
        .all()
    )
    warehouses = db.query(Warehouse).all()
    total_skus = db.query(Product).count()
    total_qty = sum(i.available_qty for i in items)
    total_value = sum(i.available_qty * (i.product.dealer_price if i.product else 0) for i in items)
    low_stock_items = [i for i in items if 0 < i.available_qty <= i.reorder_level]
    out_of_stock_items = [i for i in items if i.available_qty <= 0]

    listing = []
    for i in items:
        if i.available_qty <= 0:
            st = "Out of Stock"
        elif i.available_qty <= i.reorder_level:
            st = "Low Stock"
        else:
            st = "Healthy"
        listing.append(
            {
                "id": i.id,
                "product_id": i.product_id,
                "product_name": i.product.name if i.product else "",
                "sku": i.product.sku if i.product else "",
                "dealer_price": i.product.dealer_price if i.product else 0,
                "warehouse": i.warehouse.name if i.warehouse else "Mumbai Central",
                "available_qty": i.available_qty,
                "reserved_qty": i.reserved_qty,
                "reorder_level": i.reorder_level,
                "suggested_reorder_qty": i.suggested_reorder_qty,
                "status": st,
            }
        )

    txns = (
        db.query(InventoryTransaction)
        .options(joinedload(InventoryTransaction.product), joinedload(InventoryTransaction.warehouse))
        .order_by(InventoryTransaction.created_at.desc())
        .limit(50)
        .all()
    )
    transactions = [
        {
            "id": t.id,
            "txn_code": t.txn_code,
            "product_name": t.product.name if t.product else "",
            "sku": t.product.sku if t.product else "",
            "warehouse": t.warehouse.name if t.warehouse else "",
            "txn_type": t.txn_type,
            "prev_qty": t.prev_qty,
            "delta_qty": t.delta_qty,
            "new_qty": t.new_qty,
            "reference_code": t.reference_code,
            "reason": t.reason,
            "performed_by": t.performed_by,
            "created_at": t.created_at.isoformat(),
        }
        for t in txns
    ]

    return {
        "kpis": {
            "total_skus": total_skus,
            "total_stock_qty": total_qty,
            "inventory_value": total_value,
            "low_stock_count": len(low_stock_items),
            "out_of_stock_count": len(out_of_stock_items),
            "warehouse_count": len(warehouses),
        },
        "warehouses": [{"id": w.id, "name": w.name, "code": w.code, "city": w.city} for w in warehouses],
        "listing": listing,
        "transactions": transactions,
        "alerts": [x for x in listing if x["status"] in ("Low Stock", "Out of Stock")],
    }


def stock_inward(db: Session, payload: InventoryActionRequest) -> dict:
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    product, inv = get_or_create_inventory_item(db, payload.sku, payload.warehouse_name)
    prev_qty = inv.available_qty
    inv.available_qty += payload.quantity
    return _record_stock_transaction(
        db=db,
        product=product,
        inv=inv,
        txn_type="Inward",
        prev_qty=prev_qty,
        delta_qty=payload.quantity,
        new_qty=inv.available_qty,
        reference_code=payload.reference_code or f"PO-{uuid.uuid4().hex[:6].upper()}",
        reason=payload.reason or "Stock Inward Receipt",
        performed_by=payload.performed_by,
        audit_action="STOCK_INWARD",
        audit_details=f"+{payload.quantity} units",
    )


def stock_outward(db: Session, payload: InventoryActionRequest) -> dict:
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    product, inv = get_or_create_inventory_item(db, payload.sku, payload.warehouse_name)
    if inv.available_qty < payload.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for {product.sku} (available: {inv.available_qty})",
        )
    prev_qty = inv.available_qty
    inv.available_qty -= payload.quantity
    return _record_stock_transaction(
        db=db,
        product=product,
        inv=inv,
        txn_type="Outward",
        prev_qty=prev_qty,
        delta_qty=-payload.quantity,
        new_qty=inv.available_qty,
        reference_code=payload.reference_code or f"ORD-{uuid.uuid4().hex[:6].upper()}",
        reason=payload.reason or "B2B Order Fulfilment",
        performed_by=payload.performed_by,
        audit_action="STOCK_OUTWARD",
        audit_details=f"-{payload.quantity} units",
    )


def stock_adjustment(db: Session, payload: InventoryActionRequest) -> dict:
    if not payload.reason.strip():
        raise HTTPException(status_code=400, detail="Mandatory audit reason is required")
    product, inv = get_or_create_inventory_item(db, payload.sku, payload.warehouse_name)
    is_positive = (payload.adjustment_type or "").endswith("(+)")
    delta = payload.quantity if is_positive else -abs(payload.quantity)
    prev_qty = inv.available_qty
    new_qty = max(0, prev_qty + delta)
    inv.available_qty = new_qty
    return _record_stock_transaction(
        db=db,
        product=product,
        inv=inv,
        txn_type="Adjustment",
        prev_qty=prev_qty,
        delta_qty=new_qty - prev_qty,
        new_qty=new_qty,
        reference_code=payload.reference_code or "AUDIT-ADJ",
        reason=f"{payload.adjustment_type or 'Adjustment'}: {payload.reason}",
        performed_by=payload.performed_by,
        audit_action="STOCK_ADJUSTMENT",
        audit_details=payload.reason,
    )


def create_warehouse(db: Session, payload: WarehouseCreate) -> dict:
    if db.query(Warehouse).filter(Warehouse.code == payload.code.strip().upper()).first():
        raise HTTPException(status_code=400, detail="Warehouse code already exists")
    wh = Warehouse(
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        city=payload.city.strip(),
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return {"id": wh.id, "name": wh.name, "code": wh.code, "city": wh.city}


def delete_warehouse(db: Session, warehouse_id: int) -> dict:
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    db.delete(wh)
    db.commit()
    return {"deleted": True}


def reserve_stock_for_order(db: Session, items: list, order_code: str) -> None:
    """Reserve warehouse inventory units upon order confirmation."""
    for it in items:
        sku = it["sku"] if isinstance(it, dict) else getattr(it, "sku", "")
        qty = int(it["quantity"] if isinstance(it, dict) else getattr(it, "quantity", 0))
        if qty <= 0 or not sku:
            continue
        prod = db.query(Product).filter(Product.sku.ilike(sku.strip())).first()
        if not prod:
            continue
        inv = db.query(InventoryItem).filter(InventoryItem.product_id == prod.id).order_by(InventoryItem.available_qty.desc()).first()
        if inv:
            inv.reserved_qty = (inv.reserved_qty or 0) + qty


def commit_dispatch_for_order(db: Session, order_items: list, order_code: str) -> None:
    """Deduct stock and log an Outward ledger transaction once when an order dispatches."""
    already = (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.reference_code == order_code, InventoryTransaction.txn_type == "Outward")
        .first()
    )
    if already:
        return
    base_count = db.query(InventoryTransaction).count()
    idx = 0
    for it in order_items:
        sku = it["sku"] if isinstance(it, dict) else getattr(it, "sku", "")
        qty = int(it["quantity"] if isinstance(it, dict) else getattr(it, "quantity", 0))
        if qty <= 0 or not sku:
            continue
        prod = db.query(Product).filter(Product.sku.ilike(sku.strip())).first()
        if not prod:
            continue
        inv = db.query(InventoryItem).filter(InventoryItem.product_id == prod.id).order_by(InventoryItem.available_qty.desc()).first()
        if not inv:
            continue
        prev = inv.available_qty
        inv.reserved_qty = max(0, (inv.reserved_qty or 0) - qty)
        inv.available_qty = max(0, prev - qty)
        txn_code = f"TXN-{9042 + base_count + idx}"
        idx += 1
        db.add(
            InventoryTransaction(
                txn_code=txn_code,
                product_id=prod.id,
                warehouse_id=inv.warehouse_id,
                txn_type="Outward",
                prev_qty=prev,
                delta_qty=inv.available_qty - prev,
                new_qty=inv.available_qty,
                reference_code=order_code,
                reason="Auto-deducted on Order Dispatch",
                performed_by="System ERP",
            )
        )
        sync_product_stock_status(db, prod)


def release_reserved_stock_for_order(db: Session, order_items: list, order_code: str) -> None:
    """Release previously reserved inventory units if an order is cancelled."""
    for it in order_items:
        sku = it["sku"] if isinstance(it, dict) else getattr(it, "sku", "")
        qty = int(it["quantity"] if isinstance(it, dict) else getattr(it, "quantity", 0))
        if qty <= 0 or not sku:
            continue
        prod = db.query(Product).filter(Product.sku.ilike(sku.strip())).first()
        if not prod:
            continue
        inv = db.query(InventoryItem).filter(InventoryItem.product_id == prod.id).order_by(InventoryItem.reserved_qty.desc()).first()
        if inv:
            inv.reserved_qty = max(0, (inv.reserved_qty or 0) - qty)
