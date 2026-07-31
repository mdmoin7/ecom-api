# Product Management API App (`ecom-api-app`)

A robust, production-ready Node.js REST API for managing product catalogs. Built with Express, MongoDB/Mongoose, and structured using clean architectural patterns (Controller-Service-Repository).

---

## Table of Contents

- [Features](#features)
- [Architecture & Directory Structure](#architecture--directory-structure)
- [Dependencies](#dependencies)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
  - [Product Endpoints](#product-endpoints)
- [Security, Error Handling & Sanitization](#security-error-handling--sanitization)
- [File Uploads](#file-uploads)
- [Mock Seeding](#mock-seeding)

---

## Features

- **Clean Architecture**: Controller-Service-Repository separation of concerns.
- **Database Persistence**: Integrated with MongoDB Atlas using Mongoose.
- **Request Validation**: Incoming body validation powered by Joi schemas.
- **File Uploads**: Handles image uploads via customized Multer middleware.
- **Data Seeding**: Built-in mock data generation using Faker.js.
- **Centralized Error Handling**: Express boundary middleware that filters and sanitizes system errors to prevent sensitive server data disclosure.
- **XSS Prevention**: Middleware that recursively sanitizes and HTML-escapes all string values in incoming payloads (`req.body`, `req.query`, and `req.params`).
- **Security Primitives**: Preconfigured rate limiting (Express Rate Limit) and secure headers (Helmet).
- **ES Modules**: Fully configured modern JavaScript syntax (`import`/`export`).

---

## Architecture & Directory Structure

The project separates concerns using the Controller-Service-Repository pattern:

```text
api-app/
├── src/
│   ├── config/             # Configuration modules (e.g., file-upload configuration)
│   ├── controller/         # API HTTP request handlers
│   ├── db/                 # Database initialization and connection helpers
│   ├── models/             # Mongoose schemas and models
│   ├── repos/              # Database queries and projections (Data Access Layer)
│   ├── routes/             # Express routes configuration
│   ├── server/             # Express App setup, middlewares, and global configurations
│   ├── services/           # Business logic, Joi validations orchestration, and seeding
│   ├── utils/              # General utility classes, middlewares, and functions
│   │   ├── errors.js       # AppError class and centralized errorHandler middleware
│   │   ├── xss-clean.js    # XSS Clean recursively-traversing sanitization middleware
│   │   └── generateProducts.js # Mock generator utilities
│   ├── index.js            # Main application entry point
├── uploads/                # Directory where uploaded images are saved
├── .env                    # Environment variables file
├── package.json            # Project manifest and scripts configuration
└── README.md               # Project documentation
```

---

## Dependencies

### Core

- **[express](https://expressjs.com/)**: Fast, unopinionated minimalist web framework.
- **[mongoose](https://mongoosejs.com/)**: MongoDB object modeling tool.
- **[joi](https://joi.dev/)**: Schema description language and data validator.
- **[multer](https://github.com/expressjs/multer)**: Middleware for handling `multipart/form-data` (file uploads).
- **[uuid](https://github.com/uuidjs/uuid)**: Unique identifier generator for product IDs.

### Security & Logging

- **[helmet](https://helmetjs.github.io/)**: Secure Express apps by setting various HTTP headers.
- **[express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)**: Basic rate-limiting middleware.
- **[morgan](https://github.com/expressjs/morgan)**: HTTP request logger middleware.
- **[chalk](https://github.com/chalk/chalk)**: Terminal string styling utility.
- **[dotenv](https://github.com/motdotla/dotenv)**: Loads environment variables from `.env`.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.11.0+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas Cloud instance)

### Installation

Clone the repository and install all dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the root of the project:

```env
PORT=3000
DB_STRING=your_mongodb_connection_string
```

### Running the Application

#### Start in Production Mode:

```bash
npm start
```

#### Start in Development Mode (with hot-reload via nodemon):

```bash
npm run dev
```

#### Start with Remote Debugging Enabled:

```bash
npm run debug
```

---

## API Documentation

All request bodies must be sent as `application/json`, except for the `/upload` endpoint which requires `multipart/form-data`.

### Product Endpoints

#### 1. Retrieve All Products

- **HTTP Method**: `GET`
- **Path**: `/api/v1/product`
- **Success Response**: `200 OK`
- **Empty Response**: `204 No Content` (if no products are found)

#### 2. Retrieve Product By ID

- **HTTP Method**: `GET`
- **Path**: `/api/v1/product/:id`
- **Success Response**: `200 OK`
- **Not Found Response**: `204 No Content`

#### 3. Create Product

- **HTTP Method**: `POST`
- **Path**: `/api/v1/product`
- **Request Body Schema**:
  ```json
  {
    "productName": "Example Product Name", // String (Min length: 3, Required)
    "productDescription": "Short Description", // String (Optional)
    "productPrice": 150.0, // Number (Min: 100, Required)
    "productRating": 4.5 // Number (0 to 5, Optional)
  }
  ```
- **Success Response**: `201 Created`
- **Error Response**: `400 Bad Request` (due to Joi validation errors or XSS entities)

#### 4. Update Product

- **HTTP Method**: `PUT`
- **Path**: `/api/v1/product/:id`
- **Request Body Schema**: Same as Create Product (fields validated via Joi)
- **Success Response**: `200 OK`
- **Error Response**: `400 Bad Request` / `204 No Content`

#### 5. Delete Product

- **HTTP Method**: `DELETE`
- **Path**: `/api/v1/product/:id`
- **Success Response**: `200 OK`
- **Not Found Response**: `204 No Content`

#### 6. Upload Product Image

- **HTTP Method**: `POST`
- **Path**: `/api/v1/product/upload`
- **Request Format**: `multipart/form-data`
- **Request Payload**:
  - `id`: The custom `productId` string (sent as a form field)
  - `image`: The image file (sent as a file field)
- **Success Response**: `200 OK`
- **Error Response**: `400 Bad Request` (if file/id is missing or format is invalid)

#### 7. Seed Database

- **HTTP Method**: `POST`
- **Path**: `/api/v1/product/seed`
- **Query Params**:
  - `count`: Number of mock products to generate (optional, defaults to 500)
- **Success Response**: `200 OK`

---

## Security, Error Handling & Sanitization

### 1. Centralized Error Sanitization

To prevent **Information Disclosure** (e.g. database schema details or raw stacks), a custom centralized error handling middleware intercepts all errors:

- **Joi Validation Errors**: Formatted and returned cleanly to the client as a `400 Bad Request` validation response.
- **Operational Errors (`AppError`)**: Custom errors thrown intentionally inside the application route workflows return their corresponding status code and safe messages.
- **System Errors**: Unexpected exceptions (database query crashes, syntax issues) are logged securely in detail to the console, and masked with a generic `500 Internal Server Error` (`"An unexpected error occurred on the server."`) response to the client.

### 2. XSS Input Sanitization

A recursive input sanitization middleware runs on every request:

- Automatically filters `req.body`, `req.query`, and `req.params`.
- Replaces special HTML characters (`&`, `<`, `>`, `"`, `'`, `/`) with safe entity codes.
- Ensures script injection attempts (e.g. `<script>alert(1)</script>`) are stored harmlessly as text (`&lt;script&gt;alert(1)&lt;&#x2F;script&gt;`).

### 3. NoSQL Injection Sanitization

- Configured the `express-mongo-sanitize` middleware to analyze query and request body payloads.
- Automatically strips any keys beginning with a `$` or containing a `.` character to prevent malicious MongoDB operator injection (e.g., bypassing query filters via `{ "$gt": "" }`).

### 4. General Security Primitives

- **Helmet**: Secures the application headers to mitigate common web vulnerabilities.
- **Rate Limiter**: Limits IP addresses to **100 requests per 15 minutes** to prevent brute-force and DDoS attacks.
- Static file serving on `/images` is configured safely.

---

## File Uploads

- Supported formats: **JPEG, JPG, PNG, GIF**.
- Maximum file size limit: **5 MB**.
- Files are saved locally inside the root `uploads/` directory with a unique timestamp suffix to avoid filename collisions.
- Uploaded files are served publicly at `http://localhost:<PORT>/images/<filename>`.

---

## Mock Seeding

Seeding utilizes `@faker-js/faker` to clear the current collection and construct mock inventory. Products generated during seeding have:

- Calculated Selling/Sale prices (with a 40% probability of a randomized 5%-50% discount).
- Inventory stock quantities between 0 and 500.
- Rating indices from 1.0 to 5.0.
- Image assets resolved using standard `Picsum` placeholders.
