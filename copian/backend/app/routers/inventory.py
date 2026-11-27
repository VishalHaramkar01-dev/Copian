from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth import require_permission
from app.database import get_db
from app.models import AdminUser
from app.schemas import InventoryActionRequest, WarehouseCreate
from app.services import inventory_service

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("")
def get_inventory_overview(
    _admin: AdminUser = Depends(require_permission("Inventory & Stock Ledger", "view")),
    db: Session = Depends(get_db),
):
    return inventory_service.get_inventory_overview(db)


@router.post("/warehouses")
def create_warehouse(
    payload: WarehouseCreate,
    _admin: AdminUser = Depends(require_permission("Inventory & Stock Ledger", "create")),
    db: Session = Depends(get_db),
):
    return inventory_service.create_warehouse(db, payload)


@router.delete("/warehouses/{warehouse_id}")
def delete_warehouse(
    warehouse_id: int,
    _admin: AdminUser = Depends(require_permission("Inventory & Stock Ledger", "edit")),
    db: Session = Depends(get_db),
):
    return inventory_service.delete_warehouse(db, warehouse_id)


@router.post("/inward")
def stock_inward(
    payload: InventoryActionRequest,
    _admin: AdminUser = Depends(require_permission("Inventory & Stock Ledger", "create")),
    db: Session = Depends(get_db),
):
    return inventory_service.stock_inward(db, payload)


@router.post("/outward")
def stock_outward(
    payload: InventoryActionRequest,
    _admin: AdminUser = Depends(require_permission("Inventory & Stock Ledger", "edit")),
    db: Session = Depends(get_db),
):
    return inventory_service.stock_outward(db, payload)


@router.post("/adjust")
def stock_adjustment(
    payload: InventoryActionRequest,
    _admin: AdminUser = Depends(require_permission("Inventory & Stock Ledger", "edit")),
    db: Session = Depends(get_db),
):
    return inventory_service.stock_adjustment(db, payload)
