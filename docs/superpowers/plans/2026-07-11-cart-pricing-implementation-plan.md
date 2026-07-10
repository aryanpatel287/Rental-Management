# Cart + Pricing Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, validated, and priced customer cart and a reusable pricing service using Express, PostgreSQL, and Drizzle ORM.

**Architecture:** Layered architecture where Cart Controller routes flow to Cart Service, which calls Availability Service and Pricing Service, querying the DB via Cart Repository.

**Tech Stack:** Node.js, Express, PostgreSQL, Drizzle ORM, express-validator

## Global Constraints
- Naming conventions must match existing modules (camelCase for variables/functions).
- Express controllers must only handle HTTP concerns (status codes, response mapping, calling services).
- All business logic (GST, deposit, price calculation, date range, availability) must reside in services.
- Database access must be isolated to repository/DAO layers.
- Responses must use the `sendResponse` helper from `../../../utils/response.utlis.js`.

---

### Task 1: Database Schema Modification & Migration

**Files:**
- Modify: `server/src/db/schema/carts.schema.js`
- Modify: `server/src/db/schema/schema.js`

**Interfaces:**
- Produces: `carts`, `cartItems` tables in PostgreSQL database.

- [ ] **Step 1: Update carts.schema.js**
  Add `rentPeriod` column to the `cartItems` table in `server/src/db/schema/carts.schema.js`.
  ```javascript
  // server/src/db/schema/carts.schema.js
  // Add rentPeriod:
  rentPeriod: text('rent_period').default('Day').notNull(),
  ```

- [ ] **Step 2: Update schema.js**
  Register `carts` and `cartItems` in `server/src/db/schema/schema.js` so drizzle-kit recognizes them.
  ```javascript
  import { carts, cartItems } from './carts.schema.js';
  export {
      // existing...
      carts,
      cartItems
  };
  ```

- [ ] **Step 3: Run drizzle-kit generate**
  Run: `npx drizzle-kit generate` (from `server` directory)
  Expected: Success. A new migration SQL file is created in `server/drizzle/`.

- [ ] **Step 4: Run database migrations**
  Run: `node src/db/migrate.js` (from `server` directory)
  Expected: "Migrations completed successfully!" output.

- [ ] **Step 5: Commit changes**
  Run: `git add src/db/schema/carts.schema.js src/db/schema/schema.js drizzle/; git commit -m "feat: update cart schema and run migrations"`

---

### Task 2: Implement Pricing Service

**Files:**
- Create: `server/src/modules/pricing/pricing.service.js`

**Interfaces:**
- Produces: `calculateDuration(startDate, endDate, rentPeriod)`, `calculateRental(duration, price, quantity)`, `calculateGST(subtotal)`, `calculateDeposit(product, variant, quantity)`, `calculateCartSummary(items)`.

- [ ] **Step 1: Write Pricing Service**
  Create `server/src/modules/pricing/pricing.service.js` with duration, subtotal, GST, deposit, and cart summary calculations.
  ```javascript
  export function calculateDuration(startDate, endDate, rentPeriod = 'Day') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = end.getTime() - start.getTime();
      
      if (isNaN(diffMs) || diffMs <= 0) return 0;

      switch (rentPeriod) {
          case 'Hour':
              return Math.ceil(diffMs / (1000 * 60 * 60));
          case 'Week':
              return Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
          case 'Day':
          default:
              return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
  }

  export function calculateRental(duration, price, quantity) {
      return Number((duration * price * quantity).toFixed(2));
  }

  export function calculateGST(subtotal) {
      return Number((subtotal * 0.18).toFixed(2));
  }

  export function calculateDeposit(product, variant, quantity) {
      const basePrice = Number(variant?.price || product?.salePrice || product?.costPrice || 0);
      const depositPerUnit = basePrice > 0 ? Number((basePrice * 0.10).toFixed(2)) : 5000;
      return Number((depositPerUnit * quantity).toFixed(2));
  }

  export function calculateCartSummary(items) {
      const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const deposit = items.reduce((sum, item) => sum + (item.deposit || 0), 0);
      const gst = calculateGST(subtotal);
      const discount = 0;
      const grandTotal = Number((subtotal + gst + deposit - discount).toFixed(2));

      return {
          subtotal,
          gst,
          deposit,
          discount,
          grandTotal
      };
  }
  ```

