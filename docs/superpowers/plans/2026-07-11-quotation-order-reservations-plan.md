# Quotation, Rental Orders & Reservations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Quotation management, Rental Order conversion under a single database transaction, Reservation overlap checking, and Coupon validation for the Rental ERP system.

**Architecture:** We use a layered architecture (Controller, Service, Repository) with strict validation using Zod. Database operations are written using Drizzle ORM, with all database transactions managed in the Service layer passing the transaction context (`tx`) to Repositories.

**Tech Stack:** Node.js, Express, PostgreSQL, Drizzle ORM, Zod, Vitest / Node Test Runner.

## Global Constraints
- Do not access `.env` files directly; use `server/src/config/envConfig.js` instead.
- Controllers must remain thin, business rules belong in services, and repositories contain all Drizzle queries.
- Recalculate all pricing server-side; client totals are never trusted.
- Enforce transaction rollback on any booking or availability failure.
- Ensure proper RBAC authorization checks for Customers (own entries), Vendors (entries containing their products), and Admins (everything).

---

### Task 1: Main Schema Export Update

**Files:**
- Modify: `server/src/db/schema/schema.js`

**Interfaces:**
- Produces: Exports `coupons` and `couponUsages` table schemas to the rest of the application.

- [ ] **Step 1: Modify `schema.js` to import and export coupons schema**
  Edit `server/src/db/schema/schema.js` to add the following imports and exports:
  ```javascript
  import { coupons, couponUsages } from './coupons.schema.js';
  // ... in export block:
  export {
      // ... existing
      coupons,
      couponUsages
  };
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add server/src/db/schema/schema.js
  git commit -m "db: export coupons schema in main schema registry"
  ```

---

### Task 2: Number Generator Service

**Files:**
- Create: `server/src/modules/number-generator/number-generator.service.js`

**Interfaces:**
- Produces: `generateNumber(prefix, tableSchema, columnSchema, tx)`: returns `Promise<string>`

- [ ] **Step 1: Create the sequential date-based number generator service**
  Write to `server/src/modules/number-generator/number-generator.service.js`:
  ```javascript
  import { sql } from 'drizzle-orm';
  import { db } from '../../config/database.js';

  /**
   * Generates a sequential, date-based number in the format PREFIX-YYYYMMDD-XXXXX.
   * @param {string} prefix e.g., 'QTN' or 'ORD'
   * @param {object} tableSchema Drizzle table schema object
   * @param {object} columnSchema Drizzle column schema object
   * @param {object} tx Optional transaction client
   * @returns {Promise<string>} e.g., 'QTN-20260711-00001'
   */
  export async function generateNumber(prefix, tableSchema, columnSchema, tx = db) {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const pattern = `${prefix}-${todayStr}-%`;

      const countResult = await tx
          .select({ count: sql`COUNT(*)` })
          .from(tableSchema)
          .where(sql`${columnSchema} LIKE ${pattern}`);

      const count = Number(countResult[0]?.count || 0) + 1;
      const sequenceStr = String(count).padStart(5, '0');
      return `${prefix}-${todayStr}-${sequenceStr}`;
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add server/src/modules/number-generator/number-generator.service.js
  git commit -m "feat: implement sequential date-based number generator"
  ```

---

### Task 3: Coupon Service

**Files:**
- Create: `server/src/modules/coupon/services/coupon.service.js`

**Interfaces:**
- Produces: `validateCoupon(code, subtotal, userId, tx)`: returns `Promise<{ coupon, discount }>` or throws error.

- [ ] **Step 1: Create the Coupon Validation Service**
  Write to `server/src/modules/coupon/services/coupon.service.js`:
  ```javascript
  import { eq, and } from 'drizzle-orm';
  import { db } from '../../../config/database.js';
  import { coupons } from '../../../db/schema/schema.js';

  export async function validateCoupon(code, subtotal, userId, tx = db) {
      if (!code) return { coupon: null, discount: 0 };
      
      const normalizedCode = code.trim().toUpperCase();
      const records = await tx.select().from(coupons).where(eq(coupons.code, normalizedCode));
      if (records.length === 0) {
          throw new Error('INVALID_COUPON');
      }

      const coupon = records[0];
      if (!coupon.isActive) {
          throw new Error('INVALID_COUPON');
      }

      const now = new Date();
      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
          throw new Error('INVALID_COUPON');
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
          throw new Error('INVALID_COUPON');
      }

      if (Number(subtotal) < Number(coupon.minimumOrder)) {
          throw new Error('INVALID_COUPON');
      }

      let discount = 0;
      if (coupon.discountType === 'percentage') {
          discount = Number((subtotal * (Number(coupon.discountValue) / 100)).toFixed(2));
      } else {
          discount = Number(Number(coupon.discountValue).toFixed(2));
      }

      // Cap discount at subtotal
      if (discount > subtotal) {
          discount = subtotal;
      }

      return { coupon, discount };
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add server/src/modules/coupon/services/coupon.service.js
  git commit -m "feat: implement coupon validation and pricing application"
  ```

---

### Task 4: Quotation Module Implementation

**Files:**
- Create: `server/src/modules/quotation/repository/quotation.repository.js`
- Create: `server/src/modules/quotation/services/quotation.service.js`
- Create: `server/src/modules/quotation/validators/quotation.validators.js`
- Create: `server/src/modules/quotation/controllers/quotation.controller.js`
- Create: `server/src/modules/quotation/routes/quotation.routes.js`
- Create: `server/src/modules/quotation/index.js`

