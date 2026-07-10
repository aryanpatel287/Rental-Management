# Design Specification: Phase 3 & 4 — Quotation, Rental Orders + Reservations

## Goal
Implement the core business and ERP workflow for Quotation Management, Rental Orders, and Reservations using Express, PostgreSQL, and Drizzle ORM. This enables converting a validated customer cart into a draft quotation, sending/canceling/recalculating quotations, and converting a quotation into a rental order with active reservations and inventory stock adjustments within a single database transaction.

---

## Folder Structure & Module Setup
We will create three new modules under `server/src/modules/`:
```text
server/src/modules/
  ├── quotation/
  │     ├── controllers/
  │     │     └── quotation.controller.js
  │     ├── services/
  │     │     └── quotation.service.js
  │     ├── repository/
  │     │     └── quotation.repository.js
  │     ├── validators/
  │     │     └── quotation.validators.js
  │     └── routes/
  │           └── quotation.routes.js
  │
  ├── rental-order/
  │     ├── controllers/
  │     │     └── rental-order.controller.js
  │     ├── services/
  │     │     └── rental-order.service.js
  │     ├── repository/
  │     │     └── rental-order.repository.js
  │     ├── validators/
  │     │     └── rental-order.validators.js
  │     └── routes/
  │           └── rental-order.routes.js
  │
  ├── reservation/
  │     ├── services/
  │     │     └── reservation.service.js
  │     └── repository/
  │           └── reservation.repository.js
  │
  └── coupon/
        ├── services/
        │     └── coupon.service.js
        └── repository/
              └── coupon.repository.js
```

---

## 1. Quotation Management (Phase 3)

### Endpoints
- `POST /api/quotations` — Create quotation from authenticated user's cart (requires code, pricing recalculation, availability check).
- `GET /api/quotations` — List quotations (paginated, filtered by status, dates, customer/vendor).
- `GET /api/quotations/:id` — Get quotation detail with items, variants, pricing, and status.
- `PATCH /api/quotations/:id` — Update quotation items (only if status is `'Draft'`).
- `DELETE /api/quotations/:id` — Delete quotation (only if status is `'Draft'`).
- `POST /api/quotations/:id/send` — Mark quotation as `'Sent'` (Vendor/Admin only).
- `POST /api/quotations/:id/cancel` — Mark quotation as `'Cancelled'`.
- `POST /api/quotations/:id/confirm` ⭐ — Requests conversion to order (delegates to `RentalOrderService.confirmQuotation`).

### Business Rules & Flow
1. **Quotation Creation**:
   - Verify authenticated user.
   - Fetch their cart. If empty, reject with `EMPTY_CART`.
   - Validate availability for each cart item using `checkAvailability`. If any item is unavailable or product/variant is unpublished/non-rentable, reject with `INSUFFICIENT_STOCK`.
   - Validate and apply the coupon code if supplied. Check coupon validity via `CouponService`.
   - Recalculate totals server-side:
     - `subtotal` = sum of `item.pricePerUnit * item.duration * item.quantity`
     - `discount` = coupon discount (percentage or flat, capped at subtotal)
     - `gst` = 18% of `subtotal - discount`
     - `securityDeposit` = sum of `depositPerUnit * item.quantity`
     - `total` = `subtotal - discount + gst + securityDeposit`
   - Generate quotation number `QTN-YYYYMMDD-XXXXX` where `XXXXX` is a sequential index for the day.
   - Insert quotation and quotation items in the DB.
   - Clear the customer's cart.
2. **Editing/Modifying**:
   - Only allow editing or deleting a quotation if its status is `'Draft'`.
   - Any edit of quantity, dates, or items triggers a full availability check, coupon re-validation, and total recalculation.

---

## 2. Rental Orders & Reservations (Phase 4)

### Endpoints
- `GET /api/orders` — List orders (paginated, with authorization checks).
- `GET /api/orders/:id` — Get single order details.
- `PATCH /api/orders/:id` — Update order details (notes, pickup dates, etc.).
- `PATCH /api/orders/:id/status` — Modify order status (enforcing transitions).
- `POST /api/orders/:id/cancel` — Cancel order (releases stock and reservations).
- `GET /api/reservations` — List reservations (Admin only).
- `GET /api/reservations/:id` — Get single reservation.
- `POST /api/reservations/check` — Redirects to availability validation.

### Transaction Flow: Quotation to Order Conversion (`POST /api/quotations/:id/confirm`)
This operation runs in a **single database transaction (`db.transaction`)** and executes these steps:
1. Fetch and lock the quotation. Ensure its status is `'Draft'` or `'Sent'`. If already confirmed, reject with `QUOTATION_ALREADY_CONFIRMED`.
2. For each item in the quotation, validate availability for the rental dates. If stock is insufficient, reject with `INSUFFICIENT_STOCK`.
3. Generate the order number `ORD-YYYYMMDD-XXXXX` sequentially.
4. Insert a new record into `rental_orders` with status `'Confirmed'`.
5. Insert items into `rental_order_items` matching the quotation items.
6. Create active `reservations` records for each order item with status `'Reserved'`.
7. Adjust the inventory quantities for each product/variant:
   - Decrement `availableQty` by `item.quantity`.
   - Increment `reservedQty` by `item.quantity`.
8. Update the quotation status to `'Confirmed'`.
9. Commit transaction. On any failure, automatically roll back.

### Status Transitions & Inventory Adjustments
We enforce the following lifecycle and inventory state shifts:
- **`Draft` / `Confirmed`**: Inventory is reserved.
  - `availableQty -= quantity`, `reservedQty += quantity`.
- **`PickedUp` / `Active`**: Inventory goes to the customer.
  - `reservedQty -= quantity`, `withCustomerQty += quantity`.
- **`Returned` / `Completed`**: Inventory is returned back to store.
  - `withCustomerQty -= quantity`, `availableQty += quantity`.
- **`Cancelled`**: Can only occur *before* pickup (i.e. status is `Confirmed` or `Draft`).
  - Releases reservations (status `'Released'`).
  - Restores inventory: `reservedQty -= quantity`, `availableQty += quantity`.

---

## 3. Authorization & Permissions
- **Admin**: Full access. Can view and modify all quotations, orders, and reservations.
- **Vendor**: Can view any quotations or orders if they contain at least one product owned by the vendor (`product.vendorId = user.id`). Can update product inventory status, but cannot edit others' parts.
- **Customer**: Can only view and edit their own quotations/orders.

---

## 4. Verification Plan

### Automated Integration Tests (`server/src/modules/rental-order/tests/workflow.test.js`)
We will create a comprehensive validation suite performing the following workflow:
1. Seed test users (Customer, Vendor, Admin), products, variants, and stock.
2. Add items to cart.
3. Call `POST /api/quotations` to create a Draft quotation. Check correct subtotal, deposit, GST, and coupon calculations.
4. Verify update endpoints fail for confirmed quotations.
5. Confirm the quotation. Verify order, order items, reservations, and inventory stock changes are updated inside a transaction.
6. Cancel order. Verify reservation is released and stock is restored.
7. Attempt invalid status transitions (e.g. `Completed` -> `Confirmed`) and verify they are rejected.
