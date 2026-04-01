# Carbon Cases - Backend API

Backend API for Carbon Cases e-commerce platform built with Node.js, Express, and PostgreSQL (Supabase).

## Features

- 🔐 User Authentication (JWT + Google OAuth)
- 📧 Email Verification
- 🛍️ Product Management
- 🛒 Shopping Cart & Orders
- ❤️ Wishlist
- 👨‍💼 Admin Dashboard
- 🗄️ PostgreSQL Database (Supabase)

## Tech Stack

- Node.js + Express
- PostgreSQL (Supabase)
- JWT Authentication
- Passport.js (Google OAuth)
- Nodemailer (Email)
- Bcrypt (Password Hashing)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
DATABASE_URL="your_supabase_connection_string"
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:3000

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

3. Setup database:
```bash
node config/setupSupabase.js
```

4. Start server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/send-verification` - Send email verification
- `POST /api/auth/verify-code` - Verify email code

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove from cart

### Orders
- `GET /api/orders/my-orders` - Get user orders
- `POST /api/orders` - Create order

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/products` - Manage products
- `GET /api/admin/orders` - Manage orders
- `GET /api/admin/users` - Manage users

## Default Admin Credentials

- Email: admin@carboncases.com
- Password: admin123

## License

MIT
