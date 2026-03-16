# Import Management System - Deployment Guide

## Overview

This is an enterprise-grade React application for import management, featuring a full CRUD interface for managing employees, companies, shipping companies, clearing agents, and other import-related entities.

## Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query) + Context API
- **HTTP Client**: Axios with interceptors
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## Features

1. **Authentication System**
   - Login with email/password
   - Token-based authentication with auto-refresh
   - Protected routes
   - User profile management
   - Password change functionality

2. **Layout & Navigation**
   - Fixed sidebar with collapsible menus
   - Top bar with user profile dropdown
   - Light/Dark theme toggle
   - Responsive design

3. **Masters Management**
   - Employees
   - Roles & Claims
   - Companies (full CRUD)
   - Shipping Companies
   - Clearing Agents
   - Ocean Freight Companies
   - Local Transport Companies
   - Import Documents
   - Ports

4. **Dynamic UI System**
   - Descriptor-based table rendering
   - Descriptor-based form generation
   - Support for future AI-driven UI generation

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://d7599678de13.ngrok-free.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## Development

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t import-management-system .
```

### Run Container

```bash
docker run -p 80:80 \
  -e API_URL=https://your-api-url.com \
  import-management-system
```

## Cloud Deployment

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configure environment variables in Vercel dashboard

### Azure Static Web Apps

1. Create Azure Static Web App
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables in Azure portal

### AWS Amplify

1. Connect repository to AWS Amplify
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables in Amplify console

## API Integration

The application connects to a .NET Core backend API. Key endpoints:

### Authentication
- `POST /api/Auth/login` - User login
- `POST /api/Auth/refresh-token` - Refresh access token
- `POST /api/Auth/logout` - User logout
- `GET /api/Auth/me` - Get current user
- `POST /api/Auth/change-password` - Change password

### Masters
- `GET /api/[Resource]` - List all
- `GET /api/[Resource]/{id}` - Get by ID
- `POST /api/[Resource]` - Create
- `PUT /api/[Resource]/{id}` - Update
- `DELETE /api/[Resource]/{id}` - Delete

Resources: Employees, Companies, ClearingAgents, ShippingCompanies, OceanFreightCompanies, LocalTransportCompanies, ImportDocMasters, Ports, Roles

## Theme Configuration

The application uses a centralized theme system based on the Laduma Hardware color palette:

- **Primary**: #1B3A57 (Deep Navy)
- **Secondary**: #F2B705 (Gold)
- **Accent**: #274C77 (Blue)

Colors are defined in `src/theme/themeConfig.ts` and applied via CSS custom properties.

## Security Features

1. **Token Management**: Access tokens stored in memory, refresh tokens handled securely
2. **Auto Token Refresh**: Automatic token refresh on 401 responses
3. **Request Interceptors**: Automatic authorization header injection
4. **Protected Routes**: Route-level authentication guards
5. **CSRF Protection**: Configure CORS on backend

## Project Structure

```
src/
├── assets/              # Static assets
├── components/
│   ├── dynamic/        # Dynamic UI components
│   ├── layout/         # Layout components
│   ├── shared/         # Shared components
│   └── ui/             # Base UI components
├── context/            # React contexts
├── hooks/              # Custom hooks
├── pages/              # Page components
│   ├── Auth/          # Authentication pages
│   ├── Dashboard/     # Dashboard
│   └── Masters/       # Master data pages
├── services/           # API services
├── theme/              # Theme configuration
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## Production Checklist

- [ ] Configure proper API base URL
- [ ] Set up environment variables
- [ ] Enable CORS on backend API
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and logging
- [ ] Configure CDN for static assets
- [ ] Enable error tracking (e.g., Sentry)
- [ ] Set up CI/CD pipeline
- [ ] Configure backup strategy
- [ ] Performance testing
- [ ] Security audit

## Troubleshooting

### CORS Errors
Ensure backend API allows requests from your frontend domain.

### Authentication Issues
Check that API base URL is correct and tokens are being stored properly.

### Build Failures
Run `npm run typecheck` to identify TypeScript errors.

### API Connection Errors
Verify the API is running and accessible from your network.

## Support

For issues or questions, contact the development team or refer to the project documentation.
