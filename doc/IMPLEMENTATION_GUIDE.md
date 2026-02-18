# Resume Builder SaaS - Implementation Guide

## Overview

This guide provides step-by-step instructions for setting up and running the Resume Builder SaaS backend.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **Redis** (v7 or higher)
- **Git** (for version control)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd backend-architecture
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/resume_builder

# Redis
REDIS_URI=redis://localhost:6379

# JWT (Generate secure keys)
JWT_SECRET=<your-32-character-secret>
JWT_REFRESH_SECRET=<your-32-character-secret>

# Encryption
ENCRYPTION_KEY=<your-32-char-hex-encryption-key>

# OpenAI (for AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 4. Start MongoDB

**Linux/Mac:**
```bash
mongod --dbpath /path/to/data
```

**Windows:**
```bash
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

**Using Docker:**
```bash
docker-compose up -d mongodb
```

### 5. Start Redis

**Linux/Mac:**
```bash
redis-server
```

**Windows:**
```bash
redis-server.exe
```

**Using Docker:**
```bash
docker-compose up -d redis
```

### 6. Start the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The API will be available at: `http://localhost:3000/api/v1`

---

## Configuration

### Database Configuration

Edit `config/database.config.js` for custom database settings:

```javascript
module.exports = {
  uri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_DB_NAME,
  maxPoolSize: 10,
  minPoolSize: 2,
};
```

### Redis Configuration

Edit `config/redis.config.js` for custom Redis settings:

```javascript
module.exports = {
  uri: process.env.REDIS_URI,
  prefix: 'resume_builder:',
  ttl: 3600,
};
```

### Environment Variables

See `.env.example` for all available configuration options.

---

## Project Structure

```
backend-architecture/
├── config/              # Configuration files
│   ├── env.config.js
│   ├── database.config.js
│   └── redis.config.js
├── utils/               # Utility functions
│   ├── logger.js
│   ├── error.js
│   ├── response.js
│   ├── constants.js
│   ├── helpers.js
│   └── security.js
├── middlewares/         # Express middleware
│   ├── auth.middleware.js
│   ├── rbac.middleware.js
│   ├── rate-limit.middleware.js
│   ├── validation.middleware.js
│   ├── error.middleware.js
│   ├── logger.middleware.js
│   └── cache.middleware.js
├── models/              # Mongoose models
│   ├── user.model.js
│   ├── resume.model.js
│   ├── subscription.model.js
│   ├── template.model.js
│   ├── session.model.js
│   └── analytics.model.js
├── repositories/        # Data access layer
│   ├── base.repository.js
│   ├── user.repository.js
│   └── resume.repository.js
├── services/            # Business logic
│   ├── auth/
│   │   └── auth.service.js
│   └── resume/
│       └── resume-builder.service.js
├── controllers/         # Request handlers
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── resume.controller.js
│   ├── template.controller.js
│   ├── ai.controller.js
│   ├── subscription.controller.js
│   ├── portfolio.controller.js
│   ├── admin.controller.js
│   └── health.controller.js
├── routes/              # API routes
│   ├── index.js
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── resume.routes.js
│   ├── template.routes.js
│   ├── ai.routes.js
│   ├── subscription.routes.js
│   ├── portfolio.routes.js
│   ├── admin.routes.js
│   └── health.routes.js
├── workers/             # Background jobs
│   └── queue.js
├── tests/               # Test files
│   └── ...
├── app.js               # Express app setup
├── server.js            # Server entry point
├── package.json
├── .env.example
├── Dockerfile
└── docker-compose.yml
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/logout` | Logout user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me` | Get current user |
| PUT | `/api/v1/users/me` | Update profile |
| POST | `/api/v1/users/avatar` | Upload avatar |

### Resumes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/resumes` | Get all resumes |
| POST | `/api/v1/resumes` | Create resume |
| GET | `/api/v1/resumes/:id` | Get resume |
| PUT | `/api/v1/resumes/:id` | Update resume |
| DELETE | `/api/v1/resumes/:id` | Delete resume |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/templates` | Get all templates |
| GET | `/api/v1/templates/featured` | Get featured templates |

### AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/optimize` | Optimize resume |
| POST | `/api/v1/ai/ats-score` | Get ATS score |
| POST | `/api/v1/ai/career-objective` | Generate summary |

For full API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

---

## Deployment

### Docker Deployment

Build the Docker image:

```bash
docker build -t resume-builder-api .
```

Run with Docker Compose:

```bash
docker-compose up -d
```

### Environment Setup for Production

1. Set `NODE_ENV=production`
2. Use secure secrets for JWT and encryption
3. Configure production database URLs
4. Set up proper CORS origins
5. Configure SSL/TLS certificates

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis configured and accessible
- [ ] SSL/TLS certificates installed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error monitoring set up
- [ ] Background worker running
- [ ] Health checks configured

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/v1/health
```

### Logs

Logs are stored in the `logs` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `access.log` - HTTP request logs

### Metrics

The application tracks:
- Request/response times
- Error rates
- Database query performance
- Redis cache hit rates
- Active users
- API usage by endpoint

---

## Troubleshooting

### Database Connection Failed

**Error:** `MongooseError: Connection failed`

**Solution:**
1. Check MongoDB is running: `mongod --version`
2. Verify connection string in `.env`
3. Check network connectivity

### Redis Connection Failed

**Error:** `Error: Redis connection to localhost:6379 failed`

**Solution:**
1. Check Redis is running: `redis-cli ping`
2. Verify Redis URI in `.env`
3. Check Redis configuration

### JWT Verification Failed

**Error:** `JsonWebTokenError: invalid token`

**Solution:**
1. Verify JWT_SECRET matches between requests
2. Check token hasn't expired
3. Ensure Authorization header format is correct

### Rate Limit Exceeded

**Error:** `Too Many Requests`

**Solution:**
1. Wait for rate limit window to reset
2. Check rate limit configuration
3. Implement backoff in client

---

## Security

### Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong secrets** for JWT and encryption
3. **Enable HTTPS** in production
4. **Keep dependencies updated**
5. **Implement proper authentication**
6. **Use parameterized queries** (Mongoose handles this)
7. **Validate all input** (Joi schemas)
8. **Implement rate limiting**
9. **Log security events**
10. **Regular security audits**

### Security Features

- JWT-based authentication
- Password hashing (bcrypt, 12 rounds)
- Rate limiting (Redis-backed)
- Input validation (Joi)
- XSS protection
- CORS configuration
- Security headers (Helmet)
- AES-256 encryption
- SQL injection prevention (Mongoose)

---

## Support

For issues and questions:

- GitHub Issues: `<repository-url>/issues`
- Email: support@yourplatform.com
- Documentation: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

**© 2024 Resume Builder SaaS Platform. All rights reserved.**
