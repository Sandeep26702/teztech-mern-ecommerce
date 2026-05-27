# TezTech Milestones History & Future Backlog

This document acts as a complete project tracker, recording the implementation history of features from zero to now, alongside future engineering roadmap tasks.

---

## ✅ Completed Milestones (From Zero to Now)

### 🔑 1. Security & Authentication Flow
- **OTP Verification**: Integrated Gmail SMTP mail transporter with `nodemailer` to dispatch register verification OTPs. Included verification cooldown and resend logic.
- **Stateless Sessions**: Wired JWT cookie generation and token validation checks. Added token blacklist schemas to handle user logouts securely.
- **Cryptographic Salting**: Added `bcryptjs` password hashing triggers on user model `pre("save")` hooks.
- **Role Guards**: Built gateway controllers allowing subadmins and admins to perform administrative actions while securing endpoints for standard buyers.

### 🛍️ 2. Buyer Core Features (Cart & Orders)
- **Dynamic Catalog**: Setup debounced input keyword searches, category list navigations, and min-max price filters.
- **Variant Selector**: Programmed dynamic attribute selection schemas (size, specification adjustments) calculating price adjustments on the fly.
- **Shopping Cart**: Created local state cart syncing, quantity limits check, and custom specifications serialize arrays.
- **Checkout Pipe**: Built dynamic shipping charges selector, address forms, billing totals summary, and order creation workflows.
- **Client Orders Panel**: Designed order tracking timeline screens showing step-by-step progress from processed to delivered.

### 👑 3. Admin Inventory & Order Management
- **Dashboard Metrics**: Wired aggregation queries counting totals orders, active users, categories, and sales.
- **CSV Upload Parser**: Programmed a custom CSV scanner which reads headers, constructs nested category records, map variant listings, and runs bulk upserts using `bulkWrite`.
- **Import Rollback History**: Logged bulk import jobs inside `ProductImportJob` collections, allowing admins to view history and perform rollbacks (deleting imported products).
- **Categories Drag/Drop Hierarchy**: Built tree controllers, drag-and-drop sort orders, and database cleanup routines.
- **Order Timeline Manager**: Created admin tools to transition orders (Processing -> Shipped -> Delivered) with status timestamp logging.

### 📄 4. B2B Manual Quotation Feature
- **Invoice Calculator**: Added support for customizable service charges, tax rates (GST), and manual item lists inside Quote models.
- **Access Share Links**: Generated unique tokens and shareable URLs for client quotes.
- **PDF Invoice Downloader**: Programmed frontend PDF layouts rendering using `jsPDF` and `html2canvas` for download invoices logs.

### ⚡ 5. Performance, Caching & Security Optimizations (Phase 1, 2, & 3)
- **MongoDB Text Indexes**: Converted regex lookups inside `getProducts` to high-speed text search index lookups. Added conditional `$indexOfCP` sorting logic to prioritize exact matches.
- **Query Projections**: Added `$project` and `.select(...)` statements to select only card fields.
- **In-Memory Caching**: Implemented `node-cache` on layouts, categories, and products.
- **Static Assets Cache Control**: Added `maxAge: '30d'` and `immutable: true` settings to the Express uploads serving middleware.
- **Cloudinary Resizing**: Integrated dynamic width sizing options (`w_400`, `w_800`, `w_150`, etc.) inside the frontend Cloudinary URL helper.
- **Code Splitting**: Implemented route-based chunk bundling using `React.lazy` and `Suspense` loaders.
- **Logs buffering**: Buffered traffic logging operations in-memory and batch wrote them using Mongoose `insertMany` every 15 seconds.
- **HTML Emails Templates**: Styled verification plain text emails with modern responsive HTML templates.
- **Router Validators**: Implemented `express-validator` schema validations on credentials routes.
- **Database Connection Pooling**: Configured Mongoose connection options (`maxPoolSize`, `minPoolSize`, and socket timeouts).

---

## 🚀 Future Backlog & Engineering Roadmap

- [ ] **Distributed Caching (Redis)**: Move from local `node-cache` to distributed Redis clustering to support load-balanced, multi-instance web servers sharing session cache states.
- [ ] **Database Replica Sets**: Segregate database queries by spinning up read-replicas for public catalog lookups and routing all writes (carts, checkout orders) to the primary database instance.
- [ ] **Static Assets CDN**: Migrate static `/uploads` serving from the Node.js process to an AWS S3 bucket delivered via Amazon CloudFront CDN.
- [ ] **Elasticsearch Autocomplete**: Integrate Elasticsearch or MongoDB Atlas Search to support semantic autocomplete queries, spelling auto-correction, and synonym parsing.
- [ ] **GraphQL Gateway**: Wrap the backend API layer in a GraphQL gateway to allow the client to request custom layout payloads dynamically, eliminating over-fetching.
- [ ] **PWA Offline Support**: Deploy Service Workers to enable offline browse capabilities and push notifications on shipment status modifications.
