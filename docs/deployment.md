# Deployment Guide

Production deployment guide for the Skyvera Executive Intelligence System.

## Table of Contents

- [Production Checklist](#production-checklist)
- [Environment Variables](#environment-variables)
- [Build Process](#build-process)
- [Deploying to Vercel](#deploying-to-vercel)
- [Deploying to Docker](#deploying-to-docker)
- [Deploying to AWS](#deploying-to-aws)
- [Database Migration](#database-migration)
- [Monitoring & Logging](#monitoring--logging)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)

---

## Production Checklist

### Pre-Deployment

- [ ] Set all environment variables
- [ ] Migrate database to production-grade (Turso/PostgreSQL)
- [ ] Run production build locally to verify
- [ ] Set up error tracking (Sentry, Datadog)
- [ ] Configure monitoring dashboards
- [ ] Set up database backups
- [ ] Review security headers
- [ ] Test API rate limiting
- [ ] Verify CORS configuration
- [ ] Document deployment process

### Post-Deployment

- [ ] Smoke test all critical paths
- [ ] Verify environment variables are loaded
- [ ] Check database connectivity
- [ ] Test Claude API integration
- [ ] Monitor error rates (first 24 hours)
- [ ] Verify cache is working
- [ ] Test production URL
- [ ] Set up alerting rules
- [ ] Document rollback procedure

---

## Environment Variables

### Required Variables

```bash
# Anthropic API (Required)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Database URL (Required)
DATABASE_URL=libsql://your-db.turso.io?authToken=...
# or
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Environment (Required)
NODE_ENV=production
```

### Optional Variables

```bash
# News API (Optional, for OSINT features)
NEWSAPI_KEY=your_newsapi_key

# Logging (Optional)
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration (Optional)
CACHE_MAX_SIZE=1000
CACHE_DEFAULT_TTL=300000
```

### Setting Environment Variables

**Vercel:**
```bash
vercel env add ANTHROPIC_API_KEY
vercel env add DATABASE_URL
```

**Docker:**
```bash
docker run -e ANTHROPIC_API_KEY=sk-ant-... \
           -e DATABASE_URL=libsql://... \
           skyvera-intelligence
```

**AWS (Elastic Beanstalk):**
```bash
aws elasticbeanstalk update-environment \
  --environment-name skyvera-prod \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,\
    OptionName=ANTHROPIC_API_KEY,\
    Value=sk-ant-...
```

---

## Build Process

### Local Production Build

```bash
# Install dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Build Next.js app
npm run build

# Test production server locally
npm run start
```

### Build Output

```
.next/
├── static/              # Static assets (CSS, JS bundles)
├── server/              # Server-side code
│   ├── app/             # API routes and pages
│   └── chunks/          # Code-split chunks
└── standalone/          # Self-contained build (for Docker)
```

### Build Optimization

```javascript
// next.config.ts
const nextConfig = {
  output: 'standalone',        // For Docker deployments
  compress: true,              // Enable gzip compression
  poweredByHeader: false,      // Remove X-Powered-By header
  reactStrictMode: true,       // Enable React strict mode

  // Image optimization
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif']
  },

  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version
  }
}
```

---

## Deploying to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. **Configure Build Settings:**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. **Add Environment Variables:**
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   DATABASE_URL=libsql://...
   NODE_ENV=production
   ```

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-key",
    "DATABASE_URL": "@database-url"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Custom Domain

```bash
# Add custom domain
vercel domains add skyvera-intelligence.com

# Configure DNS
# Add CNAME record: www -> cname.vercel-dns.com
```

---

## Deploying to Docker

### Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Build and Run

```bash
# Build image
docker build -t skyvera-intelligence .

# Run container
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e DATABASE_URL=libsql://... \
  -e NODE_ENV=production \
  skyvera-intelligence

# Run with docker-compose
docker-compose up -d
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Push to Container Registry

```bash
# Docker Hub
docker tag skyvera-intelligence your-username/skyvera-intelligence
docker push your-username/skyvera-intelligence

# AWS ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag skyvera-intelligence:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/skyvera-intelligence:latest

docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/skyvera-intelligence:latest
```

---

## Deploying to AWS

### Option 1: Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker skyvera-intelligence

# Create environment
eb create skyvera-prod

# Deploy
eb deploy

# Configure environment
eb setenv ANTHROPIC_API_KEY=sk-ant-... \
          DATABASE_URL=libsql://...

# Open in browser
eb open
```

### Option 2: ECS (Fargate)

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name skyvera-cluster

# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster skyvera-cluster \
  --service-name skyvera-service \
  --task-definition skyvera-intelligence \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

**task-definition.json:**
```json
{
  "family": "skyvera-intelligence",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/skyvera-intelligence:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:anthropic-key"
        }
      ]
    }
  ]
}
```

### Option 3: Lambda (Serverless)

Use Vercel or Netlify instead - they handle serverless better for Next.js.

---

## Database Migration

### From SQLite to Turso

**1. Export SQLite data:**
```bash
sqlite3 dev.db .dump > backup.sql
```

**2. Create Turso database:**
```bash
turso db create skyvera-prod
turso db show skyvera-prod  # Get connection URL
```

**3. Update DATABASE_URL:**
```bash
DATABASE_URL="libsql://skyvera-prod-yourname.turso.io?authToken=..."
```

**4. Run migrations:**
```bash
npx prisma db push
```

**5. Import data:**
```bash
turso db shell skyvera-prod < backup.sql
```

### From SQLite to PostgreSQL

**1. Install PostgreSQL adapter:**
```bash
npm install pg
```

**2. Update Prisma schema:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**3. Update DATABASE_URL:**
```bash
DATABASE_URL="postgresql://user:password@host:5432/skyvera?schema=public"
```

**4. Run migrations:**
```bash
npx prisma migrate dev --name init
npx prisma db push
```

**5. Seed production database:**
```bash
curl -X POST https://your-domain.com/api/seed
```

### Backup Strategy

**Automated daily backups:**
```bash
# Cron job (daily at 2 AM)
0 2 * * * /usr/bin/sqlite3 /app/data/dev.db .dump | gzip > /backups/$(date +\%Y\%m\%d).sql.gz

# Turso (automatic backups included)
turso db backups list skyvera-prod

# PostgreSQL
0 2 * * * pg_dump -U postgres skyvera | gzip > /backups/$(date +\%Y\%m\%d).sql.gz
```

---

## Monitoring & Logging

### Health Check Monitoring

```bash
# Uptime monitoring (every 5 minutes)
*/5 * * * * curl -f https://your-domain.com/api/health || \
  curl -X POST https://alerts.slack.com/... -d "Health check failed"
```

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
})
```

### Application Monitoring (Datadog)

```bash
npm install dd-trace
```

```javascript
// instrumentation.ts
import tracer from 'dd-trace'

tracer.init({
  service: 'skyvera-intelligence',
  env: process.env.NODE_ENV,
  logInjection: true
})
```

### Log Aggregation

**CloudWatch Logs (AWS):**
```javascript
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'

const client = new CloudWatchLogsClient({ region: 'us-east-1' })

function logToCloudWatch(message: string, level: string) {
  const params = {
    logGroupName: '/aws/skyvera-intelligence',
    logStreamName: 'production',
    logEvents: [
      {
        timestamp: Date.now(),
        message: JSON.stringify({ message, level, timestamp: new Date().toISOString() })
      }
    ]
  }
  client.send(new PutLogEventsCommand(params))
}
```

---

## Performance Optimization

### Edge Caching (Vercel/Cloudflare)

```typescript
// Add cache headers to API routes
export async function GET() {
  const data = await fetchData()

  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      'Content-Type': 'application/json'
    }
  })
}
```

### Database Optimization

```prisma
// Add indexes for frequently queried columns
@@index([bu])
@@index([customerName])
@@index([healthScore])
```

### Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  width={200}
  height={50}
  alt="Skyvera"
  priority
/>
```

### Bundle Analysis

```bash
# Analyze bundle size
npm install @next/bundle-analyzer

# In next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true npm run build
```

---

## Security Best Practices

### 1. Environment Variables

- Never commit `.env.local` to git
- Use secret management (AWS Secrets Manager, Vercel secrets)
- Rotate API keys regularly

### 2. Authentication

```typescript
// Add authentication middleware
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')

  if (!token || !isValidToken(token)) {
    return new Response('Unauthorized', { status: 401 })
  }
}

export const config = {
  matcher: '/api/:path*'
}
```

### 3. Rate Limiting

```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible'

const rateLimiter = new RateLimiterMemory({
  points: 100,      // Number of requests
  duration: 60      // Per 60 seconds
})

export async function POST(request: Request) {
  try {
    await rateLimiter.consume(request.headers.get('x-forwarded-for') || 'unknown')
  } catch {
    return new Response('Too Many Requests', { status: 429 })
  }
}
```

### 4. Security Headers

```javascript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ]
  }
}
```

### 5. CORS Configuration

```typescript
// Only allow specific origins in production
const allowedOrigins = [
  'https://skyvera-intelligence.com',
  'https://www.skyvera-intelligence.com'
]

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')

  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('Forbidden', { status: 403 })
  }

  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', origin || '')
  return response
}
```

---

## Rollback Procedure

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Docker

```bash
# Tag previous version
docker tag skyvera-intelligence:latest skyvera-intelligence:previous

