# Winelog

A wine tasting and cellar management MVP application built with modern web technologies. Track wine tastings, manage your cellar, capture photos, and export tasting notes.

## Tech Stack

- **Frontend**: Next.js 16.1.6, React 19.2.3, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: DigitalOcean Spaces (S3-compatible)
- **Authentication**: JWT with bcryptjs
- **UI Components**: Radix UI, custom components
- **Export**: CSV and PDF support

## Features

- User authentication (signup/login with JWT)
- Wine tasting entry creation and management
- Photo capture and upload to DigitalOcean Spaces
- Cellar bottle inventory tracking
- Location management for wine storage
- Export tastings to CSV and PDF formats
- Responsive mobile-first design
- Toast notifications

## Setup Instructions

### Prerequisites

- Node.js 20+ (Alpine compatible)
- PostgreSQL database
- DigitalOcean Spaces account (for image storage)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd winelog-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables**
   Copy `.env.example` to `.env` and update with your values:
   ```bash
   cp .env.example .env
   ```

4. **Run database migrations**
   ```bash
   npx drizzle-kit migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

## DigitalOcean Deployment

This application is configured for deployment to DigitalOcean App Platform using Docker.

### Deployment Steps

1. **Push to repository**
   Ensure your code is committed and pushed to GitHub or your Git provider.

2. **Connect to DigitalOcean**
   - Go to [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
   - Click "Create App"
   - Select your Git repository
   - Confirm the Dockerfile is detected at the project root

3. **Configure Environment Variables**
   In the App Platform settings, add all variables from `.env`:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `S3_ENDPOINT`
   - `S3_REGION`
   - `S3_ACCESS_KEY`
   - `S3_SECRET_KEY`
   - `S3_BUCKET`
   - `APP_BASE_URL`

4. **Configure Database**
   - Add a PostgreSQL managed database to your app
   - Use the connection string as `DATABASE_URL`

5. **Configure Storage**
   - Create a Space in DigitalOcean
   - Generate API tokens with Space access
   - Set S3 credentials in environment variables

6. **Deploy**
   - Click "Deploy" to start the build and deployment process
   - Monitor the build logs for any issues

## Docker Build

The application includes a multi-stage Dockerfile optimized for deployment:

```bash
docker build -t winelog .
docker run -p 8080:8080 --env-file .env winelog
```

Access the application at `http://localhost:8080`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/winelog` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key-change-in-production` |
| `S3_ENDPOINT` | DigitalOcean Spaces endpoint | `https://nyc3.digitaloceanspaces.com` |
| `S3_REGION` | S3 region | `nyc3` |
| `S3_ACCESS_KEY` | Space access key | `your-access-key` |
| `S3_SECRET_KEY` | Space secret key | `your-secret-key` |
| `S3_BUCKET` | Bucket name | `winelog-photos` |
| `APP_BASE_URL` | Application base URL | `http://localhost:3000` or your domain |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API endpoints
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and helpers
│   ├── auth.ts           # JWT authentication
│   ├── db.ts             # Database client
│   ├── s3.ts             # S3 upload handlers
│   ├── schema.ts         # Database schema
│   └── validations.ts    # Zod schemas
└── styles/               # Global styles
```

## Development

### Key Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Schema

The application uses Drizzle ORM with PostgreSQL. Migrations are defined in the `drizzle/` directory.

Main tables:
- `users` - User accounts with hashed passwords
- `tastings` - Wine tasting sessions
- `tasting_entries` - Individual wine tasting notes
- `bottles` - Cellar inventory
- `locations` - Wine storage locations

### API Routes

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET/POST /api/tastings` - List/create tastings
- `GET/POST /api/tastings/[id]` - Get/update tasting
- `GET/POST /api/tastings/[id]/entries` - Manage entries
- `POST /api/uploads/sign` - Get S3 upload presigned URLs
- `GET /api/bottles` - List cellar bottles
- `GET/POST /api/locations` - Manage locations

## Notes

- Type checking is currently lenient (`ignoreBuildErrors: true`) for MVP compatibility. Enable strict checks before production.
- Consider adding comprehensive error logging and monitoring before production deployment.
- Database backups are essential for production deployments.
- Ensure JWT_SECRET and S3 credentials are strong and securely managed.

## License

MIT