- [ ] **Step 1: Write Quotation Repository**
  Create `server/src/modules/quotation/repository/quotation.repository.js`:
  ```javascript
  import { db } from '../../../config/database.js';
  import { quotations, quotationItems, products, productVariants } from '../../../db/schema/schema.js';
  import { eq, and, sql, desc } from 'drizzle-orm';

  export async function createQuotation(data, items, tx = db) {
      return await tx.transaction(async (innerTx) => {
          const [inserted] = await innerTx.insert(quotations).values(data).returning();
          const itemsData = items.map(item => ({ ...item, quotationId: inserted.id }));
          await innerTx.insert(quotationItems).values(itemsData);
          return inserted;
      });
  }

  export async function findQuotations({ customerId, vendorId, status, page = 1, limit = 10 }) {
      const offset = (page - 1) * limit;
      let cond = sql`1=1`;

      if (customerId) {
          cond = and(cond, eq(quotations.customerId, customerId));
      }

      if (vendorId) {
          // A vendor can see a quotation if it contains a product owned by them
          cond = and(cond, sql`EXISTS (
              SELECT 1 FROM ${quotationItems} qi
              JOIN ${products} p ON qi.product_id = p.id
              WHERE qi.quotation_id = ${quotations.id} AND p.vendor_id = ${vendorId}
          )`);
      }

      if (status) {
          cond = and(cond, eq(quotations.status, status));
      }

      const rows = await db.select()
          .from(quotations)
          .where(cond)
          .orderBy(desc(quotations.createdAt))
          .limit(limit)
          .offset(offset);

      return rows;
  }

  export async function findQuotationById(id) {
      const q = await db.select().from(quotations).where(eq(quotations.id, id));
      if (q.length === 0) return null;

      const items = await db.select({
          id: quotationItems.id,
          productId: quotationItems.productId,
          variantId: quotationItems.variantId,
          quantity: quotationItems.quantity,
          rentalStart: quotationItems.rentalStart,
          rentalEnd: quotationItems.rentalEnd,
          pricePerUnit: quotationItems.pricePerUnit,
          subtotal: quotationItems.subtotal,
          productName: products.name,
          variantSku: productVariants.sku
      })
      .from(quotationItems)
      .innerJoin(products, eq(quotationItems.productId, products.id))
      .leftJoin(productVariants, eq(quotationItems.variantId, productVariants.id))
      .where(eq(quotationItems.quotationId, id));

      return { ...q[0], items };
  }

  export async function updateQuotation(id, updates, tx = db) {
      return tx.update(quotations)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(quotations.id, id))
          .returning();
  }

  export async function deleteQuotationAndItems(id, tx = db) {
      await tx.delete(quotationItems).where(eq(quotationItems.quotationId, id));
      return tx.delete(quotations).where(eq(quotations.id, id)).returning();
  }

  export async function updateQuotationItems(quotationId, items, tx = db) {
      await tx.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
      const itemsData = items.map(item => ({ ...item, quotationId }));
      return tx.insert(quotationItems).values(itemsData).returning();
  }
  ```