# Rollback
docker stop skyvera-intelligence
docker rm skyvera-intelligence
docker run --name skyvera-intelligence skyvera-intelligence:previous
```

### AWS ECS

```bash
# Update service to previous task definition
aws ecs update-service \
  --cluster skyvera-cluster \
  --service skyvera-service \
  --task-definition skyvera-intelligence:42  # Previous version
```

---

## Troubleshooting Production Issues

### Issue: High latency

**Diagnosis:**
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/health
```

**Solutions:**
- Enable edge caching
- Increase database connection pool
- Optimize slow queries (use EXPLAIN)
- Scale horizontally (add more instances)

### Issue: Database connection errors

**Diagnosis:**
```bash
# Test database connectivity
npx prisma db pull
```

**Solutions:**
- Check DATABASE_URL is correct
- Verify database is running
- Check connection pool settings
- Review database logs

### Issue: 429 Rate Limit Errors

**Diagnosis:**
- Check Claude API dashboard for usage
- Review rate limiter logs

**Solutions:**
- Increase caching TTL
- Upgrade Claude API tier
- Implement request coalescing
- Add request queue

---

## Cost Optimization

### Vercel

- **Optimize images**: Use Next.js Image component
- **Cache aggressively**: Set long cache headers for static assets
- **Minimize serverless function calls**: Use Server Components

### AWS

- **Use Spot Instances**: 70% cost savings for ECS
- **Auto-scaling**: Scale down during off-hours
- **S3 Glacier**: Archive old backups

### Claude API

- **Cache responses**: 15-minute TTL saves 90%+ of requests
- **Batch requests**: Combine related queries
- **Use smaller model for simple tasks**: (Future consideration)

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrated and tested
- [ ] Health check endpoint responding
- [ ] Error tracking (Sentry) configured
- [ ] Monitoring (Datadog/CloudWatch) set up
- [ ] Backups automated (daily)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] SSL certificate installed
- [ ] Custom domain configured
- [ ] Alerting rules created
- [ ] Rollback procedure documented
- [ ] Load testing completed
- [ ] Documentation updated
