# 🚀 Resume Builder SaaS Backend

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

**Enterprise-Grade Backend for Professional Resume Building Platform**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [API](#api-endpoints)

</div>

---

## 📋 Overview

This is a production-ready backend for a SaaS resume builder platform featuring AI-powered optimization, ATS scoring, PDF export, and dynamic portfolio generation.

### 🎯 Key Features

- **🔐 Enterprise Security**
  - JWT authentication with refresh tokens
  - Role-based access control (RBAC)
  - Rate limiting at multiple levels
  - Input validation and sanitization
  - Encrypted sensitive data

- **🤖 AI-Powered Features**
  - Resume optimization suggestions
  - ATS score calculation
  - Job description matching
  - Career objective generation
  - Content improvement recommendations
  - Skill gap detection

- **📄 PDF Export Engine**
  - Pixel-perfect PDF generation
  - Multiple template support
  - Custom styling options
  - A4 optimization
  - Batch export capability

- **💾 Scalable Architecture**
  - MongoDB with connection pooling
  - Redis caching layer
  - Background job processing (Bull)
  - Horizontal scaling ready
  - Docker containerization

- **📊 Analytics & Monitoring**
  - Usage analytics
  - Performance tracking
  - Error monitoring (Sentry)
  - Health check endpoints
  - Structured logging

---

## 🏗️ Architecture

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js |
| **Database** | MongoDB 7.0 |
| **Cache** | Redis 7 |
| **Queue** | Bull |
| **AI** | OpenAI GPT-4 |
| **Payments** | Stripe |
| **Storage** | AWS S3 |
| **Email** | SendGrid/SES |
| **PDF** | Puppeteer |

### Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── services/         # Business logic
├── repositories/     # Data access layer
├── models/          # Mongoose models
├── middlewares/     # Express middlewares
├── routes/          # API routes
├── validators/      # Request validation
├── utils/           # Utility functions
├── workers/         # Background jobs
├── dtos/            # Data transfer objects
└── tests/           # Test files
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 7.0
- Redis 7
- AWS Account (for S3)
- Stripe Account
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resume-builder-backend.git
   cd resume-builder-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Or run locally**
   ```bash
   # Start MongoDB
   mongod

   # Start Redis
   redis-server

   # Start the application
   npm run dev
   ```

6. **Verify installation**
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## 🔒 Environment Variables

### Required Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/resume_builder
REDIS_URI=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-char-hex-key

# AI
OPENAI_API_KEY=sk-your-openai-key

# Payments
STRIPE_SECRET_KEY=sk_test_your-stripe-key

# Email
SENDGRID_API_KEY=SG.your-sendgrid-key
EMAIL_FROM=noreply@yourplatform.com

# AWS
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
```

See `.env.example` for all available variables.

---

## 📚 API Documentation

### Authentication

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Resumes

#### Create Resume
```http
POST /api/v1/resumes
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Software Engineer Resume",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

#### AI Optimize Resume
```http
POST /api/v1/resumes/{id}/optimize
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetRole": "Senior Software Engineer",
  "industry": "Tech",
  "experienceLevel": "senior"
}
```

#### Export to PDF
```http
POST /api/v1/resumes/{id}/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "pdf",
  "quality": "high"
}
```

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth | 5 requests | 15 minutes |
| AI Features | 20 requests | 1 hour |
| PDF Export | 20 requests | 1 hour |
| General | 100 requests | 15 minutes |

---

## 🔐 Security Features

### Authentication Flow

1. User submits credentials
2. Server validates credentials
3. Server generates access token (15min) + refresh token (7days)
4. Tokens stored in Redis with session data
5. Client includes token in Authorization header

### Rate Limiting Strategy

- IP-based for unauthenticated requests
- User-based for authenticated requests
- Tier-based limits (Free < Pro < Enterprise)
- Redis-backed for distributed systems

### Data Protection

- Passwords hashed with bcrypt (12 rounds)
- Sensitive data encrypted with AES-256-GCM
- JWT tokens signed with HS256
- API request signing for sensitive operations

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

---

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t resume-builder-api .
```

### Run Container
```bash
docker run -p 3000:3000 \
  --env-file .env \
  resume-builder-api
```

### Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Scale backend
docker-compose up -d --scale backend=3
```

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "healthy"
    },
    "redis": {
      "status": "healthy"
    }
  }
}
```

### Logging

Logs are written to:
- Console (development)
- File (production): `./logs/`
- Structured JSON format

---

## 🚦 Production Checklist

- [ ] Change all default passwords/secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Configure CDN for static assets
- [ ] Enable rate limiting
- [ ] Set up log aggregation
- [ ] Configure error tracking
- [ ] Review security headers
- [ ] Load test the application
- [ ] Set up database replication
- [ ] Configure Redis clustering
- [ ] Set up webhook signatures

---

## 📈 Scalability

### Horizontal Scaling

The application is designed for horizontal scaling:

1. **Stateless Design** - All state in Redis
2. **Session Management** - Redis-backed sessions
3. **Queue System** - Background job processing
4. **Connection Pooling** - Database connection pools

### Scaling Strategy

```
┌─────────────┐
│   Load Balancer │
└──────┬──────┘
       │
   ┌───┴────────────────────┐
   │                         │
┌──▼──┐              ┌──────▼────┐
│ App 1│              │   App 2   │
└──┬──┘              └──────┬────┘
   │                         │
   └─────────┬───────────────┘
             │
    ┌────────▼────────┐
    │  Redis Cluster  │
    │  MongoDB Replica│
    └─────────────────┘
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

- Email: eistiakahmedmeraj@gmail.com
- Issues: https://github.com/eistiakahmed/resume-builder-backend/issues

---

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- MongoDB team for the excellent database
- Express.js community
- All contributors

---

<div align="center">

**Built with ❤️ for the developer community**

[⬆ Back to Top](#-resume-builder-saas-backend)

</div>