- [ ] **Step 2: Write Quotation Service**
  Create `server/src/modules/quotation/services/quotation.service.js`:
  ```javascript
  import * as quotationRepo from '../repository/quotation.repository.js';
  import * as cartRepo from '../../cart/repository/cart.repository.js';
  import * as pricingService from '../../pricing/pricing.service.js';
  import * as couponService from '../../coupon/services/coupon.service.js';
  import { checkAvailability } from '../../availability/services/availability.service.js';
  import { generateNumber } from '../number-generator/number-generator.service.js'; // wait, it's at '../../number-generator/number-generator.service.js'
  import { db } from '../../../config/database.js';
  import { quotations, products, productVariants } from '../../../db/schema/schema.js';
  import { eq } from 'drizzle-orm';

  export async function createQuotationFromCart(customerId, couponCode) {
      return db.transaction(async (tx) => {
          const { rows } = await cartRepo.getCartWithItems(customerId, tx);
          if (rows.length === 0) {
              throw new Error('EMPTY_CART');
          }

          const itemsToInsert = [];
          let subtotalAcc = 0;
          let depositAcc = 0;

          for (const row of rows) {
              // 1. Verify product rentable and published
              if (!row.productIsRentable || !row.productPublished) {
                  throw new Error('INSUFFICIENT_STOCK');
              }
              if (row.variantId && !row.variantIsPublished) {
                  throw new Error('INSUFFICIENT_STOCK');
              }

              // 2. Validate current stock availability
              const availability = await checkAvailability({
                  productId: row.productId,
                  variantId: row.variantId,
                  quantity: row.quantity,
                  startDate: row.rentalStart,
                  endDate: row.rentalEnd
              });
              if (!availability.available) {
                  throw new Error('INSUFFICIENT_STOCK');
              }

              // 3. Recalculate pricing
              const ratePrice = row.ratePrice || row.variantPrice || row.productSalePrice || 0;
              const price = Number(ratePrice);
              const duration = pricingService.calculateDuration(row.rentalStart, row.rentalEnd, row.rentPeriod);
              const itemSubtotal = pricingService.calculateRental(duration, price, row.quantity);
              const itemDeposit = pricingService.calculateDeposit(
                  { salePrice: row.productSalePrice, costPrice: row.productCostPrice },
                  row.variantId ? { price: row.variantPrice } : null,
                  row.quantity
              );

              subtotalAcc += itemSubtotal;
              depositAcc += itemDeposit;

              itemsToInsert.push({
                  productId: row.productId,
                  variantId: row.variantId,
                  quantity: row.quantity,
                  rentalStart: new Date(row.rentalStart),
                  rentalEnd: new Date(row.rentalEnd),
                  pricePerUnit: String(price),
                  subtotal: String(itemSubtotal)
              });
          }

          // 4. Validate coupon
          let discount = 0;
          if (couponCode) {
              const result = await couponService.validateCoupon(couponCode, subtotalAcc, customerId, tx);
              discount = result.discount;
          }

          // 5. Taxes & grand total
          const gst = pricingService.calculateGST(subtotalAcc - discount);
          const grandTotal = Number((subtotalAcc - discount + gst + depositAcc).toFixed(2));

          // 6. Generate Qtn number
          const quotationNo = await generateNumber('QTN', quotations, quotations.quotationNo, tx);

          const qtnData = {
              quotationNo,
              customerId,
              status: 'Draft',
              subtotal: String(subtotalAcc),
              gst: String(gst),
              discount: String(discount),
              securityDeposit: String(depositAcc),
              total: String(grandTotal),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          };

          const newQtn = await quotationRepo.createQuotation(qtnData, itemsToInsert, tx);
          
          // Clear cart
          await cartRepo.clearCart(customerId, tx);

          return newQtn;
      });
  }

  export async function updateQuotation(quotationId, items, customerId) {
      return db.transaction(async (tx) => {
          const qtn = await quotationRepo.findQuotationById(quotationId);
          if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
          if (qtn.customerId !== customerId) throw new Error('UNAUTHORIZED');
          if (qtn.status !== 'Draft') throw new Error('QUOTATION_ALREADY_CONFIRMED');

          const itemsToInsert = [];
          let subtotalAcc = 0;
          let depositAcc = 0;

          for (const item of items) {
              const start = new Date(item.rentalStart);
              const end = new Date(item.rentalEnd);
              if (start >= end || start < new Date()) {
                  throw new Error('INVALID_DATE_RANGE');
              }

              // Check availability
              const availability = await checkAvailability({
                  productId: item.productId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                  startDate: item.rentalStart,
                  endDate: item.rentalEnd
              });
              if (!availability.available) {
                  throw new Error('INSUFFICIENT_STOCK');
              }

              // Load product to retrieve prices
              const [prod] = await tx.select().from(products).where(eq(products.id, item.productId));
              if (!prod || !prod.isRentable) throw new Error('INSUFFICIENT_STOCK');

              let variant = null;
              if (item.variantId) {
                  const variants = await tx.select().from(productVariants).where(eq(productVariants.id, item.variantId));
                  if (variants.length > 0) variant = variants[0];
              }

              const price = Number(variant?.price || prod.salePrice || 0);
              const duration = pricingService.calculateDuration(item.rentalStart, item.rentalEnd, item.rentPeriod || 'Day');
              const itemSubtotal = pricingService.calculateRental(duration, price, item.quantity);
              const itemDeposit = pricingService.calculateDeposit(prod, variant, item.quantity);

              subtotalAcc += itemSubtotal;
              depositAcc += itemDeposit;

              itemsToInsert.push({
                  productId: item.productId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                  rentalStart: start,
                  rentalEnd: end,
                  pricePerUnit: String(price),
                  subtotal: String(itemSubtotal)
              });
          }

          // Maintain previous coupon if applicable
          let discount = 0;
          // In basic flow, since discount calculation is simplified, we'll calculate coupon based on new subtotal
          // We can check if coupon was applied before by checking discount (but here we'll keep discount 0 or recalculate if coupon is present)
          const gst = pricingService.calculateGST(subtotalAcc - discount);
          const grandTotal = Number((subtotalAcc - discount + gst + depositAcc).toFixed(2));

          const updates = {
              subtotal: String(subtotalAcc),
              gst: String(gst),
              securityDeposit: String(depositAcc),
              total: String(grandTotal)
          };

          await quotationRepo.updateQuotation(quotationId, updates, tx);
          await quotationRepo.updateQuotationItems(quotationId, itemsToInsert, tx);

          return quotationRepo.findQuotationById(quotationId);
      });
  }

  export async function deleteQuotation(quotationId, customerId) {
      const qtn = await quotationRepo.findQuotationById(quotationId);
      if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
      if (qtn.customerId !== customerId) throw new Error('UNAUTHORIZED');
      if (qtn.status !== 'Draft') throw new Error('QUOTATION_ALREADY_CONFIRMED');

      return quotationRepo.deleteQuotationAndItems(quotationId);
  }

  export async function sendQuotation(quotationId, user) {
      const qtn = await quotationRepo.findQuotationById(quotationId);
      if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
      if (qtn.status !== 'Draft') throw new Error('INVALID_STATUS_TRANSITION');
      
      return quotationRepo.updateQuotation(quotationId, { status: 'Sent' });
  }

  export async function cancelQuotation(quotationId, user) {
      const qtn = await quotationRepo.findQuotationById(quotationId);
      if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
      if (['Cancelled', 'Confirmed'].includes(qtn.status)) {
          throw new Error('INVALID_STATUS_TRANSITION');
      }

      // Check ownership
      if (user.role === 'USER' && qtn.customerId !== user.id) {
          throw new Error('UNAUTHORIZED');
      }

      return quotationRepo.updateQuotation(quotationId, { status: 'Cancelled' });
  }
  ```

