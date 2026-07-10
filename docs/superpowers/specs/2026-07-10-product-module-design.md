# Product Module Backend Design Specification

**Date**: 2026-07-10  
**Status**: Draft  
**Target Module**: Backend Product Module (`/api/products`)  

---

## 1. Objective & Scope

Integrate the **Product Module** into the Express backend. This module handles catalog products, pricing, stock tracking, publishing statuses, and product availability.

Key requirements:
- Create routes:
  - **Customer (Public)**:
    - `GET /api/products` (retrieves products, supports query filters `search`, `category`, `minPrice`, `maxPrice`)
    - `GET /api/products/:id` (retrieves a single product details by ID or Slug)
    - `GET /api/products/:id/availability` (retrieves current product inventory status)
  - **Vendor / Admin (Authenticated)**:
    - `POST /api/products` (creates a product)
    - `PATCH /api/products/:id` (updates a product)
    - `DELETE /api/products/:id` (deletes a product)
    - `PATCH /api/products/:id/publish` (publishes a product)
    - `PATCH /api/products/:id/unpublish` (unpublishes a product)
- Enforce Role-Based Access Control (RBAC):
  - Customer GET endpoints are public.
  - POST, PATCH, DELETE, publish, and unpublish require authentication and role of either `ADMIN` or `VENDOR`.
  - Vendors can only update or delete products they own (where `vendorId` equals their user `id`). Admins bypass this ownership check.

---

## 2. Database Schema Integration

The backend already has `products`, `product_variants`, `inventory`, and `rental_rates` schema files defined under `server/src/db/schema/`. We will register and export these schemas in the central registry [schema.js](file:///d:/VirtualRound/rental-management/server/src/db/schema/schema.js):

```javascript
import { products } from './products.schema.js';
import { productVariants } from './variants.schema.js';
import { inventory } from './inventory.schema.js';
import { rentalRates } from './rental-rates.schema.js';

// Add to export list...
```

---

## 3. API Endpoints Specification

### 3.1 GET /api/products (Public)
Retrieve products list. Returns published products for public users, and filters based on query parameters.
*   **Query Params**:
    *   `search` (string) - Partial case-insensitive match on product name or description.
    *   `category` (string) - Filters by category slug or category ID.
    *   `minPrice` (numeric) - Filters products where `salePrice` >= minPrice.
    *   `maxPrice` (numeric) - Filters products where `salePrice` <= maxPrice.
*   **Success Response (200 OK)**:
    ```json
    {
        "message": "Products retrieved successfully",
        "success": true,
        "error": null,
        "data": {
            "products": [
                {
                    "id": "8bc84b80-fa40-4284-9d51-140b991b1a78",
                    "name": "Heavy-Duty Hammer Drill",
                    "slug": "heavy-duty-hammer-drill",
                    "description": "High performance hammer drill",
                    "isRentable": true,
                    "published": true,
                    "costPrice": "45.00",
                    "salePrice": "89.99",
                    "stock": 15,
                    "createdAt": "2026-07-10T12:00:00.000Z",
                    "updatedAt": "2026-07-10T12:00:00.000Z",
                    "category": {
                        "id": "7ac15b80-fa40-4284-9d51-140b991b1a78",
                        "name": "Power Tools",
                        "slug": "power-tools"
                    },
                    "vendor": {
                        "id": "eef26ee6-0871-41ff-b1f0-db82a2f377e5",
                        "name": "Vendor User"
                    }
                }
            ]
        }
    }
    ```

### 3.2 GET /api/products/:id (Public)
Retrieve product details by UUID or Slug.
*   **Success Response (200 OK)**: Similar to GET /api/products list object.

### 3.3 POST /api/products (Vendor / Admin Only)
Create a new product.
*   **Authentication**: JWT required. Role must be `ADMIN` or `VENDOR`.
*   **Request Body**:
    ```json
    {
        "name": "Socket Wrench Set",
        "slug": "socket-wrench-set", // optional
        "description": "40-piece socket wrench set",
        "categoryId": "7ac15b80-fa40-4284-9d51-140b991b1a78",
        "isRentable": true, // optional
        "costPrice": 15.50, // optional
        "salePrice": 29.99,
        "stock": 20 // optional
    }
    ```
*   **Validation**:
    *   `name`: string, required, non-empty.
    *   `categoryId`: UUID, required, category must exist.
    *   `salePrice`: numeric/decimal, required, >= 0.
    *   `costPrice`: numeric/decimal, optional, >= 0.
    *   `stock`: integer, optional, >= 0.
*   **Business Logic**:
    *   Set `vendorId` to `req.user.id`.
    *   Auto-slugify `name` if `slug` is not provided. Verify slug uniqueness.

### 3.4 PATCH /api/products/:id (Vendor / Admin Only)
Update product details.
*   **Authorization**: If role is `VENDOR`, check if `product.vendorId === req.user.id`. If not, return `403 Forbidden`.

### 3.5 DELETE /api/products/:id (Vendor / Admin Only)
Delete product.
*   **Authorization**: Same ownership check for `VENDOR` role.

### 3.6 PATCH /api/products/:id/publish & /api/products/:id/unpublish (Vendor / Admin Only)
Toggle `published` state.
*   **Authorization**: Same ownership check for `VENDOR` role.
*   **Success Response (200 OK)**:
    ```json
    {
        "message": "Product published successfully",
        "success": true
    }
    ```

### 3.7 GET /api/products/:id/availability (Public)
Retrieve detailed product inventory levels.
*   **Business Logic**:
    1. Retrieve the product record (verify existence).
    2. Query `inventory` records matching `productId = :id`.
    3. Query `product_variants` records matching `productId = :id`.
    4. Compile results:
       - Total catalog stock.
       - Aggregated inventory levels (`availableQty`, `reservedQty`, `withCustomerQty`, `maintenanceQty`, `damagedQty`).
       - Variant-specific inventory details.
*   **Success Response (200 OK)**:
    ```json
    {
        "message": "Product availability retrieved successfully",
        "success": true,
        "error": null,
        "data": {
            "productId": "8bc84b80-fa40-4284-9d51-140b991b1a78",
            "name": "Heavy-Duty Hammer Drill",
            "stock": 15,
            "isRentable": true,
            "published": true,
            "inventory": {
                "availableQty": 10,
                "reservedQty": 2,
                "withCustomerQty": 3,
                "maintenanceQty": 0,
                "damagedQty": 0
            },
            "variants": [
                {
                    "variantId": "c4ee4c78-1a5c-43f1-bd2e-503c8cbcd356",
                    "sku": "HD-DRILL-RED",
                    "price": "94.99",
                    "stock": 5,
                    "availableQty": 3,
                    "reservedQty": 1,
                    "damagedQty": 1
                }
            ]
        }
    }
    ```

---

## 4. Architectural Implementation Blueprint

1.  **DAO Layer**: `server/src/dao/product.dao.js` for DB queries (using joins, standard Drizzle filtering).
2.  **Service Layer**: `server/src/modules/product/services/product.service.js` containing business operations (validating categories, verifying slug uniqueness, compiling inventory availability counts).
3.  **Validator Layer**: `server/src/modules/product/validators/product.validators.js` enforcing payload contracts.
4.  **Router Layer**: `server/src/modules/product/routes/product.routes.js` with authentication (`protect`, `restrictTo('ADMIN', 'VENDOR')`).
5.  **Main Router Integration**: Register router under `/api/products` in `server/src/app.js`.