- [ ] **Step 2: Create a scratch file to verify calculations**
  Write a temporary test script `server/src/modules/pricing/pricing.test.js` to assert the math works perfectly.
  ```javascript
  import { calculateDuration, calculateRental, calculateGST, calculateDeposit, calculateCartSummary } from './pricing.service.js';

  console.log('Testing Pricing Service...');
  const duration = calculateDuration('2026-07-01', '2026-07-05', 'Day');
  if (duration !== 4) throw new Error(`Duration failed: ${duration}`);

  const rental = calculateRental(4, 500, 2);
  if (rental !== 4000) throw new Error(`Rental failed: ${rental}`);

  const gst = calculateGST(4000);
  if (gst !== 720) throw new Error(`GST failed: ${gst}`);

  const deposit = calculateDeposit({ salePrice: '25000' }, null, 2);
  if (deposit !== 5000) throw new Error(`Deposit failed: ${deposit}`);

  console.log('All pricing calculations verified successfully!');
  ```

- [ ] **Step 3: Run the scratch script**
  Run: `node src/modules/pricing/pricing.test.js` (from `server` directory)
  Expected: Logs "All pricing calculations verified successfully!".

- [ ] **Step 4: Clean up scratch test & commit**
  Remove the test script (or keep it under tests if useful) and commit:
  Run: `rm src/modules/pricing/pricing.test.js; git add src/modules/pricing/pricing.service.js; git commit -m "feat: implement pricing service"`

---

### Task 3: Implement Cart Repository

**Files:**
- Create: `server/src/modules/cart/cart.repository.js`

**Interfaces:**
- Produces: `findOrCreateCart(customerId)`, `getCartWithItems(customerId)`, `findItemById(itemId)`, `createItem(data)`, `updateItem(itemId, updates)`, `deleteItem(itemId)`, `clear(cartId)`.

- [ ] **Step 1: Write Cart Repository**
  Create `server/src/modules/cart/cart.repository.js` with database operations using Drizzle ORM.
  Implement a single join query for fetching the cart:
  ```javascript
  import { db } from '../../config/database.js';
  import { carts, cartItems } from '../../db/schema/carts.schema.js';
  import { products } from '../../db/schema/products.schema.js';
  import { productVariants } from '../../db/schema/variants.schema.js';
  import { productImages } from '../../db/schema/product-images.schema.js';
  import { rentalRates } from '../../db/schema/rental-rates.schema.js';
  import { eq, and, or, sql } from 'drizzle-orm';

  export async function findOrCreateCart(customerId) {
      const existing = await db.select().from(carts).where(eq(carts.customerId, customerId)).limit(1);
      if (existing.length > 0) return existing[0];
      const [newCart] = await db.insert(carts).values({ customerId }).returning();
      return newCart;
  }

  export async function getCartWithItems(customerId) {
      const cart = await findOrCreateCart(customerId);
      
      const rows = await db.select({
          itemId: cartItems.id,
          productId: cartItems.productId,
          variantId: cartItems.variantId,
          quantity: cartItems.quantity,
          rentPeriod: cartItems.rentPeriod,
          rentalStart: cartItems.rentalStart,
          rentalEnd: cartItems.rentalEnd,
          productName: products.name,
          productIsRentable: products.isRentable,
          productPublished: products.published,
          productSalePrice: products.salePrice,
          productCostPrice: products.costPrice,
          variantSku: productVariants.sku,
          variantPrice: productVariants.price,
          variantIsPublished: productVariants.isPublished,
          ratePrice: rentalRates.price,
          imageUrl: productImages.url
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .leftJoin(productImages, eq(cartItems.productId, productImages.productId))
      .leftJoin(
          rentalRates,
          and(
              eq(rentalRates.productId, cartItems.productId),
              or(
                  eq(rentalRates.variantId, cartItems.variantId),
                  and(sql`${rentalRates.variantId} IS NULL`, sql`${cartItems.variantId} IS NULL`)
              ),
              eq(rentalRates.period, cartItems.rentPeriod)
          )
      )
      .where(eq(cartItems.cartId, cart.id));

      return { cartId: cart.id, rows };
  }

  export async function findItemById(itemId) {
      const [item] = await db.select().from(cartItems).where(eq(cartItems.id, itemId)).limit(1);
      return item || null;
  }

  export async function createItem(data) {
      const [item] = await db.insert(cartItems).values(data).returning();
      return item;
  }

  export async function updateItem(itemId, updates) {
      const [item] = await db.update(cartItems)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(cartItems.id, itemId))
          .returning();
      return item;
  }

  export async function deleteItem(itemId) {
      return db.delete(cartItems).where(eq(cartItems.id, itemId)).returning();
  }

  export async function clear(cartId) {
      return db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }
  ```