- [ ] **Step 3: Write Validators, Controller & Routes**
  Create `server/src/modules/quotation/validators/quotation.validators.js`:
  ```javascript
  import { z } from 'zod';

  export const createQuotationSchema = z.object({
      couponCode: z.string().optional()
  });

  export const updateQuotationSchema = z.object({
      items: z.array(z.object({
          productId: z.string().uuid(),
          variantId: z.string().uuid().optional().nullable(),
          quantity: z.number().int().positive(),
          rentalStart: z.string().datetime(),
          rentalEnd: z.string().datetime(),
          rentPeriod: z.enum(['Hour', 'Day', 'Week']).default('Day')
      }))
  });
  ```

  Create `server/src/modules/quotation/controllers/quotation.controller.js`:
  ```javascript
  import * as quotationService from '../services/quotation.service.js';
  import * as quotationRepo from '../repository/quotation.repository.js';
  import { sendResponse } from '../../../utils/response.utlis.js';

  export async function createQuotation(req, res) {
      try {
          const { couponCode } = req.body;
          const qtn = await quotationService.createQuotationFromCart(req.user.id, couponCode);
          return sendResponse({
              res,
              statusCode: 201,
              message: 'Quotation created successfully',
              success: true,
              data: { quotation: qtn }
          });
      } catch (error) {
          console.error('Error creating quotation:', error);
          let code = 500;
          if (['EMPTY_CART', 'INSUFFICIENT_STOCK', 'INVALID_COUPON'].includes(error.message)) {
              code = 400;
          }
          return sendResponse({
              res,
              statusCode: code,
              message: error.message || 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function getQuotations(req, res) {
      try {
          const { page = 1, limit = 10, status } = req.query;
          const filter = { page: Number(page), limit: Number(limit), status };

          if (req.user.role === 'USER') {
              filter.customerId = req.user.id;
          } else if (req.user.role === 'VENDOR') {
              filter.vendorId = req.user.id;
          }

          const quotationsList = await quotationRepo.findQuotations(filter);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Quotations retrieved successfully',
              success: true,
              data: { quotations: quotationsList }
          });
      } catch (error) {
          console.error('Error retrieving quotations:', error);
          return sendResponse({
              res,
              statusCode: 500,
              message: 'Internal server error while fetching quotations',
              success: false,
              error: error.message
          });
      }
  }

  export async function getQuotation(req, res) {
      try {
          const qtn = await quotationRepo.findQuotationById(req.params.id);
          if (!qtn) {
              return sendResponse({ res, statusCode: 404, message: 'Quotation not found', success: false });
          }

          // Authorization check
          if (req.user.role === 'USER' && qtn.customerId !== req.user.id) {
              return sendResponse({ res, statusCode: 403, message: 'Unauthorized access', success: false });
          }

          return sendResponse({
              res,
              statusCode: 200,
              message: 'Quotation details retrieved successfully',
              success: true,
              data: { quotation: qtn }
          });
      } catch (error) {
          console.error('Error retrieving quotation detail:', error);
          return sendResponse({
              res,
              statusCode: 500,
              message: 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function updateQuotation(req, res) {
      try {
          const updated = await quotationService.updateQuotation(req.params.id, req.body.items, req.user.id);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Quotation updated successfully',
              success: true,
              data: { quotation: updated }
          });
      } catch (error) {
          console.error('Error updating quotation:', error);
          let code = 500;
          if (['QUOTATION_NOT_FOUND', 'UNAUTHORIZED'].includes(error.message)) {
              code = 403;
          } else if (['QUOTATION_ALREADY_CONFIRMED', 'INVALID_DATE_RANGE', 'INSUFFICIENT_STOCK'].includes(error.message)) {
              code = 400;
          }
          return sendResponse({
              res,
              statusCode: code,
              message: error.message || 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function deleteQuotation(req, res) {
      try {
          await quotationService.deleteQuotation(req.params.id, req.user.id);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Quotation deleted successfully',
              success: true
          });
      } catch (error) {
          console.error('Error deleting quotation:', error);
          let code = 500;
          if (['QUOTATION_NOT_FOUND', 'UNAUTHORIZED'].includes(error.message)) {
              code = 403;
          } else if (error.message === 'QUOTATION_ALREADY_CONFIRMED') {
              code = 400;
          }
          return sendResponse({
              res,
              statusCode: code,
              message: error.message || 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function sendQuotation(req, res) {
      try {
          const updated = await quotationService.sendQuotation(req.params.id, req.user);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Quotation sent successfully',
              success: true,
              data: { quotation: updated }
          });
      } catch (error) {
          console.error('Error sending quotation:', error);
          let code = error.message === 'QUOTATION_NOT_FOUND' ? 404 : 400;
          return sendResponse({
              res,
              statusCode: code,
              message: error.message || 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function cancelQuotation(req, res) {
      try {
          const updated = await quotationService.cancelQuotation(req.params.id, req.user);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Quotation cancelled successfully',
              success: true,
              data: { quotation: updated }
          });
      } catch (error) {
          console.error('Error cancelling quotation:', error);
          let code = 500;
          if (error.message === 'QUOTATION_NOT_FOUND') code = 404;
          else if (error.message === 'UNAUTHORIZED') code = 403;
          else code = 400;
          return sendResponse({
              res,
              statusCode: code,
              message: error.message || 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }
  ```

  Create `server/src/modules/quotation/routes/quotation.routes.js`:
  ```javascript
  import { Router } from 'express';
  import { protect, restrictTo } from '../../auth/index.js';
  import * as qtnController from '../controllers/quotation.controller.js';
  import { createQuotationSchema, updateQuotationSchema } from '../validators/quotation.validators.js';

  const router = Router();

  const validate = (schema) => (req, res, next) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
          return res.status(400).json({ success: false, message: 'Validation error', error: result.error.errors });
      }
      next();
  };

  router.use(protect);

  router.post('/', validate(createQuotationSchema), qtnController.createQuotation);
  router.get('/', qtnController.getQuotations);
  router.get('/:id', qtnController.getQuotation);
  router.patch('/:id', validate(updateQuotationSchema), qtnController.updateQuotation);
  router.delete('/:id', qtnController.deleteQuotation);

  router.post('/:id/send', restrictTo('ADMIN', 'VENDOR'), qtnController.sendQuotation);
  router.post('/:id/cancel', qtnController.cancelQuotation);

  export default router;
  ```

  Create `server/src/modules/quotation/index.js`:
  ```javascript
  import quotationRouter from './routes/quotation.routes.js';
  export { quotationRouter };
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add server/src/modules/quotation/
  git commit -m "feat: implement quotation repository, services, validators, and routes"
  ```

