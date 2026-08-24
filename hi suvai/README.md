# Hi Suvai — Pure Taste, Ancient Roots (Full-Stack Application)

A full-stack eCommerce web application celebrating traditional South Indian foods, heritage grains, handcrafted health mixes, and pure taste from Tamil Nadu.

---

## 🌟 Architecture Overview

```text
hi-suvai/
├── backend/
│   ├── config/
│   │   └── db.js                 # Resilient MongoDB Mongoose connection (with auto dev fallback)
│   ├── controllers/
│   │   ├── authController.js     # Admin JWT login, profile verification & logout
│   │   └── productController.js  # CRUD, filtering, search, sorting, multi-image upload & stats
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT bearer token verification
│   │   └── uploadMiddleware.js   # Multer storage for product media (JPG, PNG, WEBP, up to 5MB)
│   ├── models/
│   │   ├── Admin.js              # Admin schema with bcrypt password hashing
│   │   └── Product.js            # Product schema with validation, slug, categories, images & stock
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   └── productRoutes.js      # /api/products endpoints
│   ├── seeds/
│   │   ├── seedAdmin.js          # Admin account seed script
│   │   └── seedProducts.js       # Initial 6 Hi Suvai products seed script
│   ├── uploads/
│   │   └── products/             # Statically served uploaded product images (/uploads/products/...)
│   ├── .env                      # Environment configuration
│   ├── .env.example              # Sample environment template
│   ├── server.js                 # Express server with CORS, static routing & auto-seed
│   └── package.json              # Backend dependencies
│
├── admin/                        # Dedicated Admin Portal (SPA)
│   ├── index.html                # Admin Dashboard & Product Inventory UI
│   ├── admin.css                 # Royal dark & gold luxury theme matching Hi Suvai brand
│   └── admin.js                  # JWT session, KPI metrics, CRUD table & drag-drop image upload
│
├── assets/                       # Brand logo, video, styles, and static assets
├── index.html                    # Customer-facing storefront with live MongoDB API integration
├── privacy-policy.html           # Privacy policy page
├── package.json                  # Root npm scripts
└── README.md                     # Documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
- **MongoDB** (Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
  > *Note: If a local MongoDB service is not running on your machine, the application will automatically spin up an embedded in-memory MongoDB instance for seamless instant development.*

---

### 2. Installation & Running

From the root directory:

```bash
# 1. Install backend dependencies
cd backend
npm install
cd ..

# 2. Start the full-stack server
npm run dev
```

The server will automatically:
1. Connect to MongoDB and print `MongoDB Connected Successfully`.
2. Bootstrap the default Admin account (`admin@hisuvai.com` / `admin123`) if not already present.
3. Seed the 6 traditional Hi Suvai products if the database is empty.
4. Launch on port **5000**.

---

## 🌐 Application URLs

| Application | URL | Description |
| :--- | :--- | :--- |
| 🛍️ **Customer Storefront** | [http://localhost:5000/](http://localhost:5000/) | Live customer website with dynamic products, details modal, cart & checkout |
| 🛡️ **Admin Portal** | [http://localhost:5000/admin](http://localhost:5000/admin) | Admin Login, KPI Dashboard, and Product Inventory Management |
| 🩺 **API Health Check** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | API status & server health |

---

## 🔐 Default Admin Credentials

| Field | Value |
| :--- | :--- |
| **Email** | `admin@hisuvai.com` |
| **Password** | `admin123` |
| **Role** | `superadmin` |

*(You can customize these credentials in `backend/.env`)*

---

## 📡 REST API Documentation

### 🔑 Authentication APIs

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Admin login (Returns JWT token) |
| `GET` | `/api/auth/me` | Protected | Get authenticated admin profile |
| `POST` | `/api/auth/logout` | Public | Admin logout |

---

### 📦 Product APIs

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | List products (supports `category`, `search`, `sort`, `minPrice`, `maxPrice`) |
| `GET` | `/api/products/:id` | Public | Get single product by MongoDB ID or Slug |
| `GET` | `/api/products/featured` | Public | Get featured products |
| `GET` | `/api/products/category/:cat` | Public | Get products in a specific category |
| `GET` | `/api/products/stats` | Protected | Get dashboard KPI overview metrics |
| `POST` | `/api/products` | Protected | Create product with Multer image uploads (`image`, `images`) |
| `PUT` | `/api/products/:id` | Protected | Update existing product & media |
| `DELETE` | `/api/products/:id` | Protected | Delete product & cleanup uploaded image files |

---

## ⚙️ Environment Variables (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hi_suvai
JWT_SECRET=hi_suvai_super_secret_jwt_key_2026_traditional_pure_taste
JWT_EXPIRES_IN=7d

# Initial Admin Credentials
ADMIN_NAME=Hi Suvai Admin
ADMIN_EMAIL=admin@hisuvai.com
ADMIN_PASSWORD=admin123
```

---

## 🧪 Manual & Integration Testing

### Admin Management Flow:
1. Open `http://localhost:5000/admin`.
2. Click **Auto Fill** or enter `admin@hisuvai.com` / `admin123`.
3. Click **Log In to Dashboard**.
4. View the KPI metrics (Total Products, In Stock, Low Stock, Inventory Value).
5. Click **+ Add New Product**, fill the form, select images from your computer, and submit.
6. The new product immediately appears in the Admin Inventory Table and on the Customer Storefront (`http://localhost:5000/`).
7. Click the **Edit** icon on any product to update price or stock.
8. Click the **Delete** icon to remove a product (the uploaded image file is automatically cleaned up).

---

## 🛡️ Security Features
- Password hashing with **bcryptjs** (10 salt rounds).
- Stateless **JWT (JSON Web Token)** authentication on write endpoints (`POST`, `PUT`, `DELETE`).
- **Multer** file extension and MIME type validation (JPG, JPEG, PNG, WEBP) with 5MB size limits.
- Sensitive environment credentials stored in `.env`.
