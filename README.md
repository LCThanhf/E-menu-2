# E-Menu - Digital Restaurant Menu System

A modern, full-stack digital menu solution for restaurants with real-time order management and an admin dashboard.

## Features

### Customer Features
- Table-based access with QR codes
- Browse the menu with categories and search
- Shopping cart and order placement
- Staff call with customizable reasons
- Payment requests with multiple methods
- Real-time chat system to receive responses from the restaurant

### Admin Features
- Dashboard with real-time statistics
- Menu items management (CRUD with image upload)
- Table management with availability status
- Order tracking and management
- Staff call handling
- Payment request processing
- QR code generator for tables
- Secure authentication with password reset

## Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Lucide React

**Backend:** Node.js, Express.js, Prisma 5.22, MySQL, JWT, bcrypt, Multer

## Getting Started

### Prerequisites

- Node.js (v18+)
- XAMPP (for MySQL)
- Git

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/LCThanhf/E-menu-2.git
cd E-menu-2
```

#### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file with:
DATABASE_URL="mysql://root:@localhost:3306/emenu"
JWT_SECRET="your-secret-key-here"
FRONTEND_URL="http://localhost:3000"
PORT=5000

# Run migrations and seed
npx prisma migrate dev
npx prisma db seed

# Start backend
npm run dev
```

Backend runs on `http://localhost:5000`

#### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Create .env.local with:
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

#### 4. Start MySQL

- Open XAMPP Control Panel
- Start Apache and MySQL
- Ensure MySQL runs on port 3306

## Database Schema

**Tables:** admins, categories, menu_items, tables, orders, order_items, staff_calls, payment_requests

**Order Status Flow:** PENDING → CONFIRMED → COMPLETED (or CANCELLED)

## Default Admin Credentials

- Email: `admin@emenu.com`
- Password: `admin123`

**Change password after first login!**

## Usage

### For Customers

1. Scan table QR code
2. Enter name
3. Browse menu and add items
4. Place order
5. Call staff if needed
6. Request payment when ready

### For Admin

1. Login at `/admin`
2. Manage menu items (add/edit/delete with image upload)
3. Monitor table availability
4. Process orders and update status
5. Handle staff calls and payment requests
6. Generate QR codes for tables

### Chat System
1. **Customer places order** → Chat shows order details → Auto-reply: "Nhà hàng đã nhận được yêu cầu"
2. **Admin confirms order** → Chat auto-updates: "Nhà hàng đã xác nhận yêu cầu"
3. **Admin cancels order** → Chat auto-updates: "Nhà hàng đã hủy yêu cầu"
4. Same flow applies to staff calls and payment requests
5. Chat history persists until table is reset to "AVAILABLE"

## Image Upload

- Formats: JPG, JPEG, PNG, WebP
- Max size: 5MB
- Recommended ratio: 4:3 (e.g., 800x600)
- Storage: `backend/uploads/menu-items/`

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Login
- `POST /api/auth/admin/register` - Register
- `POST /api/auth/admin/verify-email` - Verify email
- `POST /api/auth/admin/reset-password` - Reset password

### Resources
- `GET/POST/PUT/DELETE /api/categories` - Categories
- `GET/POST/PUT/DELETE /api/menu-items` - Menu items
- `GET/POST/PUT/DELETE /api/tables` - Tables
- `GET/POST/PUT/DELETE /api/orders` - Orders
- `GET/POST/PUT/DELETE /api/staff-calls` - Staff calls
- `GET/POST/PUT/DELETE /api/payment-requests` - Payments

### Upload
- `POST /api/upload/image` - Upload image
- `DELETE /api/upload/image/:filename` - Delete image

## Deployment

### Backend
1. Set production environment variables
2. Run `npx prisma migrate deploy`
3. Deploy to Railway, Render, or Heroku

### Frontend
1. Update `NEXT_PUBLIC_API_URL` to production backend
2. Deploy to Vercel, Netlify, or Railway

### Database
Use managed MySQL: PlanetScale, AWS RDS, or Railway

## Security Checklist

- JWT authentication
- Password hashing (bcrypt)
- CORS protection
- File upload validation
- SQL injection protection (Prisma)

**For Production:**
- Enable HTTPS
- Strong JWT_SECRET
- Configure CORS origins
- Add rate limiting
- Input validation
- Database backups

## Troubleshooting

**Backend won't start**
- Check MySQL is running
- Verify DATABASE_URL in .env
- Run `npx prisma generate`

**Images not displaying**
- Check `backend/uploads/menu-items` exists
- Verify backend serves static files
- Check image path in database

**Orders not creating**
- Verify backend runs on port 5000
- Check browser console errors
- Verify API_URL in frontend .env.local
