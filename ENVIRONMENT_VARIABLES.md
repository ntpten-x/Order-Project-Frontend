# Environment Variables Documentation

## Required Variables

### Backend API
- `NEXT_PUBLIC_BACKEND_API` - Backend API URL (default: http://localhost:4000)
  - Used for API calls and Socket.IO connection
  - Must be accessible from the frontend domain

## Optional Variables

### Environment
- `NODE_ENV` - Environment mode (development/production)

### Server-side Proxy (Next API routes)
- `BACKEND_API_INTERNAL` - Internal backend URL used by Next API route proxy
- `TRUST_PROXY_CHAIN` - Enable forwarding sanitized client IP chain to backend only when frontend is behind trusted proxy (`1`/`true`)

## Monitoring Services (Optional)

### Sentry (Error Tracking)
```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_ENVIRONMENT=production
```

To integrate Sentry, you would need to:
1. Install `@sentry/nextjs`
2. Initialize Sentry in `next.config.mjs`
3. Add error boundaries in your app

### Google Analytics
```env
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### Custom Analytics
```env
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-service.com/api/events
```

## Feature Flags (Optional)

- `NEXT_PUBLIC_ENABLE_OFFLINE_MODE` - Enable offline mode features (default: true)
- `NEXT_PUBLIC_ENABLE_PWA` - Enable PWA features (default: true)

## Setup Instructions

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `NEXT_PUBLIC_BACKEND_API` with your backend URL

3. **Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
   - Only include non-sensitive configuration
   - Never include API keys or secrets

4. For production, set:
   - `NEXT_PUBLIC_BACKEND_API` to your production backend URL
   - `NODE_ENV=production`

## Service Worker

The Service Worker is automatically registered in production mode. No additional configuration is needed.

## Security Notes

- Never commit `.env.local` files to version control
- Only use `NEXT_PUBLIC_` prefix for variables that need to be accessible in the browser
- Keep sensitive values server-side only
- Use environment-specific configurations for different deployment environments