- [ ] **Step 2: Commit repository**
  Run: `git add src/modules/cart/cart.repository.js; git commit -m "feat: implement cart repository"`

---

### Task 4: Implement Cart Service

**Files:**
- Create: `server/src/modules/cart/cart.service.js`

**Interfaces:**
- Consumes: `AvailabilityService.checkAvailability`, `PricingService` functions.
- Produces: `getCart(customerId)`, `addItem(customerId, itemData)`, `updateItem(customerId, itemId, updates)`, `removeItem(customerId, itemId)`, `clearCart(customerId)`.

- [ ] **Step 1: Write Cart Service**
  Create `server/src/modules/cart/cart.service.js` implementing cart logic:
  - Formats cart output with summaries.
  - Resolves availabilities and warnings.
  - Merges duplicate additions of identical products/variants/periods/dates.
  ```javascript
  import * as cartRepo from './cart.repository.js';
  import * as pricingService from '../pricing/pricing.service.js';
  import { checkAvailability } from '../availability/services/availability.service.js';
  import { db } from '../../config/database.js';
  import { products, productVariants } from '../../db/schema/schema.js';
  import { eq } from 'drizzle-orm';

  export async function getCart(customerId) {
      const { cartId, rows } = await cartRepo.getCartWithItems(customerId);
      if (rows.length === 0) {
          return { cartId, items: [], summary: null };
      }

      const items = [];
      for (const row of rows) {
          const item = {
              id: row.itemId,
              productId: row.productId,
              variantId: row.variantId,
              quantity: row.quantity,
              startDate: row.rentalStart,
              endDate: row.rentalEnd,
              rentPeriod: row.rentPeriod,
              productName: row.productName,
              variantSku: row.variantSku,
              imageUrl: row.imageUrl,
              availabilityWarning: null
          };

          // 1. Validate Product Status & Settings
          if (!row.productIsRentable) {
              item.availabilityWarning = 'PRODUCT_NOT_RENTABLE';
          } else if (!row.productPublished) {
              item.availabilityWarning = 'PRODUCT_UNPUBLISHED';
          } else if (row.variantId && !row.variantIsPublished) {
              item.availabilityWarning = 'VARIANT_UNPUBLISHED';
          } else {
              // 2. Validate current stock availability
              try {
                  const availability = await checkAvailability({
                      productId: row.productId,
                      variantId: row.variantId,
                      quantity: row.quantity,
                      startDate: row.rentalStart,
                      endDate: row.rentalEnd
                  });
                  if (!availability.available) {
                      item.availabilityWarning = availability.reason || 'INSUFFICIENT_STOCK';
                  }
              } catch (err) {
                  item.availabilityWarning = err.message || 'AVAILABILITY_ERROR';
              }
          }

          // 3. Pricing calculations
          const ratePrice = row.ratePrice || row.variantPrice || row.productSalePrice || 0;
          const price = Number(ratePrice);
          const duration = pricingService.calculateDuration(row.rentalStart, row.rentalEnd, row.rentPeriod);
          const subtotal = pricingService.calculateRental(duration, price, row.quantity);
          const deposit = pricingService.calculateDeposit(
              { salePrice: row.productSalePrice, costPrice: row.productCostPrice },
              row.variantId ? { price: row.variantPrice } : null,
              row.quantity
          );

          item.price = price;
          item.duration = duration;
          item.subtotal = subtotal;
          item.deposit = deposit;

          items.push(item);
      }

      // Calculate cart summary based only on valid items
      const validItems = items.filter(it => !it.availabilityWarning);
      const summary = pricingService.calculateCartSummary(validItems);

      return {
          cartId,
          items,
          summary
      };
  }

  export async function addItem(customerId, { productId, variantId, quantity, startDate, endDate, rentPeriod = 'Day' }) {
      const cart = await cartRepo.findOrCreateCart(customerId);
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
          throw new Error('INVALID_DATE_RANGE');
      }
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (start < todayStart) {
          throw new Error('INVALID_DATE_RANGE');
      }
      if (quantity <= 0) {
          throw new Error('INVALID_QUANTITY');
      }

      // Check product is published & rentable
      const [prod] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      if (!prod) throw new Error('PRODUCT_NOT_FOUND');
      if (!prod.published) throw new Error('PRODUCT_UNPUBLISHED');
      if (!prod.isRentable) throw new Error('PRODUCT_NOT_RENTABLE');

      // Check variant is published if provided
      if (variantId) {
          const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
          if (!variant) throw new Error('VARIANT_NOT_FOUND');
          if (!variant.isPublished) throw new Error('VARIANT_UNPUBLISHED');
      }

      // Get current items in cart to see if we can merge
      const { rows } = await cartRepo.getCartWithItems(customerId);
      
      const duplicateRow = rows.find(r => 
          r.productId === productId &&
          r.variantId === variantId &&
          new Date(r.rentalStart).getTime() === start.getTime() &&
          new Date(r.rentalEnd).getTime() === end.getTime() &&
          r.rentPeriod === rentPeriod
      );

      const targetQty = duplicateRow ? duplicateRow.quantity + quantity : quantity;

      // Validate availability for target quantity
      const check = await checkAvailability({ productId, variantId, quantity: targetQty, startDate, endDate });
      if (!check.available) {
          throw new Error(check.reason || 'INSUFFICIENT_STOCK');
      }

      if (duplicateRow) {
          await cartRepo.updateItem(duplicateRow.itemId, { quantity: targetQty });
      } else {
          await cartRepo.createItem({
              cartId: cart.id,
              productId,
              variantId,
              quantity,
              rentPeriod,
              rentalStart: start,
              rentalEnd: end
          });
      }

      return getCart(customerId);
  }

  export async function updateItem(customerId, itemId, { quantity, variantId, startDate, endDate, rentPeriod }) {
      const item = await cartRepo.findItemById(itemId);
      if (!item) throw new Error('ITEM_NOT_FOUND');

      const { cartId } = await cartRepo.getCartWithItems(customerId);
      if (item.cartId !== cartId) throw new Error('Forbidden');

      const updatedFields = {
          quantity: quantity !== undefined ? quantity : item.quantity,
          variantId: variantId !== undefined ? variantId : item.variantId,
          rentalStart: startDate ? new Date(startDate) : new Date(item.rentalStart),
          rentalEnd: endDate ? new Date(endDate) : new Date(item.rentalEnd),
          rentPeriod: rentPeriod !== undefined ? rentPeriod : item.rentPeriod
      };

      if (updatedFields.quantity <= 0) {
          throw new Error('INVALID_QUANTITY');
      }
      if (updatedFields.rentalStart >= updatedFields.rentalEnd) {
          throw new Error('INVALID_DATE_RANGE');
      }
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (updatedFields.rentalStart < todayStart) {
          throw new Error('INVALID_DATE_RANGE');
      }

      if (updatedFields.variantId) {
          const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, updatedFields.variantId)).limit(1);
          if (!variant) throw new Error('VARIANT_NOT_FOUND');
          if (variant.productId !== item.productId) throw new Error('VARIANT_NOT_FOUND');
          if (!variant.isPublished) throw new Error('VARIANT_UNPUBLISHED');
      }

      // Check stock availability for updated properties
      const check = await checkAvailability({
          productId: item.productId,
          variantId: updatedFields.variantId,
          quantity: updatedFields.quantity,
          startDate: updatedFields.rentalStart.toISOString(),
          endDate: updatedFields.rentalEnd.toISOString()
      });
      if (!check.available) {
          throw new Error(check.reason || 'INSUFFICIENT_STOCK');
      }

      await cartRepo.updateItem(itemId, updatedFields);
      return getCart(customerId);
  }

  export async function removeItem(customerId, itemId) {
      const item = await cartRepo.findItemById(itemId);
      if (!item) throw new Error('ITEM_NOT_FOUND');

      const { cartId } = await cartRepo.getCartWithItems(customerId);
      if (item.cartId !== cartId) throw new Error('Forbidden');

      await cartRepo.deleteItem(itemId);
      return getCart(customerId);
  }

  export async function clearCart(customerId) {
      const cart = await cartRepo.findOrCreateCart(customerId);
      await cartRepo.clear(cart.id);
      return { cartId: cart.id, items: [], summary: null };
  }
  ```

