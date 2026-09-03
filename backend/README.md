# RetenzaConnect Backend API

Node.js + Express + MongoDB Atlas backend for the RetenzaConnect loyalty platform.

## Tech Stack

- **Node.js** & **Express.js**
- **MongoDB Atlas** with **Mongoose**
- **JWT** authentication
- **bcryptjs** password hashing
- **express-validator** input validation
- **Swagger UI** at `/api-docs` (swagger-jsdoc + swagger-ui-express)
- **Multer** for logo uploads

## Project Structure

```
backend/
├── config/          # Database & Swagger configuration
├── controllers/     # Business logic
├── middleware/      # Auth, validation, error handling, upload
├── models/          # Mongoose schemas
├── routes/          # API routes with Swagger JSDoc
├── scripts/         # Utility scripts (seed admin)
├── utils/           # Helpers
├── server.js        # Application entry point
├── package.json
└── .env.example
```

## Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

**Important:** Replace `xxxxx` in `MONGODB_URI` with your actual Atlas cluster hostname.  
The password `Retenza@2026` must be URL-encoded as `Retenza%402026` in the connection string.

Example:

```
MONGODB_URI=mongodb+srv://retenza_admin:Retenza%402026@retenza-connect.abc123.mongodb.net/retenza_connect?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_long_random_string
```

### 3. Seed admin user (optional)

```bash
node scripts/seedAdmin.js
```

Default admin: `admin@retenza.com` / `Admin123!`

### 4. Start the server

```bash
npm run dev
# or
npm start
```

- API: http://localhost:3000/api
- **Swagger UI: http://localhost:3000/api-docs**
- OpenAPI JSON: http://localhost:3000/api-docs.json

## Testing with Swagger UI

1. Open http://localhost:3000/api-docs
2. Click **Authorize** and paste your JWT token: `Bearer <token>`
3. Use **Try it out** on any endpoint

### Recommended test flow

1. `POST /api/auth/register/merchant` — register a merchant
2. Copy the `token` from the response → **Authorize** in Swagger
3. `POST /api/admin/commerces/{id}/activate` — activate commerce (use admin token)
4. `POST /api/qrcodes/generate/{commerceId}` — generate QR code
5. `POST /api/qrcodes/scan/{code}` — simulate QR scan
6. `POST /api/clients/register-qr` — register client after scan
7. `POST /api/loyalty/transactions` — add loyalty points/stamps/cashback
8. `GET /api/dashboard/stats/{commerceId}` — view merchant dashboard

## API Endpoints Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/merchant` | Merchant registration |
| POST | `/api/auth/register/client` | Client registration |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Current user profile |

### Commerce
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/commerces` | Create commerce |
| GET | `/api/commerces` | List commerces |
| GET | `/api/commerces/me` | Merchant's commerce |
| GET | `/api/commerces/:id` | Commerce details |
| PUT | `/api/commerces/:id` | Update profile |
| POST | `/api/commerces/:id/logo` | Upload logo |

### QR Code
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qrcodes/generate/:commerceId` | Generate QR code |
| GET | `/api/qrcodes/commerce/:commerceId` | Get QR code |
| POST | `/api/qrcodes/scan/:code` | Track scan |
| GET | `/api/qrcodes/history/:commerceId` | Scan history |

### Client
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clients/register-qr` | Register after QR scan |
| GET | `/api/clients/commerce/:commerceId` | List clients |

### Loyalty
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/loyalty/transactions` | Add transaction |
| GET | `/api/loyalty/balance/:clientId/:commerceId` | Get balance |
| GET | `/api/loyalty/history/:clientId/:commerceId` | Transaction history |
| PUT | `/api/loyalty/program/:commerceId` | Configure program |

### Wallet (Mock)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet/apple/:clientId/:commerceId` | Apple Wallet data |
| GET | `/api/wallet/google/:clientId/:commerceId` | Google Wallet data |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats/:commerceId` | Merchant statistics |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/commerces` | List all commerces |
| PATCH | `/api/admin/commerces/:id/activate` | Activate commerce |
| PATCH | `/api/admin/commerces/:id/suspend` | Suspend commerce |
| DELETE | `/api/admin/commerces/:id` | Delete commerce |
| GET | `/api/admin/statistics` | Platform statistics |

## Database Models

- **User** — merchants, clients, admins
- **Commerce** — business profiles with contact, hours, loyalty config
- **Client** — customers linked to commerces
- **LoyaltyAccount** — points, stamps, cashback balances
- **LoyaltyTransaction** — earn/redeem history
- **QRCode** — unique codes per commerce
- **ScanHistory** — scan date/time tracking

## License

MIT
