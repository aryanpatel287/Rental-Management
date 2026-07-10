# Category Module Backend Design Specification

**Date**: 2026-07-10  
**Status**: Draft  
**Target Module**: Backend Category Module (`/api/categories`)  

---

## 1. Objective & Scope

Integrate the **Category Module** into the Express backend. This module handles categorization of catalog items (e.g. products, rentals) and supports a self-referential hierarchical category structure.

Key requirements:
- Create routes:
  - `GET /api/categories` (Public)
  - `POST /api/categories` (Admin only)
  - `PATCH /api/categories/:id` (Admin only)
  - `DELETE /api/categories/:id` (Admin only)
- Support self-referential hierarchy: categories can have a `parentCategoryId` pointing to another category.
- Prevent circular references (e.g. category A cannot have B as parent if B is already a child of A, and A cannot be its own parent).
- Handle automatic slug generation and unique slug validation.
- Comply with modular structure and standard central response formatting.

---

## 2. Database Schema

The `categories` schema is defined in [categories.schema.js](file:///d:/VirtualRound/rental-management/server/src/db/schema/categories.schema.js). We will register and export it from the central schema registry [schema.js](file:///d:/VirtualRound/rental-management/server/src/db/schema/schema.js):

```javascript
import { categories } from './categories.schema.js';
export { users, entityDefinitions, fieldDefinitions, categories };
```

### Table Structure (`categories`)
*   `id`: UUID, default random, Primary Key.
*   `name`: Text, not-null.
*   `slug`: Text, unique, not-null, indexed.
*   `description`: Text, optional.
*   `parentCategoryId`: UUID, foreign key referencing `categories.id` (`onDelete: 'set null'`), indexed.
*   `isActive`: Boolean, default `true`, not-null.
*   `createdAt`: Timestamp with time zone, default `now()`, not-null.
*   `updatedAt`: Timestamp with time zone, default `now()`, not-null.

---

## 3. Architecture & File Mapping

To adhere to the feature-based modular structure:
1.  **DAO Layer**: `server/src/dao/category.dao.js` for DB queries.
2.  **Controller Layer**: `server/src/modules/category/controllers/category.controller.js` for handling request/response logic.
3.  **Service Layer**: `server/src/modules/category/services/category.service.js` for business logic (slugification, cycle checking).
4.  **Validator Layer**: `server/src/modules/category/validators/category.validator.js` for incoming request schema checks.
5.  **Routes Layer**: `server/src/modules/category/routes/category.routes.js` for endpoint bindings.
6.  **Module Registry**: `server/src/modules/category/index.js` for module-level export.
7.  **Main Router Integration**: Register routes in `server/src/app.js` under `/api/categories`.

---

## 4. API Endpoints Specification

### 4.1 GET /api/categories (Public)
Retrieve flat list of categories. Supports query parameters for filtering.
*   **Query Params**:
    *   `parentCategoryId` (UUID) - Filters categories belonging to a specific parent. Special value `"null"` (string) will fetch root-level categories.
    *   `isActive` (boolean) - Filters by status.
    *   `slug` (string) - Filters by exact slug match.
*   **Success Response (200 OK)**:
    ```json
    {
        "message": "Categories retrieved successfully",
        "success": true,
        "error": null,
        "data": {
            "categories": [
                {
                    "id": "7ac15b80-fa40-4284-9d51-140b991b1a78",
                    "name": "Power Tools",
                    "slug": "power-tools",
                    "description": "Heavy-duty power equipment",
                    "parentCategoryId": null,
                    "isActive": true,
                    "createdAt": "2026-07-10T12:00:00.000Z",
                    "updatedAt": "2026-07-10T12:00:00.000Z"
                }
            ]
        }
    }
    ```

### 4.2 POST /api/categories (Admin Only)
Create a new category.
*   **Authentication**: Bearer/Cookie JWT required. Role must be `ADMIN`.
*   **Request Body**:
    ```json
    {
        "name": "Drills",
        "slug": "drills", // optional
        "description": "Corded and cordless drills",
        "parentCategoryId": "7ac15b80-fa40-4284-9d51-140b991b1a78", // optional
        "isActive": true // optional
    }
    ```
*   **Validation**:
    *   `name`: string, required, non-empty, max 100 characters.
    *   `slug`: optional, string, pattern `/^[a-z0-9-_]+$/` (kebab-case/lowercase).
    *   `parentCategoryId`: optional, string, must be valid UUID. If provided, parent category must exist.
    *   `isActive`: optional, boolean.
*   **Business Logic**:
    *   If `slug` is not provided, slugify `name`.
    *   If `slug` exists in database, append a random suffix or fail validation. (Failure is simpler: return a 400 with "Slug already exists").
*   **Success Response (201 Created)**:
    ```json
    {
        "message": "Category created successfully",
        "success": true,
        "error": null,
        "data": {
            "category": {
                "id": "b3de4c78-1a5c-43f1-bd2e-503c8cbcd356",
                "name": "Drills",
                "slug": "drills",
                "description": "Corded and cordless drills",
                "parentCategoryId": "7ac15b80-fa40-4284-9d51-140b991b1a78",
                "isActive": true,
                "createdAt": "2026-07-10T12:05:00.000Z",
                "updatedAt": "2026-07-10T12:05:00.000Z"
            }
        }
    }
    ```

### 4.3 PATCH /api/categories/:id (Admin Only)
Update an existing category.
*   **Authentication**: Bearer/Cookie JWT required. Role must be `ADMIN`.
*   **Request Body**: Any editable category field.
*   **Validation**: Similar to POST validator, but all fields optional.
*   **Business Logic**:
    *   If `parentCategoryId` is provided:
        1. Check if the parent category exists.
        2. Ensure `parentCategoryId` is not equal to `:id` (category cannot be its own parent).
        3. Check for circular reference: parent category cannot be a descendant of the category being updated.
    *   If `slug` is updated, ensure uniqueness.
*   **Success Response (200 OK)**:
    ```json
    {
        "message": "Category updated successfully",
        "success": true,
        "error": null,
        "data": {
            "category": {
                "id": "b3de4c78-1a5c-43f1-bd2e-503c8cbcd356",
                "name": "Heavy Drills",
                "slug": "heavy-drills",
                "description": "Corded and cordless drills for heavy duty",
                "parentCategoryId": "7ac15b80-fa40-4284-9d51-140b991b1a78",
                "isActive": true,
                "createdAt": "2026-07-10T12:05:00.000Z",
                "updatedAt": "2026-07-10T12:10:00.000Z"
            }
        }
    }
    ```

### 4.4 DELETE /api/categories/:id (Admin Only)
Hard delete a category.
*   **Authentication**: Bearer/Cookie JWT required. Role must be `ADMIN`.
*   **Business Logic**:
    *   Check if category exists.
    *   Perform deletion. Foreign key `onDelete: 'set null'` handles decoupling child categories (setting their `parentCategoryId` to `null`).
*   **Success Response (200 OK)**:
    ```json
    {
        "message": "Category deleted successfully",
        "success": true,
        "error": null
    }
    ```

---

## 5. Circular Dependency & Validation Algorithms

### 5.1 Slug Uniqueness / Slugify
```javascript
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
        .replace(/\-\-+/g, '-');    // Replace multiple - with single -
}
```
If the slug is generated or updated, check if it's already in use. If yes, reject or generate a unique slug (e.g. `slug-1`, `slug-2`). To match strict validation requirements, returning an error is preferred: "Category slug is already in use."

### 5.2 Circular Dependency Check
When setting the parent category of a category $C$ to category $P$:
1. If $C == P$, it's an immediate cycle. Reject.
2. If $P$ is null/undefined, it's valid (root category).
3. Otherwise, check if $C$ is an ancestor of $P$.
   - Fetch $P$. If $P.parentCategoryId$ is null, it's valid.
   - If $P.parentCategoryId == C$, cycle detected. Reject.
   - Recursively fetch parent of $P$ and repeat check until parent is null or cycle is detected.

```javascript
async function wouldCreateCycle(categoryId, targetParentId) {
    if (!targetParentId) return false;
    if (categoryId === targetParentId) return true;

    let currentParentId = targetParentId;
    while (currentParentId) {
        const parent = await getCategoryById(currentParentId);
        if (!parent) break;
        
        if (parent.parentCategoryId === categoryId) {
            return true; // Cycle detected!
        }
        currentParentId = parent.parentCategoryId;
    }
    return false;
}
```

---

## 6. Verification Plan

### Manual API Verification
We will verify the endpoints using PowerShell commands or curl:
1. Verify `GET /api/categories` returns `200 OK` (empty or populated list) without authentication.
2. Verify `POST /api/categories` returns `401 Unauthorized` without credentials.
3. Authenticate as `admin@example.com` (password `password123`).
4. Perform `POST /api/categories` to create "Tools" (root category).
5. Perform `POST /api/categories` to create "Drills" (child of "Tools").
6. Attempt to update "Tools" setting its parent category to "Drills" (`PATCH /api/categories/:toolsId`). Verify it returns `400 Bad Request` (circular dependency cycle detected).
7. Perform `DELETE /api/categories/:toolsId`. Verify it works and setting "Drills" parent category to null is handled.