- [ ] **Step 2: Commit service**
  Run: `git add src/modules/cart/cart.service.js; git commit -m "feat: implement cart service"`

---

### Task 5: Implement Cart Controller & Routes

**Files:**
- Create: `server/src/modules/cart/validators/cart.validators.js`
- Create: `server/src/modules/cart/controllers/cart.controller.js`
- Create: `server/src/modules/cart/routes/cart.routes.js`
- Create: `server/src/modules/cart/index.js`
- Modify: `server/src/app.js`

**Interfaces:**
- Consumes: CartService methods.
- Produces: API endpoints:
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PATCH /api/cart/items/:id`
  - `DELETE /api/cart/items/:id`
  - `DELETE /api/cart/clear`

- [ ] **Step 1: Write Cart Validators**
  Create `server/src/modules/cart/validators/cart.validators.js` using `express-validator`:
  ```javascript
  import { body, param } from 'express-validator';
  import { sendResponse } from '../../../utils/response.utlis.js';
  import { validationResult } from 'express-validator';

  function validateRequest(req, res, next) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return sendResponse({
              res,
              statusCode: 400,
              message: 'Validation failed',
              success: false,
              errors: errors.array(),
          });
      }
      next();
  }

  export const addItemValidator = [
      body('productId').isUUID().withMessage('productId must be a valid UUID'),
      body('variantId').optional({ nullable: true }).isUUID().withMessage('variantId must be a valid UUID'),
      body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
      body('startDate').isISO8601().withMessage('startDate must be a valid ISO8601 date'),
      body('endDate').isISO8601().withMessage('endDate must be a valid ISO8601 date'),
      body('rentPeriod').optional().isIn(['Hour', 'Day', 'Week']).withMessage('rentPeriod must be Hour, Day, or Week'),
      validateRequest
  ];

  export const updateItemValidator = [
      param('id').isUUID().withMessage('id must be a valid UUID'),
      body('quantity').optional().isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
      body('variantId').optional({ nullable: true }).isUUID().withMessage('variantId must be a valid UUID'),
      body('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO8601 date'),
      body('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO8601 date'),
      body('rentPeriod').optional().isIn(['Hour', 'Day', 'Week']).withMessage('rentPeriod must be Hour, Day, or Week'),
      validateRequest
  ];

  export const deleteItemValidator = [
      param('id').isUUID().withMessage('id must be a valid UUID'),
      validateRequest
  ];
  ```

- [ ] **Step 2: Write Cart Controller**
  Create `server/src/modules/cart/controllers/cart.controller.js` to dispatch calls and format errors.
  ```javascript
  import * as cartService from '../services/cart.service.js';
  import { sendResponse } from '../../../utils/response.utlis.js';

  function mapError(error) {
      const message = error.message;
      let statusCode = 500;

      if ([
          'CART_NOT_FOUND', 'ITEM_NOT_FOUND', 'PRODUCT_NOT_FOUND', 
          'VARIANT_NOT_FOUND', 'INVENTORY_NOT_FOUND'
      ].includes(message)) {
          statusCode = 404;
      } else if ([
          'INVALID_DATE_RANGE', 'INVALID_QUANTITY', 
          'PRODUCT_NOT_RENTABLE', 'PRODUCT_UNPUBLISHED', 'VARIANT_UNPUBLISHED'
      ].includes(message)) {
          statusCode = 400;
      } else if (['INSUFFICIENT_STOCK', 'RESERVATION_CONFLICT'].includes(message)) {
          statusCode = 409;
      } else if (message === 'Forbidden') {
          statusCode = 403;
      }

      return { statusCode, code: message };
  }

  export async function getCart(req, res) {
      try {
          const cart = await cartService.getCart(req.user.id);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Cart retrieved successfully',
              success: true,
              data: cart
          });
      } catch (error) {
          console.error('Error fetching cart:', error);
          const { statusCode, code } = mapError(error);
          return sendResponse({
              res,
              statusCode,
              message: error.message || 'Internal server error',
              success: false,
              error: code
          });
      }
  }

  export async function addItem(req, res) {
      try {
          const cart = await cartService.addItem(req.user.id, req.body);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Item added to cart successfully',
              success: true,
              data: cart
          });
      } catch (error) {
          console.error('Error adding item to cart:', error);
          const { statusCode, code } = mapError(error);
          return sendResponse({
              res,
              statusCode,
              message: error.message || 'Internal server error',
              success: false,
              error: code
          });
      }
  }

  export async function updateItem(req, res) {
      try {
          const cart = await cartService.updateItem(req.user.id, req.params.id, req.body);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Cart item updated successfully',
              success: true,
              data: cart
          });
      } catch (error) {
          console.error('Error updating cart item:', error);
          const { statusCode, code } = mapError(error);
          return sendResponse({
              res,
              statusCode,
              message: error.message || 'Internal server error',
              success: false,
              error: code
          });
      }
  }

  export async function removeItem(req, res) {
      try {
          const cart = await cartService.removeItem(req.user.id, req.params.id);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Item removed from cart successfully',
              success: true,
              data: cart
          });
      } catch (error) {
          console.error('Error removing item from cart:', error);
          const { statusCode, code } = mapError(error);
          return sendResponse({
              res,
              statusCode,
              message: error.message || 'Internal server error',
              success: false,
              error: code
          });
      }
  }

  export async function clearCart(req, res) {
      try {
          const cart = await cartService.clearCart(req.user.id);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Cart cleared successfully',
              success: true,
              data: cart
          });
      } catch (error) {
          console.error('Error clearing cart:', error);
          const { statusCode, code } = mapError(error);
          return sendResponse({
              res,
              statusCode,
              message: error.message || 'Internal server error',
              success: false,
              error: code
          });
      }
  }
  ```

- [ ] **Step 3: Write Cart Routes**
  Create `server/src/modules/cart/routes/cart.routes.js`.
  ```javascript
  import { Router } from 'express';
  import * as cartController from '../controllers/cart.controller.js';
  import { protect } from '../../auth/index.js';
  import { addItemValidator, updateItemValidator, deleteItemValidator } from '../validators/cart.validators.js';

  const router = Router();

  router.use(protect); // All routes require authentication

  router.get('/', cartController.getCart);
  router.post('/items', addItemValidator, cartController.addItem);
  router.patch('/items/:id', updateItemValidator, cartController.updateItem);
  router.delete('/items/:id', deleteItemValidator, cartController.removeItem);
  router.delete('/clear', cartController.clearCart);

  export default router;
  ```

- [ ] **Step 4: Create Cart index.js**
  Create `server/src/modules/cart/index.js`.
  ```javascript
  import cartRouter from './routes/cart.routes.js';
  export { cartRouter };
  ```

- [ ] **Step 5: Wire Cart Router in app.js**
  Modify `server/src/app.js` to register the new cart router.
  ```javascript
  // Import:
  import { cartRouter } from './modules/cart/index.js';

  // Mount:
  app.use('/api/cart', cartRouter);
  ```

- [ ] **Step 6: Commit Controller & Route changes**
  Run: `git add src/modules/cart/ src/app.js; git commit -m "feat: implement cart controller, validators, routes, and mount in app.js"`

---

### Task 6: E2E Integration Testing

**Files:**
- Create: `server/src/modules/cart/tests/cart.test.js`

- [ ] **Step 1: Write E2E Integration Test Script**
  Create `server/src/modules/cart/tests/cart.test.js` mimicking the style of `inventory.test.js` to verify cart features.
  The test should:
  1. Login as Admin.
  2. Create test product & inventory with 5 capacity.
  3. POST `/cart/items` with 2 units. Assert summary subtotal, GST, deposit, total.
  4. POST `/cart/items` with duplicate details. Assert merged quantity of 4.
  5. POST `/cart/items` with additional quantity exceeding limit (verify 409 INSUFFICIENT_STOCK).
  6. PATCH `/cart/items/:id` with new quantity/dates.
  7. DELETE `/cart/items/:id` remove item.
  8. DELETE `/cart/clear` reset.
  9. Clean up.
  ```javascript
  import 'dotenv/config';
  import envConfig from '../../../config/envConfig.js';
  import { db, pool } from '../../../config/database.js';
  import { products, productVariants, inventory, categories, users, carts, cartItems } from '../../../db/schema/schema.js';
  import { eq } from 'drizzle-orm';
  import fs from 'fs';
  import path from 'path';
  import { fileURLToPath } from 'url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const LOG_FILE = path.resolve(__dirname, './test-results.log');

  const logLines = [];
  function log(msg) {
      console.log(msg);
      logLines.push(msg);
  }

  async function writeLogsToFile() {
      try {
          fs.writeFileSync(LOG_FILE, logLines.join('\n') + '\n');
      } catch (err) {
          console.error('Failed to write logs to file', err);
      }
  }

  const PORT = envConfig.SERVER_PORT || 3000;
  const BASE_URL = `http://localhost:${PORT}/api`;

  async function testCartModule() {
      log('=== STARTING CART INTEGRATION TESTS ===');
      log(`Connecting to: ${BASE_URL}\n`);

      let adminCookie = '';
      let testProductId = '';
      let testVariantId = null;
      let cleanupNeeded = false;
      let testCategoryId = '';
      let testAdminUserId = '';

      try {
          log('Step 0: Locating admin user and seeding test product...');
          const adminUsers = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
          if (!adminUsers.length) {
              throw new Error('Admin user (admin@example.com) must exist. Run seeder first.');
          }
          testAdminUserId = adminUsers[0].id;

          const [cat] = await db.insert(categories).values({
              name: 'Test Category for Cart',
              slug: `test-cat-cart-${Date.now()}`
          }).returning();
          testCategoryId = cat.id;

          const [prod] = await db.insert(products).values({
              name: 'Test Camera Lens',
              slug: `test-camera-lens-${Date.now()}`,
              vendorId: testAdminUserId,
              categoryId: testCategoryId,
              isRentable: true,
              published: true,
              salePrice: '10000.00',
              costPrice: '8000.00',
              stock: 5
          }).returning();
          testProductId = prod.id;

          const [variant] = await db.insert(productVariants).values({
              productId: testProductId,
              sku: `TEST-LENS-VAR-${Date.now()}`,
              price: '12000.00',
              stock: 5,
              isPublished: true
          }).returning();
          testVariantId = variant.id;

          await db.insert(inventory).values({
              productId: testProductId,
              variantId: testVariantId,
              availableQty: 5,
              reservedQty: 0,
              withCustomerQty: 0,
              maintenanceQty: 0,
              damagedQty: 0
          });

          cleanupNeeded = true;
          log(`Created test inventory: Product ID ${testProductId}, Variant ID ${testVariantId}`);

          log('\nStep 1: Logging in as Admin...');
          const loginRes = await fetch(`${BASE_URL}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
          });
          const loginData = await loginRes.json();
          if (!loginRes.ok) throw new Error('Login failed');

          const rawCookie = loginRes.headers.get('set-cookie');
          if (rawCookie) {
              adminCookie = rawCookie.split(';')[0];
          }
          log('Login successful.');

          // Clear cart first to start fresh
          await fetch(`${BASE_URL}/cart/clear`, {
              method: 'DELETE',
              headers: { Cookie: adminCookie }
          });

          log('\nStep 2: Testing POST /cart/items (Add Item)...');
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 2); // 2 days in future
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 6); // 6 days in future (duration = 4 days)

          const addRes = await fetch(`${BASE_URL}/cart/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
              body: JSON.stringify({
                  productId: testProductId,
                  variantId: testVariantId,
                  quantity: 2,
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0],
                  rentPeriod: 'Day'
              })
          });
          const addData = await addRes.json();
          log(`Status: ${addRes.status} (Expected: 200)`);
          log(`Success: ${addData.success} (Expected: true)`);
          log(`Cart Item Count: ${addData.data.items.length} (Expected: 1)`);
          
          const firstItem = addData.data.items[0];
          log(`Calculated Duration: ${firstItem.duration} (Expected: 4)`);
          log(`Item Subtotal: ${firstItem.subtotal} (Expected: 96000 [4 days * 12000 price * 2 quantity])`);
          log(`Item Deposit: ${firstItem.deposit} (Expected: 2400 [10% of 12000 * 2 quantity])`);
          log(`GST: ${addData.data.summary.gst} (Expected: 17280 [18% of 96000])`);
          log(`Grand Total: ${addData.data.summary.grandTotal} (Expected: 115680 [96000 + 17280 + 2400])`);

          log('\nStep 3: Testing duplicate merge logic (Adding same item again)...');
          const mergeRes = await fetch(`${BASE_URL}/cart/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
              body: JSON.stringify({
                  productId: testProductId,
                  variantId: testVariantId,
                  quantity: 2,
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0],
                  rentPeriod: 'Day'
              })
          });
          const mergeData = await mergeRes.json();
          log(`Status: ${mergeRes.status} (Expected: 200)`);
          log(`Cart Item Count: ${mergeData.data.items.length} (Expected: 1 - merged)`);
          log(`Merged Quantity: ${mergeData.data.items[0].quantity} (Expected: 4)`);

          log('\nStep 4: Testing overbooking rejection...');
          const overRes = await fetch(`${BASE_URL}/cart/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
              body: JSON.stringify({
                  productId: testProductId,
                  variantId: testVariantId,
                  quantity: 2, // Total would be 4 + 2 = 6, which exceeds stock capacity (5)
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0],
                  rentPeriod: 'Day'
              })
          });
          const overData = await overRes.json();
          log(`Status: ${overRes.status} (Expected: 409 or 400)`);
          log(`Error Code: ${overData.error} (Expected: INSUFFICIENT_STOCK or RESERVATION_CONFLICT)`);

          log('\nStep 5: Testing PATCH /cart/items/:id (Update Quantity to 3)...');
          const itemId = mergeData.data.items[0].id;
          const patchRes = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
              body: JSON.stringify({ quantity: 3 })
          });
          const patchData = await patchRes.json();
          log(`Status: ${patchRes.status} (Expected: 200)`);
          log(`New Quantity: ${patchData.data.items[0].quantity} (Expected: 3)`);

          log('\nStep 6: Testing GET /cart (Retrieve Cart)...');
          const getRes = await fetch(`${BASE_URL}/cart`, {
              method: 'GET',
              headers: { Cookie: adminCookie }
          });
          const getData = await getRes.json();
          log(`Status: ${getRes.status} (Expected: 200)`);
          log(`Success: ${getData.success} (Expected: true)`);
          log(`Cart ID matches: ${getData.data.cartId === addData.data.cartId}`);

          log('\nStep 7: Testing DELETE /cart/items/:id...');
          const delRes = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
              method: 'DELETE',
              headers: { Cookie: adminCookie }
          });
          const delData = await delRes.json();
          log(`Status: ${delRes.status} (Expected: 200)`);
          log(`Cart Items Length: ${delData.data.items.length} (Expected: 0)`);

          log('\nStep 8: Testing DELETE /cart/clear...');
          // Add one item back first
          await fetch(`${BASE_URL}/cart/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
              body: JSON.stringify({
                  productId: testProductId,
                  variantId: testVariantId,
                  quantity: 1,
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0]
              })
          });
          const clearRes = await fetch(`${BASE_URL}/cart/clear`, {
              method: 'DELETE',
              headers: { Cookie: adminCookie }
          });
          const clearData = await clearRes.json();
          log(`Status: ${clearRes.status} (Expected: 200)`);
          log(`Cleared items: ${clearData.data.items.length} (Expected: 0)`);
          log(`Summary: ${clearData.data.summary} (Expected: null)`);

          log('\nStep 9: Testing Date validations...');
          const pastStart = new Date();
          pastStart.setDate(pastStart.getDate() - 2); // 2 days in past
          const pastEnd = new Date();
          pastEnd.setDate(pastEnd.getDate() + 1);

          const invalidRes = await fetch(`${BASE_URL}/cart/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
              body: JSON.stringify({
                  productId: testProductId,
                  variantId: testVariantId,
                  quantity: 1,
                  startDate: pastStart.toISOString().split('T')[0],
                  endDate: pastEnd.toISOString().split('T')[0]
              })
          });
          const invalidData = await invalidRes.json();
          log(`Status: ${invalidRes.status} (Expected: 400)`);
          log(`Error: ${invalidData.error} (Expected: INVALID_DATE_RANGE)`);

      } catch (err) {
          log(`TEST RUNNER ERROR: ${err.message}`);
      } finally {
          if (cleanupNeeded) {
              log('\nStep 10: Cleaning up database test records...');
              try {
                  // Find and delete the cart item references
                  const userCarts = await db.select().from(carts).where(eq(carts.customerId, testAdminUserId));
                  for (const c of userCarts) {
                      await db.delete(cartItems).where(eq(cartItems.cartId, c.id));
                      await db.delete(carts).where(eq(carts.id, c.id));
                  }
                  await db.delete(inventory).where(eq(inventory.productId, testProductId));
                  await db.delete(productVariants).where(eq(productVariants.productId, testProductId));
                  await db.delete(products).where(eq(products.id, testProductId));
                  await db.delete(categories).where(eq(categories.id, testCategoryId));
                  log('Cleanup completed successfully.');
              } catch (cleanErr) {
                  log(`Failed to cleanup database: ${cleanErr.message}`);
              }
          }
      }

      log('\n=== CART INTEGRATION TESTS COMPLETED ===');
      await writeLogsToFile();
      process.exit(0);
  }

  testCartModule();
  ```

- [ ] **Step 2: Commit E2E Tests**
  Run: `git add src/modules/cart/tests/cart.test.js; git commit -m "test: add cart module E2E integration test script"`