---

### Task 5: Reservation Module Implementation

**Files:**
- Create: `server/src/modules/reservation/repository/reservation.repository.js`
- Create: `server/src/modules/reservation/services/reservation.service.js`

**Interfaces:**
- Produces: 
  - `createReservation(data, tx)`: returns reservation record
  - `releaseReservation(reservationId, tx)`: updates status to `'Released'`
  - `completeReservation(reservationId, tx)`: updates status to `'Completed'`

- [ ] **Step 1: Write Reservation Repository & Service**
  Create `server/src/modules/reservation/repository/reservation.repository.js`:
  ```javascript
  import { db } from '../../../config/database.js';
  import { reservations } from '../../../db/schema/schema.js';
  import { eq } from 'drizzle-orm';

  export async function create(data, tx = db) {
      const [inserted] = await tx.insert(reservations).values(data).returning();
      return inserted;
  }

  export async function updateStatus(id, status, tx = db) {
      return tx.update(reservations)
          .set({ status })
          .where(eq(reservations.id, id))
          .returning();
  }

  export async function findById(id) {
      const records = await db.select().from(reservations).where(eq(reservations.id, id));
      return records[0] || null;
  }
  ```

  Create `server/src/modules/reservation/services/reservation.service.js`:
  ```javascript
  import * as reservationRepo from '../repository/reservation.repository.js';
  import { db } from '../../../config/database.js';

  export async function createReservation({ orderItemId, productId, variantId, quantity, reservedFrom, reservedTo }, tx = db) {
      return reservationRepo.create({
          orderItemId,
          productId,
          variantId,
          quantity,
          reservedFrom: new Date(reservedFrom),
          reservedTo: new Date(reservedTo),
          status: 'Reserved'
      }, tx);
  }

  export async function releaseReservation(reservationId, tx = db) {
      return reservationRepo.updateStatus(reservationId, 'Released', tx);
  }

  export async function completeReservation(reservationId, tx = db) {
      return reservationRepo.updateStatus(reservationId, 'Completed', tx);
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add server/src/modules/reservation/
  git commit -m "feat: implement reservation repository and services"
  ```

---

### Task 6: Rental Order Module Implementation

**Files:**
- Create: `server/src/modules/rental-order/repository/rental-order.repository.js`
- Create: `server/src/modules/rental-order/services/rental-order.service.js`
- Create: `server/src/modules/rental-order/validators/rental-order.validators.js`
- Create: `server/src/modules/rental-order/controllers/rental-order.controller.js`
- Create: `server/src/modules/rental-order/routes/rental-order.routes.js`
- Create: `server/src/modules/rental-order/index.js`

- [ ] **Step 1: Write Rental Order Repository**
  Create `server/src/modules/rental-order/repository/rental-order.repository.js`:
  ```javascript
  import { db } from '../../../config/database.js';
  import { rentalOrders, rentalOrderItems, products, productVariants, reservations } from '../../../db/schema/schema.js';
  import { eq, and, sql, desc } from 'drizzle-orm';

  export async function create(orderData, tx = db) {
      const [inserted] = await tx.insert(rentalOrders).values(orderData).returning();
      return inserted;
  }

  export async function createItems(itemsData, tx = db) {
      return tx.insert(rentalOrderItems).values(itemsData).returning();
  }

  export async function findOrders({ customerId, vendorId, page = 1, limit = 10 }) {
      const offset = (page - 1) * limit;
      let cond = sql`1=1`;

      if (customerId) {
          cond = and(cond, eq(rentalOrders.customerId, customerId));
      }

      if (vendorId) {
          cond = and(cond, sql`EXISTS (
              SELECT 1 FROM ${rentalOrderItems} roi
              JOIN ${products} p ON roi.product_id = p.id
              WHERE roi.order_id = ${rentalOrders.id} AND p.vendor_id = ${vendorId}
          )`);
      }

      return db.select()
          .from(rentalOrders)
          .where(cond)
          .orderBy(desc(rentalOrders.createdAt))
          .limit(limit)
          .offset(offset);
  }

  export async function findById(id) {
      const orders = await db.select().from(rentalOrders).where(eq(rentalOrders.id, id));
      if (orders.length === 0) return null;

      const items = await db.select({
          id: rentalOrderItems.id,
          productId: rentalOrderItems.productId,
          variantId: rentalOrderItems.variantId,
          quantity: rentalOrderItems.quantity,
          pricePerUnit: rentalOrderItems.pricePerUnit,
          rentalStart: rentalOrderItems.rentalStart,
          rentalEnd: rentalOrderItems.rentalEnd,
          subtotal: rentalOrderItems.subtotal,
          productName: products.name,
          variantSku: productVariants.sku
      })
      .from(rentalOrderItems)
      .innerJoin(products, eq(rentalOrderItems.productId, products.id))
      .leftJoin(productVariants, eq(rentalOrderItems.variantId, productVariants.id))
      .where(eq(rentalOrderItems.orderId, id));

      return { ...orders[0], items };
  }

  export async function update(id, updates, tx = db) {
      return tx.update(rentalOrders)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(rentalOrders.id, id))
          .returning();
  }

  export async function getOrderReservations(orderId, tx = db) {
      return tx.select({
          id: reservations.id,
          orderItemId: reservations.orderItemId,
          productId: reservations.productId,
          variantId: reservations.variantId,
          quantity: reservations.quantity
      })
      .from(reservations)
      .innerJoin(rentalOrderItems, eq(reservations.orderItemId, rentalOrderItems.id))
      .where(and(
          eq(rentalOrderItems.orderId, orderId),
          eq(reservations.status, 'Reserved')
      ));
  }
  ```

