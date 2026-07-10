# Design Specification: Phase 2 — Cart + Pricing Engine

## Goal
Implement a robust, validated, and priced customer cart and a reusable pricing engine for the Rental ERP system. This includes automated cart management, date/duration-based rental calculations, GST, security deposits, and strict stock availability validation before items are committed.

## Architecture & Data Flow
The module conforms to a layered architecture:

```
Customer (HTTP Request)
     ↓
Cart Controller (Zod Validation, Route Handlers)
     ↓
Cart Service (Business logic: Merging, Pricing orchestration, Availability warning check)
     ↓
Availability Service (Overlap checks, Stock reservations check)
     ↓
Cart Repository / Inventory Repository (Drizzle database access)
     ↓
Database (PostgreSQL via Pool)
```

---

## Database Schema & Migrations

### 1. Schema Modifications (`server/src/db/schema/carts.schema.js`)
We will add `rentPeriod` to the `cartItems` table schema:
- **`rentPeriod`**: `text('rent_period').default('Day').notNull()` (options: `'Hour'`, `'Day'`, `'Week'`).

### 2. Schema Export (`server/src/db/schema/schema.js`)
Ensure `carts` and `cartItems` are imported and exported in the main schema registration file:
```javascript
import { carts, cartItems } from './carts.schema.js';
// Export them alongside other tables
export {
    // ...
    carts,
    cartItems
};
```

---

## Component Specifications

### 1. Pricing Service (`server/src/modules/pricing/pricing.service.js`)
Calculates all rental values based on rates and duration. It does not depend on repositories directly, but relies on caller providing pricing inputs (like variant price, product salePrice, or matching rate objects).

#### Functions
- **`calculateDuration(startDate, endDate, rentPeriod)`**:
  - `Hour`: `Math.ceil((endDate - startDate) / (3600 * 1000))`
  - `Day`: `Math.ceil((endDate - startDate) / (24 * 3600 * 1000))`
  - `Week`: `Math.ceil((endDate - startDate) / (7 * 24 * 3600 * 1000))`
- **`calculateRental(duration, price, quantity)`**:
  - Returns `duration * price * quantity`.
- **`calculateGST(subtotal)`**:
  - Returns `subtotal * 0.18` (18% GST).
- **`calculateDeposit(product, variant, quantity)`**:
  - If a base price is present (`variant?.price || product?.salePrice || product?.costPrice`):
    - `depositPerUnit = basePrice * 0.10`
  - Else:
    - `depositPerUnit = 5000` (fixed fallback).
  - Returns `depositPerUnit * quantity`.
- **`calculateCartSummary(items)`**:
  - Summarizes item-level calculations into the final cart metrics.
  - Returns:
    ```javascript
    {
        subtotal,
        gst,
        deposit,
        discount: 0.00,
        grandTotal: subtotal + gst + deposit
    }
    ```

### 2. Cart Repository (`server/src/modules/cart/cart.repository.js`)
Provides database operations. For fetching, it executes a single query joining `carts`, `cart_items`, `products`, `product_variants`, `product_images`, and `rental_rates`.

#### Query Join logic
- Left join `productVariants` on `cartItems.variantId = productVariants.id`.
- Left join `rentalRates` on `rentalRates.productId = cartItems.productId` and `rentalRates.variantId = cartItems.variantId` (or null check) and `rentalRates.period = cartItems.rentPeriod`.
- Left join `productImages` on `productImages.productId = cartItems.productId`.

### 3. Cart Service (`server/src/modules/cart/cart.service.js`)
Implements business rules for cart operations:
- **Fetch Cart**:
  - Calls `CartRepository.getCartWithItems(customerId)`.
  - For each cart item, validates current availability via `AvailabilityService.checkAvailability`. If unavailable, appends a warning tag (`INSUFFICIENT_STOCK` or `RESERVATION_CONFLICT`).
  - Checks if the product is unpublished/non-rentable and appends warning tags accordingly.
  - Mapped items are fully calculated using PricingService and returned with a grand summary.
- **Add Item**:
  - Finds or creates a cart for the customer.
  - Validates constraints: quantity > 0, dates in future (start >= today), end date > start date.
  - Calls `AvailabilityService.checkAvailability` to verify stock before adding.
  - **Merge logic**: If an item of the same product + variant + dates + period exists in the cart, sums the quantities and re-checks availability. If okay, updates the existing row's quantity. Else, adds a new row.
- **Update Item**:
  - Checks availability for new parameters (variant, dates, period, quantity) and updates the item if stock is available.
- **Remove/Clear**:
  - Deletes specific items or all items associated with the cart.

### 4. Cart Controller (`server/src/modules/cart/cart.controller.js`)
Exposes HTTP APIs, validating requests via Zod and responding in a standard format.

#### Endpoints
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:id`
- `DELETE /api/cart/items/:id`
- `DELETE /api/cart/clear`

---

## Edge Cases Evaluated
1. **Unpublished/Non-Rentable/Deleted Product**: Mapped as unavailable/skipped in fetch with appropriate warning flags; rejected during add/update.
2. **Duplicate Items Merging**: Merges identical period/product items if stock is available; rejects merge if it causes overbooking.
3. **Availability Check**: Leverages the peak event overlap check from `AvailabilityService`.
4. **Ownership Security**: All service operations receive `req.user.id` to restrict operations to the current customer's cart.

---

## Verification Plan

### Automated Verification
A direct node test script (`server/src/modules/cart/tests/cart.test.js`) will run integration steps:
1. Clear cart.
2. Add product (verify pricing, GST, and deposit).
3. Add duplicate product (verify merging).
4. Try adding more than availability (verify `INSUFFICIENT_STOCK` rejection).
5. Attempt modifying date range to overlap or past (verify validation).
6. Try updating item quantity (verify recalculations).
7. Delete item & clear cart (verify reset values).
