# E-commerce Product API

An Express, MongoDB, and Mongoose REST API for a product catalog. The codebase
uses controller, service, and repository layers, validates input with Joi, and
provides JWT-protected product administration routes.

## Contents

- [Requirements and setup](#requirements-and-setup)
- [Features](#features)
- [Architecture and structure](#architecture-and-structure)
- [Configuration](#configuration)
- [Running the API](#running-the-api)
- [API documentation](#api-documentation)
- [Health checks](#health-checks)
- [Authentication](#authentication)
- [Product endpoints](#product-endpoints)
- [User endpoints](#user-endpoints)
- [Caching](#caching)
- [Logging](#logging)
- [Uploads](#uploads)
- [Security and error responses](#security-and-error-responses)

## Requirements and setup

- Node.js 20 or later
- A MongoDB instance or MongoDB Atlas connection string

Install dependencies:

```bash
npm install
```

## Features

- Product catalog CRUD with filtering, sorting, and paginated list responses.
- User registration and JWT login.
- Admin-only product creation, updates, deletion, and image uploads.
- Joi validation for product and user input.
- MongoDB/Mongoose persistence using controller, service, and repository layers.
- Swagger UI and a raw OpenAPI document.
- Bounded in-process caching for public product reads.
- Winston request and error logging to files and the console.
- XSS body sanitization, Multer-based image uploads, Helmet headers, CORS, and
  global rate limiting.

## Architecture and structure

The API follows a controller-service-repository flow:

```text
HTTP request
  → middleware (security, logging, authentication)
  → route
  → controller (HTTP request/response handling)
  → service (validation, business rules, caching)
  → repository (Mongoose data access)
  → MongoDB
```

```text
src/
├── config/             # Multer upload configuration
├── controller/         # Product and user HTTP handlers
├── db/                 # MongoDB connection setup
├── docs/               # OpenAPI/Swagger configuration
├── middlewares/        # Authentication, authorization, request logging
├── models/             # Mongoose schemas
├── repos/              # Database query layer
├── routes/             # Express route definitions and Swagger annotations
├── server/             # Express app and global middleware setup
├── services/           # Business rules, validation orchestration, caching
├── types/              # TypeScript declaration extensions
├── utils/              # Errors, Winston logger, TTL cache, seed generator
└── index.ts            # Application startup
uploads/                # Uploaded image files (runtime)
logs/                   # Winston log files (runtime)
```

## Configuration

Create a `.env` file in the project root:

```env
PORT=3000
DB_STRING=mongodb://127.0.0.1:27017/ecom-api
JWT_SECRET=replace-with-a-long-random-secret

# Optional settings
CACHE_TTL_SECONDS=60
CACHE_MAX_ENTRIES=500
LOG_LEVEL=info
```

`DB_STRING` is required at startup. `JWT_SECRET` is required for registration,
login, and protected routes. Cache settings default to 60 seconds and 500
entries when omitted. Set `CACHE_TTL_SECONDS=0` to disable the cache.

## Running the API

```bash
# Development, with reload
npm run dev

# Compile TypeScript
npm run build

# Run the compiled application
npm start
```

The server listens on `http://localhost:3000` by default. All API endpoints
are prefixed with `/api/v1`.

## API documentation

Interactive Swagger UI is available at:

```text
http://localhost:3000/api-docs
```

The raw OpenAPI document is available at:

```text
http://localhost:3000/api-docs.json
```

Swagger is configured with `/api/v1` as its server base, so using **Execute**
in the UI calls the same API paths listed below. Protected operations require a
JWT entered through Swagger UI's **Authorize** button.

## Health checks

These endpoints are not versioned or authenticated, making them suitable for
load balancers, container orchestrators, and uptime monitors:

| Method | Path | Purpose | Response |
| --- | --- | --- | --- |
| `GET` | `/health` | Liveness: confirms the API process is running. | `200 OK` |
| `GET` | `/ready` | Readiness: confirms MongoDB is connected. | `200 OK` or `503 Service Unavailable` |

`/health` returns process uptime and a timestamp. `/ready` returns `503` with
`status: "not_ready"` while MongoDB is disconnected, so deployment platforms
can keep an unhealthy instance out of traffic.

## Authentication

Register, then log in to receive a JWT. Send that token to protected routes:

```http
Authorization: Bearer <token>
```

Tokens expire after 15 minutes. Product creation, update, deletion, and image
upload require an authenticated user with the `admin` role.

> The registration endpoint currently accepts `role` in the request body and
> defaults it to `user`. Restricting who may register an `admin` is a deployment
> and application-policy concern that should be addressed before exposing
> registration publicly.

## Product endpoints

All responses are JSON. Successful list responses include `data` and
`pagination`; other successful product responses include `data`.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/products` | Public | List products with filtering, sorting, and pagination. |
| `GET` | `/api/v1/products/:id` | Public | Get one product by its `productId`. |
| `POST` | `/api/v1/products` | Admin | Create a product. |
| `PATCH` | `/api/v1/products/:id` | Admin | Partially update a product. |
| `DELETE` | `/api/v1/products/:id` | Admin | Delete a product. |
| `POST` | `/api/v1/products/upload` | Admin | Upload and attach a product image. |
| `POST` | `/api/v1/products/seed?count=500` | Admin | Replace the collection with generated products. |

### List products

`GET /api/v1/products` accepts these optional query parameters:

| Parameter | Meaning |
| --- | --- |
| `category` | Exact `productCategory` match. |
| `status` | Exact product status. |
| `inStock` | `true` returns stock greater than zero; `false` returns zero stock. |
| `minPrice`, `maxPrice` | Inclusive `productPrice` range. |
| `tags` | Comma-separated tags; matches products with any supplied tag. |
| `search` | MongoDB text-search term. |
| `sort` | Comma-separated fields; prefix a field with `-` for descending order. |
| `page` | One-indexed page number; defaults to `1`. |
| `limit` | Page size; defaults to `20`, maximum `100`. |

Sortable fields are `productName`, `productPrice`, `productSalePrice`,
`productRating`, `productStock`, and `createdAt`. The default sort is newest
first.

Example:

```text
GET /api/v1/products?category=electronics&inStock=true&sort=-productRating&page=1&limit=20
```

### Create or update a product

Creating a product requires `productName`, `productPrice`, `productSalePrice`,
and `productCategory`. A sale price cannot exceed the base price.

```json
{
  "productName": "Wireless Headphones",
  "productDescription": "Noise-cancelling over-ear headphones",
  "productPrice": 199.99,
  "productSalePrice": 149.99,
  "productCategory": "electronics",
  "productStock": 25,
  "productRating": 4.6,
  "productStatus": "active",
  "tags": ["audio", "wireless"]
}
```

`PATCH /api/v1/products/:id` accepts one or more of those product fields.
`productStatus` must be `active`, `inactive`, or `discontinued`.

### Upload an image

Send `multipart/form-data` to `POST /api/v1/products/upload` with:

- `id`: the target `productId`
- `image`: a JPEG, JPG, PNG, or GIF file no larger than 5 MB

Files are stored in `uploads/` and served at `/images/<filename>`. The stored
product image value uses the public `/uploads/<filename>` path.

### Seed products

`POST /api/v1/products/seed` replaces all products with Faker-generated data.
`count` defaults to 500 and is capped at 5,000. It requires an admin bearer
token and is destructive.

## User endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/user/register` | Create a user account. |
| `POST` | `/api/v1/user/login` | Authenticate and return a JWT. |

Register request body:

```json
{
  "email": "user@example.com",
  "password": "at-least-8-characters",
  "confirmPassword": "at-least-8-characters",
  "role": "user"
}
```

Login request body:

```json
{
  "email": "user@example.com",
  "password": "at-least-8-characters"
}
```

Successful login returns a `token` field. Passwords are hashed before storage
and omitted from the registration response.

## Caching

Successful public product reads are cached in the application process:

- Product detail responses are keyed by `productId`.
- List responses are keyed by the effective filter, sort, page, and limit.
- Entries expire after `CACHE_TTL_SECONDS` and the cache uses least-recently
  used eviction after `CACHE_MAX_ENTRIES` entries.
- Creating, updating, deleting, uploading an image for, or reseeding products
  clears product cache entries in that process.

The cache is process-local. Use a shared cache such as Redis when running
multiple application instances and immediate cross-instance invalidation is
required.

## Logging

Winston writes structured JSON request logs to `logs/combined.log` and error
logs to `logs/error.log`; both are also emitted to the console. `LOG_LEVEL`
sets Winston's minimum level and defaults to `info`. The `logs/` directory is
ignored by Git. Morgan's development request stream is also currently enabled.

## Security and error responses

- Helmet sets security-related HTTP headers.
- CORS is enabled with the default middleware configuration.
- A global rate limit permits 100 requests per IP every 15 minutes.
- Parsed JSON and form bodies are recursively HTML-escaped before validation
  and persistence to reduce stored XSS risk. Password and confirmation fields
  are intentionally left unchanged.
- Joi validation failures return `400` responses.
- Authentication failures return `401`; authenticated users without the admin
  role receive `403`.
- Missing products return `404`.
- Unexpected errors are logged and returned as a generic `500` response.

The API does not currently register MongoDB-query sanitization middleware.
Treat this as an implementation consideration when deploying the service
publicly.