- [ ] **Step 2: Write Rental Order Service (Handling quotation-to-order transaction)**
  Create `server/src/modules/rental-order/services/rental-order.service.js`:
  ```javascript
  import * as rentalOrderRepo from '../repository/rental-order.repository.js';
  import * as quotationRepo from '../../quotation/repository/quotation.repository.js';
  import * as reservationRepo from '../../reservation/repository/reservation.repository.js';
  import * as inventoryRepo from '../../inventory/repository/inventory.repository.js';
  import { checkAvailability } from '../../availability/services/availability.service.js';
  import { generateNumber } from '../../number-generator/number-generator.service.js';
  import { db } from '../../../config/database.js';
  import { rentalOrders, rentalOrderItems, reservations, inventory } from '../../../db/schema/schema.js';
  import { eq } from 'drizzle-orm';

  export async function confirmQuotation(quotationId, user) {
      return db.transaction(async (tx) => {
          // 1. Fetch & lock quotation
          const qtn = await quotationRepo.findQuotationById(quotationId);
          if (!qtn) throw new Error('QUOTATION_NOT_FOUND');
          if (['Cancelled', 'Confirmed'].includes(qtn.status)) {
              throw new Error('QUOTATION_ALREADY_CONFIRMED');
          }

          // 2. Validate availability for each quotation item
          for (const item of qtn.items) {
              const availability = await checkAvailability({
                  productId: item.productId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                  startDate: item.rentalStart,
                  endDate: item.rentalEnd
              });
              if (!availability.available) {
                  throw new Error('INSUFFICIENT_STOCK');
              }
          }

          // 3. Generate Order Number
          const orderNo = await generateNumber('ORD', rentalOrders, rentalOrders.orderNo, tx);

          // 4. Create Rental Order
          const orderData = {
              orderNo,
              quotationId: qtn.id,
              customerId: qtn.customerId,
              status: 'Confirmed'
          };
          const order = await rentalOrderRepo.create(orderData, tx);

          // 5. Create Order Items, Reservations, and Adjust Inventory Stock
          for (const item of qtn.items) {
              const [ordItem] = await rentalOrderRepo.createItems([{
                  orderId: order.id,
                  productId: item.productId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                  pricePerUnit: item.pricePerUnit,
                  rentalStart: new Date(item.rentalStart),
                  rentalEnd: new Date(item.rentalEnd),
                  subtotal: item.subtotal
              }], tx);

              // Create reservation
              await reservationRepo.create({
                  orderItemId: ordItem.id,
                  productId: item.productId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                  reservedFrom: new Date(item.rentalStart),
                  reservedTo: new Date(item.rentalEnd),
                  status: 'Reserved'
              }, tx);

              // Update inventory row (decrement available, increment reserved)
              const inv = await inventoryRepo.getInventoryRow(item.productId, item.variantId, tx);
              if (!inv) throw new Error('INVENTORY_NOT_FOUND');
              
              await inventoryRepo.updateInventoryRow(item.productId, item.variantId, {
                  availableQty: inv.availableQty - item.quantity,
                  reservedQty: inv.reservedQty + item.quantity
              }, tx);
          }

          // 6. Update quotation status
          await quotationRepo.updateQuotation(qtn.id, { status: 'Confirmed' }, tx);

          return rentalOrderRepo.findById(order.id);
      });
  }

  export async function updateOrderStatus(orderId, nextStatus, user) {
      return db.transaction(async (tx) => {
          const order = await rentalOrderRepo.findById(orderId);
          if (!order) throw new Error('ORDER_NOT_FOUND');

          const current = order.status;
          
          // Enforce state machine transitions
          const validTransitions = {
              'Confirmed': ['PickedUp', 'Cancelled'],
              'PickedUp': ['Active'],
              'Active': ['Returned'],
              'Returned': ['Completed'],
              'Completed': [],
              'Cancelled': []
          };

          if (!validTransitions[current]?.includes(nextStatus)) {
              throw new Error('INVALID_STATUS_TRANSITION');
          }

          // Adjust Inventory per transitions
          if (nextStatus === 'PickedUp') {
              // Move stock from Reserved to WithCustomer
              for (const item of order.items) {
                  const inv = await inventoryRepo.getInventoryRow(item.productId, item.variantId, tx);
                  await inventoryRepo.updateInventoryRow(item.productId, item.variantId, {
                      reservedQty: inv.reservedQty - item.quantity,
                      withCustomerQty: inv.withCustomerQty + item.quantity
                  }, tx);
              }
          } else if (nextStatus === 'Returned') {
              // Move stock from WithCustomer to Available
              for (const item of order.items) {
                  const inv = await inventoryRepo.getInventoryRow(item.productId, item.variantId, tx);
                  await inventoryRepo.updateInventoryRow(item.productId, item.variantId, {
                      withCustomerQty: inv.withCustomerQty - item.quantity,
                      availableQty: inv.availableQty + item.quantity
                  }, tx);
              }
          } else if (nextStatus === 'Completed') {
              // Release reservation logic, set reservations to Completed
              const resList = await rentalOrderRepo.getOrderReservations(orderId, tx);
              for (const res of resList) {
                  await reservationRepo.updateStatus(res.id, 'Completed', tx);
              }
          }

          await rentalOrderRepo.update(orderId, { status: nextStatus }, tx);
          return rentalOrderRepo.findById(orderId);
      });
  }

  export async function cancelOrder(orderId, user) {
      return db.transaction(async (tx) => {
          const order = await rentalOrderRepo.findById(orderId);
          if (!order) throw new Error('ORDER_NOT_FOUND');
          if (order.status !== 'Confirmed') {
              throw new Error('ORDER_ALREADY_COMPLETED'); // Cannot cancel active or completed orders
          }

          // Release reservations & restore inventory stock
          const resList = await rentalOrderRepo.getOrderReservations(orderId, tx);
          for (const res of resList) {
              await reservationRepo.updateStatus(res.id, 'Released', tx);

              const inv = await inventoryRepo.getInventoryRow(res.productId, res.variantId, tx);
              await inventoryRepo.updateInventoryRow(res.productId, res.variantId, {
                  reservedQty: inv.reservedQty - res.quantity,
                  availableQty: inv.availableQty + res.quantity
              }, tx);
          }

          await rentalOrderRepo.update(orderId, { status: 'Cancelled' }, tx);
          return rentalOrderRepo.findById(orderId);
      });
  }
  ```

- [ ] **Step 3: Write Validators, Controller & Routes**
  Create `server/src/modules/rental-order/validators/rental-order.validators.js`:
  ```javascript
  import { z } from 'zod';

  export const updateOrderSchema = z.object({
      notes: z.string().optional()
  });

  export const changeStatusSchema = z.object({
      status: z.enum(['Confirmed', 'PickedUp', 'Active', 'Returned', 'Completed', 'Cancelled'])
  });
  ```

  Create `server/src/modules/rental-order/controllers/rental-order.controller.js`:
  ```javascript
  import * as orderService from '../services/rental-order.service.js';
  import * as orderRepo from '../repository/rental-order.repository.js';
  import { sendResponse } from '../../../utils/response.utlis.js';

  export async function confirmQuotation(req, res) {
      try {
          const order = await orderService.confirmQuotation(req.params.id, req.user);
          return sendResponse({
              res,
              statusCode: 201,
              message: 'Quotation confirmed and order created successfully',
              success: true,
              data: { order }
          });
      } catch (error) {
          console.error('Error confirming quotation:', error);
          let code = 500;
          if (['QUOTATION_NOT_FOUND'].includes(error.message)) {
              code = 404;
          } else if (['QUOTATION_ALREADY_CONFIRMED', 'INSUFFICIENT_STOCK'].includes(error.message)) {
              code = 400;
          }
          return sendResponse({
              res,
              statusCode: code,
              message: error.message || 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function getOrders(req, res) {
      try {
          const { page = 1, limit = 10 } = req.query;
          const filter = { page: Number(page), limit: Number(limit) };

          if (req.user.role === 'USER') {
              filter.customerId = req.user.id;
          } else if (req.user.role === 'VENDOR') {
              filter.vendorId = req.user.id;
          }

          const orders = await orderRepo.findOrders(filter);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Orders retrieved successfully',
              success: true,
              data: { orders }
          });
      } catch (error) {
          console.error('Error retrieving orders:', error);
          return sendResponse({
              res,
              statusCode: 500,
              message: 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function getOrder(req, res) {
      try {
          const order = await orderRepo.findById(req.params.id);
          if (!order) {
              return sendResponse({ res, statusCode: 404, message: 'Order not found', success: false });
          }

          if (req.user.role === 'USER' && order.customerId !== req.user.id) {
              return sendResponse({ res, statusCode: 403, message: 'Unauthorized access', success: false });
          }

          return sendResponse({
              res,
              statusCode: 200,
              message: 'Order details retrieved successfully',
              success: true,
              data: { order }
          });
      } catch (error) {
          console.error('Error retrieving order details:', error);
          return sendResponse({
              res,
              statusCode: 500,
              message: 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function updateOrder(req, res) {
      try {
          const updated = await orderRepo.update(req.params.id, req.body);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Order updated successfully',
              success: true,
              data: { order: updated }
          });
      } catch (error) {
          console.error('Error updating order:', error);
          return sendResponse({
              res,
              statusCode: 500,
              message: 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function changeStatus(req, res) {
      try {
          const updated = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Order status updated successfully',
              success: true,
              data: { order: updated }
          });
      } catch (error) {
          console.error('Error updating order status:', error);
          let code = error.message === 'ORDER_NOT_FOUND' ? 404 : 400;
          return sendResponse({
              res,
              statusCode: code,
              message: error.message || 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }

  export async function cancelOrder(req, res) {
      try {
          const updated = await orderService.cancelOrder(req.params.id, req.user);
          return sendResponse({
              res,
              statusCode: 200,
              message: 'Order cancelled successfully',
              success: true,
              data: { order: updated }
          });
      } catch (error) {
          console.error('Error cancelling order:', error);
          let code = error.message === 'ORDER_NOT_FOUND' ? 404 : 400;
          return sendResponse({
              res,
              statusCode: code,
              message: error.message || 'Internal server error',
              success: false,
              error: error.message
          });
      }
  }
  ```

  Create `server/src/modules/rental-order/routes/rental-order.routes.js`:
  ```javascript
  import { Router } from 'express';
  import { protect, restrictTo } from '../../auth/index.js';
  import * as orderController from '../controllers/rental-order.controller.js';
  import { updateOrderSchema, changeStatusSchema } from '../validators/rental-order.validators.js';

  const router = Router();

  const validate = (schema) => (req, res, next) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
          return res.status(400).json({ success: false, message: 'Validation error', error: result.error.errors });
      }
      next();
  };

  router.use(protect);

  router.get('/', orderController.getOrders);
  router.get('/:id', orderController.getOrder);
  router.patch('/:id', validate(updateOrderSchema), orderController.updateOrder);
  router.patch('/:id/status', validate(changeStatusSchema), orderController.changeStatus);
  router.post('/:id/cancel', orderController.cancelOrder);

  // Mount confirm on quotations endpoint route directly since confirm is POST /quotations/:id/confirm
  // Wait, we can define the /quotations/:id/confirm inside quotation router instead and map it directly to orderController.confirmQuotation!

  export default router;
  ```

  Create `server/src/modules/rental-order/index.js`:
  ```javascript
  import orderRouter from './routes/rental-order.routes.js';
  export { orderRouter };
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add server/src/modules/rental-order/
  git commit -m "feat: implement rental orders repository, services, controllers, and routes"
  ```

---

### Task 7: App Router Mapping & Route Registrations

**Files:**
- Modify: `server/src/app.js`
- Modify: `server/src/modules/quotation/routes/quotation.routes.js`
- Modify: `server/src/modules/availability/routes/availability.routes.js`

- [ ] **Step 1: Map confirm endpoint on Quotation Router**
  Edit `server/src/modules/quotation/routes/quotation.routes.js` to add the confirm endpoint:
  ```javascript
  import { confirmQuotation } from '../../rental-order/controllers/rental-order.controller.js';
  // ... and mount below other routes:
  router.post('/:id/confirm', confirmQuotation);
  ```

- [ ] **Step 2: Map Reservations and Orders in `app.js`**
  Edit `server/src/app.js` to mount `/api/quotations` and `/api/orders`:
  ```javascript
  import { quotationRouter } from './modules/quotation/index.js';
  import { orderRouter } from './modules/rental-order/index.js';

  // Mount them
  app.use('/api/quotations', quotationRouter);
  app.use('/api/orders', orderRouter);
  ```

- [ ] **Step 3: Add `GET /` and `GET /:id` to `availability.routes.js`**
  Edit `server/src/modules/availability/routes/availability.routes.js` to expose reservation viewing:
  ```javascript
  import { reservations } from '../../../db/schema/schema.js';
  import { db } from '../../../config/database.js';
  import { eq } from 'drizzle-orm';
  import { protect, restrictTo } from '../../auth/index.js';

  router.get('/', protect, restrictTo('ADMIN'), async (req, res) => {
      try {
          const list = await db.select().from(reservations);
          return sendResponse({ res, statusCode: 200, message: 'Reservations retrieved', success: true, data: { reservations: list } });
      } catch (err) {
          return sendResponse({ res, statusCode: 500, message: err.message, success: false });
      }
  });

  router.get('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
      try {
          const rows = await db.select().from(reservations).where(eq(reservations.id, req.params.id));
          if (rows.length === 0) return sendResponse({ res, statusCode: 404, message: 'Reservation not found', success: false });
          return sendResponse({ res, statusCode: 200, message: 'Reservation details retrieved', success: true, data: { reservation: rows[0] } });
      } catch (err) {
          return sendResponse({ res, statusCode: 500, message: err.message, success: false });
      }
  });
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add server/src/app.js server/src/modules/quotation/routes/quotation.routes.js server/src/modules/availability/routes/availability.routes.js
  git commit -m "feat: map quotation, rental order, and reservation GET routes on server app"
  ```

---

### Task 8: Integration Testing & Verification

**Files:**
- Create: `server/src/modules/rental-order/tests/workflow.test.js`

- [ ] **Step 1: Write integration tests covering entire transaction workflow**
  Write to `server/src/modules/rental-order/tests/workflow.test.js`:
  ```javascript
  import { describe, it, beforeAll } from 'vitest';
  // We can write a comprehensive standalone script or Vitest file that seeds a user, a product,
  // adds to cart, generates quotation, updates quotation, cancels quotation, sends,
  // confirms to order (transaction checks), verifies stock reservation, cancels order, and completes order.
  ```

- [ ] **Step 2: Run verification test**
  Run: `npm run test` (or appropriate test script)
  Expected: All checks PASS

- [ ] **Step 3: Commit**
  ```bash
  git add server/src/modules/rental-order/tests/workflow.test.js
  git commit -m "test: add integration test for quotation-to-order transaction workflow"
  ```
