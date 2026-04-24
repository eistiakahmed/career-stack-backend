# CareerStack Backend - Complete Developer Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Patterns](#architecture--design-patterns)
3. [Directory Structure](#directory-structure)
4. [Technology Stack](#technology-stack)
5. [Core Components](#core-components)
6. [Data Models](#data-models)
7. [API Reference](#api-reference)
8. [Services](#services)
9. [Middleware](#middleware)
10. [Security Implementation](#security-implementation)
11. [Authentication & Authorization](#authentication--authorization)
12. [Background Jobs](#background-jobs)
13. [Error Handling](#error-handling)
14. [Configuration](#configuration)
15. [Testing](#testing)
16. [Deployment](#deployment)

---

## Project Overview

CareerStack is a **comprehensive Resume Builder SaaS Backend** built with Node.js and Express. It provides enterprise-grade features including:

- **AI-Powered Resume Optimization** - Leverages OpenAI GPT-4 for content improvement
- **ATS Scoring** - Calculates how well resumes match job descriptions
- **PDF Export** - Generates pixel-perfect PDFs with multiple templates
- **Multi-tenant Architecture** - Supports free, pro, and enterprise tiers
- **Real-time Features** - Background job processing with Bull queues
- **Portfolio Generation** - Public portfolio URLs for resumes
- **Subscription Management** - Stripe integration for payments

### Key Features

| Feature | Description |
|---------|-------------|
| **Authentication** | JWT with refresh tokens, OAuth2 (Google, GitHub), 2FA support |
| **Resume Management** | CRUD operations, autosave, version control, sharing |
| **AI Features** | Content optimization, ATS scoring, career objective generation |
| **Analytics** | Usage tracking, event logging, dashboard statistics |
| **Admin Panel** | User management, subscription oversight, platform analytics |
| **Rate Limiting** | Tier-based limits, IP-based for unauth, user-based for auth |
| **Security** | AES-256 encryption, bcrypt hashing, input sanitization |

---

## Architecture & Design Patterns

### Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (Frontend)                  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  API Routes Layer                    │
│         (routes/*.js) - Route definitions           │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               Middleware Layer                       │
│    (middlewares/*.js) - Auth, validation, errors     │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Controller Layer                        │
│  (controllers/*.js) - Request handlers, response     │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               Service Layer                          │
│  (services/*.js) - Business logic, orchestration     │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│            Repository Layer                          │
│  (repositories/*.js) - Data access abstraction       │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               Database Layer                         │
│      MongoDB + Redis (caching & sessions)            │
└─────────────────────────────────────────────────────┘
```

### Design Patterns Used

1. **Repository Pattern** - Abstracts data access logic
2. **Service Layer Pattern** - Business logic separation
3. **Middleware Pattern** - Request processing pipeline
4. **Factory Pattern** - Token generation, encryption
5. **Singleton Pattern** - Logger, configuration, Redis connections
6. **Observer Pattern** - Queue event listeners
7. **Strategy Pattern** - Multiple authentication providers

---

## Directory Structure

```
backend-architecture/
├── config/                    # Configuration files
│   ├── env.config.js         # Environment variable validation & export
│   ├── database.config.js    # MongoDB connection & management
│   ├── redis.config.js       # Redis connection & caching
│   └── prisma.config.js      # Prisma ORM configuration
│
├── controllers/              # Request handlers (HTTP layer)
│   ├── auth.controller.js    # Authentication endpoints
│   ├── user.controller.js    # User profile management
│   ├── resume.controller.js  # Resume CRUD operations
│   ├── ai.controller.js      # AI-powered features
│   ├── subscription.controller.js  # Subscription management
│   ├── portfolio.controller.js     # Public portfolio features
│   ├── template.controller.js     # Template management
│   ├── admin.controller.js        # Admin operations
│   └── health.controller.js       # Health check endpoint
│
├── services/                 # Business logic layer
│   └── auth/
│       ├── auth.service.js   # Authentication service
│       └── auth.service.prisma.js  # Prisma implementation
│   └── resume/
│       └── resume-builder.service.js  # Resume operations
│
├── repositories/             # Data access layer
│   ├── base.repository.js    # Base repository with common methods
│   ├── user.repository.js    # User data operations
│   ├── resume.repository.js  # Resume data operations
│   └── prisma/              # Prisma-based repositories
│       ├── index.js
│       ├── user.prisma.repository.js
│       └── resume.prisma.repository.js
│
├── models/                   # Mongoose schemas
│   ├── user.model.js        # User schema with authentication
│   ├── resume.model.js      # Resume with all sections
│   ├── session.model.js     # Session management
│   ├── subscription.model.js  # Subscription & billing
│   ├── template.model.js    # Resume templates
│   └── analytics.model.js   # Usage analytics
│
├── middlewares/              # Express middleware
│   ├── auth.middleware.js   # JWT verification & authorization
│   ├── rbac.middleware.js   # Role-based access control
│   ├── validation.middleware.js  # Request validation
│   ├── rate-limit.middleware.js  # Rate limiting
│   ├── cache.middleware.js  # Response caching
│   ├── logger.middleware.js # Request logging
│   └── error.middleware.js  # Error handling
│
├── routes/                   # API route definitions
│   ├── index.js            # Main router (aggregates all routes)
│   ├── auth.routes.js      # Authentication routes
│   ├── user.routes.js      # User profile routes
│   ├── resume.routes.js    # Resume routes
│   ├── ai.routes.js        # AI feature routes
│   ├── subscription.routes.js  # Subscription routes
│   ├── portfolio.routes.js     # Portfolio routes
│   ├── template.routes.js      # Template routes
│   ├── admin.routes.js         # Admin routes
│   └── health.routes.js        # Health check routes
│
├── utils/                    # Utility functions
│   ├── logger.js           # Winston logger setup
│   ├── error.js            # Custom error classes
│   ├── response.js         # Standardized response helpers
│   ├── security.js         # Encryption, hashing, JWT
│   ├── constants.js        # Application constants
│   └── helpers.js          # Helper functions
│
├── workers/                  # Background job processors
│   └── queue.js            # Bull queue configuration
│
├── tests/                    # Test files
│   ├── setup.js            # Test setup
│   ├── global-setup.js     # Global test configuration
│   ├── global-teardown.js  # Global cleanup
│   ├── unit/               # Unit tests
│   │   ├── models/
│   │   ├── services/
│   │   ├── middlewares/
│   │   └── repositories/
│   └── integration/        # Integration tests
│
├── scripts/                  # Utility scripts
│   └── migrate-to-prisma.js  # Migration script
│
├── docker-compose.yml        # Docker services definition
├── Dockerfile               # Container image build
├── .env.example             # Environment variable template
├── package.json             # Dependencies & scripts
├── jest.config.js           # Jest testing configuration
├── server.js               # Application entry point
└── app.js                  # Express application setup
```

---

## Technology Stack

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **Framework** | Express.js | 4.18+ | Web application framework |
| **Database** | MongoDB | 7.0 | Primary database |
| **Cache** | Redis | 7+ | Caching & sessions |
| **ORM** | Mongoose | 8.0+ | MongoDB ODM |
| **ORM** | Prisma | 7.8+ | Alternative ORM |
| **Queue** | Bull | 4.12+ | Background jobs |
| **AI** | OpenAI API | 4.20+ | GPT-4 integration |
| **PDF** | PDF-lib | 1.17+ | PDF generation |
| **PDF** | Puppeteer | 21.6+ | HTML to PDF |
| **Authentication** | JWT | 9.0+ | Token-based auth |
| **Password** | bcryptjs | 2.4+ | Password hashing |
| **Validation** | Joi | 17.11+ | Schema validation |
| **Email** | SendGrid | 8.1+ | Email service |
| **Payments** | Stripe | 14.10+ | Payment processing |
| **Storage** | AWS SDK | 2.1500+ | S3 storage |
| **Monitoring** | Sentry | 8.9+ | Error tracking |
| **Logging** | Winston | 3.11+ | Structured logging |
| **Testing** | Jest | 29.7+ | Testing framework |

### Development Tools

- **nodemon** - Auto-restart on file changes
- **eslint** - Code linting
- **prettier** - Code formatting
- **supertest** - HTTP testing
- **mongodb-memory-server** - In-memory MongoDB for testing

---

## Core Components

### 1. Application Setup (app.js)

The Express application is configured with:

- **Security middleware** - Helmet.js for security headers
- **CORS** - Cross-origin resource sharing with whitelist
- **Compression** - Gzip compression for responses
- **Body parsing** - JSON and URL-encoded data
- **Rate limiting** - Express-rate-limit for DDoS protection
- **Logging** - Morgan for HTTP request logging
- **Error handling** - Global error handler

### 2. Server Entry Point (server.js)

Handles:
- Database connection (MongoDB)
- Redis connection
- Job queue initialization
- HTTP server startup
- Graceful shutdown

### 3. Configuration System (config/env.config.js)

**Environment validation using Joi schema:**

- All required variables validated at startup
- Type coercion and defaults applied
- Categorized exports (database, redis, jwt, openai, etc.)
- Feature flags for enabling/disabling features

### 4. Response Standardization (utils/response.js)

**Standard API response format:**

```javascript
{
  success: true/false,
  message: "Human-readable message",
  data: { ... },  // Response payload
  errors: [ ... ],  // Validation errors
  meta: {  // Pagination metadata
    page: 1,
    limit: 20,
    total: 100
  }
}
```

### 5. Error Handling (utils/error.js)

**Custom error classes:**

- `AppError` - Base error class
- `BadRequestError` - 400
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `NotFoundError` - 404
- `ConflictError` - 409
- `ValidationError` - 422
- `TooManyRequestsError` - 429
- `InternalServerError` - 500

---

## Data Models

### User Model (models/user.model.js)

**Schema fields:**

| Field | Type | Description |
|-------|------|-------------|
| `email` | String | Unique, indexed, lowercase |
| `password` | String | Bcrypt hashed (select: false) |
| `firstName` | String | Required, max 50 chars |
| `lastName` | String | Required, max 50 chars |
| `role` | String | guest, user, premium, admin, super_admin |
| `subscriptionTier` | String | free, pro, enterprise |
| `subscriptionStatus` | String | active, past_due, canceled, unpaid, trialing |
| `isEmailVerified` | Boolean | Email verification status |
| `twoFactorEnabled` | Boolean | 2FA status |
| `portfolioUsername` | String | Unique username for public portfolio |
| `status` | String | active, inactive, suspended, pending, deleted |

**Virtual properties:**
- `fullName` - Concatenation of first and last name
- `initials` - First letter of first and last name
- `isPro` - True if pro or enterprise tier
- `isAdmin` - True if admin or super_admin

**Methods:**
- `comparePassword(password)` - Verify password
- `generateEmailVerificationToken()` - Create verification token
- `generatePasswordResetToken()` - Create reset token
- `generateTwoFactorSecret()` - Generate 2FA secret
- `verifyTwoFactorToken(token)` - Verify 2FA code
- `updateLoginInfo(ip)` - Update last login
- `getUsageStats()` - Get usage vs limits

### Resume Model (models/resume.model.js)

**Main fields:**

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | Reference to User (required) |
| `title` | String | Resume title (default: "My Resume") |
| `firstName` | String | Contact first name |
| `lastName` | String | Contact last name |
| `email` | String | Contact email |
| `phone` | String | Contact phone |
| `location` | String | Contact location |
| `summary` | String | Professional summary (max 2000 chars) |
| `status` | String | draft, complete, archived |
| `isPublic` | Boolean | Public portfolio visibility |
| `shareToken` | String | Unique share token |

**Sections (arrays):**

1. **workExperience** - Work history
   - company, position, location
   - startDate, endDate, isCurrentPosition
   - description, achievements, skillsUsed
   - employmentType

2. **education** - Education history
   - institution, degree, field
   - startDate, endDate, gpa
   - honors, coursework, description

3. **skills** - Skills list
   - name, category, proficiency
   - yearsOfExperience

4. **projects** - Personal/Work projects
   - name, description, role
   - technologies, achievements
   - links (github, live, demo)

5. **certifications** - Certifications
   - name, issuer, issueDate
   - expirationDate, credentialUrl

6. **languages** - Language proficiency
   - name, proficiency (basic to native)

7. **customSections** - User-defined sections
   - title, content, order, items

8. **awards** - Awards and honors
9. **publications** - Research papers
10. **patents** - Patent filings
11. **volunteerWork** - Volunteer experience
12. **interests** - Personal interests

**Template configuration:**
```javascript
template: {
  id: "modern",
  category: "modern|corporate|executive|developer|creative",
  customizations: {
    font: "Inter",
    fontSize: 11,
    lineSpacing: 1.15,
    margin: { top, bottom, left, right },
    accentColor: "#2563eb",
    showSectionDividers: true
  }
}
```

**ATS Analysis:**
```javascript
atsAnalysis: {
  score: 85,  // 0-100
  lastAnalyzed: Date,
  keywordMatches: [{ keyword, found }],
  missingKeywords: ["React", "TypeScript"],
  suggestions: [{ priority, category, message }],
  jobDescription: "Target job description"
}
```

### Subscription Model (models/subscription.model.js)

**Fields:**
- `userId` - Reference to User
- `tier` - free, pro, enterprise
- `status` - active, canceled, past_due, etc.
- `stripeSubscriptionId` - Stripe subscription ID
- `stripeCustomerId` - Stripe customer ID
- `currentPeriodStart` - Period start date
- `currentPeriodEnd` - Period end date
- `cancelAtPeriodEnd` - Cancellation pending

### Template Model (models/template.model.js)

**Fields:**
- `name` - Template name
- `category` - Template category
- `description` - Template description
- `thumbnail` - Preview image URL
- `template` - Template configuration
- `isPremium` - Pro/enterprise only
- `isActive` - Available for use

---

## API Reference

### Base URL
```
/api/v1
```

### Authentication Routes (`/auth`)

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response 201:
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "15m"
    },
    "requiresVerification": true
  }
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

Response 200:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": { ... },
    "requiresTwoFactor": false
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response 200:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "15m"
    }
  }
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}

Response 200:
{
  "success": true,
  "message": "Logout successful",
  "data": { "success": true }
}
```

#### Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "success": true,
  "message": "If email exists, password reset instructions have been sent",
  "data": { "success": true }
}
```

#### Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "NewSecurePass123!"
}

Response 200:
{
  "success": true,
  "message": "Password reset successful",
  "data": { "success": true }
}
```

### Resume Routes (`/resumes`)

#### Create Resume
```http
POST /api/v1/resumes
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Software Engineer Resume",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "summary": "Experienced software engineer..."
}

Response 201:
{
  "success": true,
  "message": "Resume created successfully",
  "data": {
    "resume": { ... }
  }
}
```

#### Get All User Resumes
```http
GET /api/v1/resumes?page=1&limit=20&status=draft
Authorization: Bearer {accessToken}

Response 200:
{
  "success": true,
  "message": "Resumes retrieved successfully",
  "data": {
    "resumes": [ ... ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

#### Get Resume by ID
```http
GET /api/v1/resumes/{resumeId}
Authorization: Bearer {accessToken}

Response 200:
{
  "success": true,
  "message": "Resume retrieved successfully",
  "data": {
    "resume": { ... }
  }
}
```

#### Update Resume
```http
PUT /api/v1/resumes/{resumeId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Updated Title",
  "summary": "Updated summary..."
}

Response 200:
{
  "success": true,
  "message": "Resume updated successfully",
  "data": {
    "resume": { ... }
  }
}
```

#### Patch Resume (Autosave)
```http
PATCH /api/v1/resumes/{resumeId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "workExperience": [ ... ],
  "skills": [ ... ]
}

Response 200:
{
  "success": true,
  "message": "Resume updated successfully",
  "data": {
    "resume": { ... }
  }
}
```

#### Delete Resume
```http
DELETE /api/v1/resumes/{resumeId}
Authorization: Bearer {accessToken}

Response 200:
{
  "success": true,
  "message": "Resume deleted successfully",
  "data": { "success": true }
}
```

#### Duplicate Resume
```http
POST /api/v1/resumes/{resumeId}/duplicate
Authorization: Bearer {accessToken}

Response 201:
{
  "success": true,
  "message": "Resume duplicated successfully",
  "data": {
    "resume": { ... }
  }
}
```

#### Create Share Link
```http
POST /api/v1/resumes/{resumeId}/share
Authorization: Bearer {accessToken}

Response 200:
{
  "success": true,
  "message": "Share link created successfully",
  "data": {
    "shareUrl": "https://careercstack.com/r/a1b2c3d4...",
    "shareToken": "a1b2c3d4..."
  }
}
```

#### View Shared Resume
```http
GET /api/v1/resumes/shared/{shareToken}

Response 200:
{
  "success": true,
  "message": "Resume retrieved successfully",
  "data": {
    "resume": { ... }
  }
}
```

### AI Routes (`/ai`)

#### Optimize Resume
```http
POST /api/v1/ai/optimize
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "resumeId": "507f1f77bcf86cd799439011",
  "targetRole": "Senior Software Engineer",
  "industry": "Technology",
  "experienceLevel": "senior",
  "options": {
    "improveSummary": true,
    "enhanceAchievements": true,
    "addKeywords": true
  }
}

Response 200:
{
  "success": true,
  "message": "Resume optimized successfully",
  "data": {
    "resumeId": "507f1f77bcf86cd799439011",
    "optimizations": {
      "summary": {
        "original": "...",
        "improved": "...",
        "reasoning": "..."
      },
      "improvedAchievements": [ ... ],
      "missingKeywords": [ ... ],
      "suggestions": [ ... ]
    },
    "atsScore": 85,
    "aiCreditsUsed": 1
  }
}
```

#### Get ATS Score
```http
POST /api/v1/ai/ats-score
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "resumeId": "507f1f77bcf86cd799439011",
  "jobDescription": "Senior React Developer with 5+ years...",
  "jobTitle": "Senior React Developer",
  "requiredSkills": ["React", "TypeScript", "Node.js"]
}

Response 200:
{
  "success": true,
  "message": "ATS score calculated successfully",
  "data": {
    "resumeId": "507f1f77bcf86cd799439011",
    "jobTitle": "Senior React Developer",
    "score": 78,
    "breakdown": {
      "keywords": 85,
      "format": 90,
      "content": 70,
      "structure": 80
    },
    "keywordMatches": [ ... ],
    "missingKeywords": [ ... ],
    "suggestions": [ ... ],
    "aiCreditsUsed": 1
  }
}
```

#### Generate Career Objective
```http
POST /api/v1/ai/generate-objective
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "techStack": ["JavaScript", "React", "Node.js"],
  "experienceLevel": "senior",
  "targetRole": "Full Stack Developer",
  "industry": "Technology",
  "companyType": "startup",
  "leadershipGoals": true
}

Response 200:
{
  "success": true,
  "message": "Career objective generated successfully",
  "data": {
    "objectives": {
      "short": "...",
      "medium": "..."
    },
    "recommended": "...",
    "aiCreditsUsed": 1
  }
}
```

### Admin Routes (`/admin`)

#### Get Dashboard Stats
```http
GET /api/v1/admin/dashboard
Authorization: Bearer {accessToken}
Role: admin

Response 200:
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "users": {
      "total": 1000,
      "active": 850,
      "growth": 12.5
    },
    "subscriptions": {
      "total": 200,
      "active": 180,
      "revenue": 15000
    },
    "resumes": {
      "total": 3500,
      "createdThisMonth": 250
    },
    "recentActivity": [ ... ]
  }
}
```

#### Get All Users
```http
GET /api/v1/admin/users?page=1&limit=20&status=active&tier=free
Authorization: Bearer {accessToken}
Role: admin

Response 200:
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [ ... ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

#### Suspend User
```http
POST /api/v1/admin/users/{userId}/suspend
Authorization: Bearer {accessToken}
Role: admin
Content-Type: application/json

{
  "reason": "Violation of terms of service"
}

Response 200:
{
  "success": true,
  "message": "User suspended successfully",
  "data": { "success": true }
}
```

### Health Check (`/health`)

```http
GET /api/health

Response 200:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "v1",
  "services": {
    "database": {
      "status": "healthy"
    },
    "redis": {
      "status": "healthy"
    }
  },
  "system": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "arch": "x64",
    "memory": {
      "used": "256 MB",
      "total": "512 MB"
    }
  }
}
```

---

## Services

### Authentication Service (services/auth/auth.service.js)

**Responsibilities:**
- User registration and validation
- Login with credential verification
- Token generation (access + refresh)
- Session management in Redis
- Email verification
- Password reset flow
- Social OAuth handling
- Logout with token invalidation

**Key Methods:**

| Method | Description |
|--------|-------------|
| `register(userData)` | Register new user, hash password, generate tokens |
| `login(email, password, deviceInfo)` | Verify credentials, create session |
| `socialAuth({provider, token, ...})` | Handle OAuth login/register |
| `refreshToken(refreshToken)` | Generate new access token |
| `logout(userId, accessToken)` | Invalidate tokens and session |
| `verifyEmail(token)` | Verify email address |
| `forgotPassword(email)` | Initiate password reset |
| `resetPassword(token, newPassword)` | Complete password reset |
| `changePassword(userId, current, new)` | Change authenticated user password |

### Resume Builder Service (services/resume/resume-builder.service.js)

**Responsibilities:**
- Resume CRUD operations
- Section management (experience, education, etc.)
- Template changes
- Share link generation
- Public resume access
- Resume statistics

**Key Methods:**

| Method | Description |
|--------|-------------|
| `createResume(userId, data)` | Create new resume |
| `getResume(resumeId, userId)` | Get single resume with ownership check |
| `getUserResumes(userId, options)` | Get paginated user resumes |
| `updateResume(resumeId, userId, data)` | Full update |
| `patchResume(resumeId, userId, data)` | Partial update (autosave) |
| `deleteResume(resumeId, userId)` | Delete resume |
| `duplicateResume(resumeId, userId)` | Clone resume |
| `changeTemplate(resumeId, userId, templateId)` | Change template |
| `reorderSections(resumeId, userId, order)` | Reorder resume sections |
| `toggleSection(resumeId, userId, section)` | Show/hide section |
| `createShareLink(resumeId, userId)` | Generate shareable link |
| `revokeShareLink(resumeId, userId)` | Remove public access |
| `viewSharedResume(shareToken)` | View public resume |
| `getResumeStats(userId)` | Get user resume statistics |

---

## Middleware

### Authentication Middleware (middlewares/auth.middleware.js)

**Functions:**

| Function | Description |
|----------|-------------|
| `authenticate` | Verify JWT and attach user to request |
| `optionalAuth` | Attach user if token exists (no error) |
| `verifyRefreshToken` | Verify refresh token validity |
| `requireVerifiedEmail` | Check if email is verified |
| `requireSubscription(minTier)` | Check subscription tier |
| `requireActiveSubscription` | Check subscription is active |
| `hasPermission(permission)` | Check specific permission |
| `hasAllPermissions(...permissions)` | Check multiple permissions |
| `ownsResource(getResourceId)` | Check resource ownership |
| `requireTwoFactor` | Verify 2FA if enabled |

**Usage example:**
```javascript
router.post('/resumes',
  authenticate,  // Must be logged in
  requireSubscription('pro'),  // Must have pro tier
  resumeController.createResume
);
```

### Validation Middleware (middlewares/validation.middleware.js)

Validates request bodies using Joi schemas.

**Usage:**
```javascript
const { validateBody } = require('../middlewares/validation.middleware');
const { registerSchema } = require('../validators/auth.validator');

router.post('/register',
  validateBody(registerSchema),
  authController.register
);
```

### Rate Limiting Middleware (middlewares/rate-limit.middleware.js)

**Rate limit tiers:**

| Tier | Limit | Window |
|------|-------|--------|
| General | 100 requests | 15 minutes |
| Auth | 5 requests | 15 minutes |
| AI Features | 20 requests | 1 hour |
| PDF Export | 20 requests | 1 hour |

**Implementation:**
- IP-based for unauthenticated requests
- User-based for authenticated requests
- Redis-backed for distributed systems
- Configurable per endpoint

### Error Middleware (middlewares/error.middleware.js)

**Components:**
1. **asyncHandler** - Wraps async route handlers to catch errors
2. **notFoundHandler** - Handles 404 errors
3. **errorHandler** - Global error handler with appropriate status codes

**Usage:**
```javascript
router.get('/resumes/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const resume = await resumeService.getResume(req.params.id, req.user.userId);
    return successResponse(res, { resume }, 'Resume retrieved');
  })
);
```

---

## Security Implementation

### Encryption (utils/security.js - Encryption class)

**AES-256-GCM Encryption:**

Used for encrypting sensitive data at rest:
- API keys
- OAuth tokens
- Personal information

**Methods:**
```javascript
const encrypted = Encryption.encrypt(text);
const decrypted = Encryption.decrypt(encrypted);
const hash = Encryption.hash(data);  // SHA-256
const token = Encryption.generateToken(32);  // Random hex
const apiKey = Encryption.generateApiKey();  // rb_ prefix
```

### Password Management (utils/security.js - Password class)

**Bcrypt hashing with configurable rounds:**

```javascript
// Hash password
const hashed = await Password.hash(plainPassword);

// Verify password
const isValid = await Password.verify(plainPassword, hash);

// Validate strength
const validation = Password.validateStrength(password);
// Returns: { valid: true/false, score: 0-5, feedback: [...] }
```

**Password requirements:**
- Minimum 8 characters
- Maximum 128 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character
- Not in common passwords list

### Token Management (utils/security.js - Token class)

**JWT token operations:**

```javascript
// Generate tokens
const tokens = Token.generateTokenPair({
  userId: user._id.toString(),
  email: user.email,
  role: user.role,
  subscriptionTier: user.subscriptionTier
});
// Returns: { accessToken, refreshToken, expiresIn }

// Verify access token
const decoded = Token.verifyAccessToken(token);

// Verify refresh token
const decoded = Token.verifyRefreshToken(token);

// Generate specialized tokens
const emailToken = Token.generateEmailVerificationToken(email);
const resetToken = Token.generatePasswordResetToken(email);

// Verify specialized tokens
const decoded = Token.verifyEmailToken(token);
const decoded = Token.verifyPasswordResetToken(token);
```

### Input Sanitization (utils/security.js - Sanitizer class)

**Sanitization methods:**

```javascript
// Sanitize strings (remove XSS)
const clean = Sanitizer.sanitizeString(input);

// Sanitize email
const email = Sanitizer.sanitizeEmail(email);

// Sanitize phone
const phone = Sanitizer.sanitizePhone(phone);

// Sanitize entire object
const clean = Sanitizer.sanitizeObject(obj);

// Remove sensitive fields
const clean = Sanitizer.removeSensitiveFields(user, ['password', 'pin']);

// Mask sensitive data
const masked = Sanitizer.maskSensitiveData('1234567890', 4);
// Returns: "1234****"

// Sanitize MongoDB query (prevent NoSQL injection)
const clean = Sanitizer.sanitizeMongoQuery(query);
```

---

## Authentication & Authorization

### JWT Authentication Flow

```
┌─────────┐                    ┌─────────────┐                  ┌──────────┐
│  Client │                    │   Server    │                  │  Redis   │
└────┬────┘                    └──────┬──────┘                  └────┬─────┘
     │                                │                              │
     │ 1. POST /login                 │                              │
     │    {email, password}           │                              │
     ├───────────────────────────────>│                              │
     │                                │                              │
     │                                │ 2. Verify credentials        │
     │                                │    Compare password          │
     │                                │                              │
     │                                │ 3. Generate tokens           │
     │                                │    accessToken (15min)       │
     │                                │    refreshToken (7days)      │
     │                                │                              │
     │                                │ 4. Store session in Redis   │
     │                                ├─────────────────────────────>│
     │                                │    session:{userId}         │
     │                                │    refresh_token:{userId}   │
     │                                │                              │
     │ 5. Return tokens               │                              │
     │<───────────────────────────────┤                              │
     │                                │                              │
     │ 6. Store tokens                │                              │
     │    in localStorage/cookies      │                              │
     │                                │                              │
     │ 7. API request with token      │                              │
     ├───────────────────────────────>│                              │
     │    Authorization: Bearer {token}                               │
     │                                │                              │
     │                                │ 8. Verify token              │
     │                                │                              │
     │                                │ 9. Check blacklist           │
     │                                ├─────────────────────────────>│
     │                                │    blacklist:{token}         │
     │                                │                              │
     │                                │ 10. Check session            │
     │                                ├─────────────────────────────>│
     │                                │    session:{userId}         │
     │                                │                              │
     │                                │ 11. Attach user to req      │
     │                                │                              │
     │ 12. Return response            │                              │
     │<───────────────────────────────┤                              │
     │                                │                              │
     │ 13. Refresh token flow         │                              │
     ├───────────────────────────────>│                              │
     │    {refreshToken}              │                              │
     │                                │                              │
     │                                │ 14. Verify refresh token     │
     │                                ├─────────────────────────────>│
     │                                │    refresh_token:{userId}   │
     │                                │                              │
     │                                │ 15. Generate new tokens      │
     │                                │                              │
     │                                │ 16. Update session           │
     │                                ├─────────────────────────────>│
     │                                │                              │
     │ 17. Return new tokens          │                              │
     │<───────────────────────────────┤                              │
     │                                │                              │
     │ 18. Logout                     │                              │
     ├───────────────────────────────>│                              │
     │                                │                              │
     │                                │ 19. Blacklist access token   │
     │                                ├─────────────────────────────>│
     │                                │    blacklist:{token}         │
     │                                │                              │
     │                                │ 20. Delete session           │
     │                                ├─────────────────────────────>│
     │                                │    session:{userId}          │
     │                                │    refresh_token:{userId}   │
     │                                │                              │
     │ 21. Confirm logout             │                              │
     │<───────────────────────────────┤                              │
```

### Role-Based Access Control (RBAC)

**User roles:**
- `guest` - Unauthenticated users
- `user` - Regular authenticated users
- `premium` - Paid users
- `admin` - Platform administrators
- `super_admin` - Platform owners

**Subscription tiers:**
- `free` - Limited features, 3 resumes, 5 AI credits
- `pro` - Unlimited resumes and AI credits
- `enterprise` - Custom limits and features

**Middleware usage:**
```javascript
// Require authentication
router.post('/resumes', authenticate, resumeController.create);

// Require verified email
router.post('/resumes', authenticate, requireVerifiedEmail, resumeController.create);

// Require specific subscription tier
router.post('/ai/optimize', authenticate, requireSubscription('pro'), aiController.optimize);

// Require admin role
router.get('/admin/users', authenticate, hasRole('admin'), adminController.getUsers);

// Require specific permission
router.post('/admin/settings', authenticate, hasPermission('manage_settings'), adminController.updateSettings);
```

---

## Background Jobs

### Bull Queue (workers/queue.js)

**Job types:**

| Job Type | Description | Priority |
|----------|-------------|----------|
| `pdf-export` | Generate PDF from resume | High |
| `ai-optimize` | Run AI optimization | Medium |
| `email-send` | Send emails | Low |
| `analytics-process` | Process analytics events | Low |

**Queue configuration:**
```javascript
{
  redis: { host: 'localhost', port: 6379, db: 3 },
  defaultJobOptions: {
    attempts: 3,  // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000  // Initial delay between retries
    },
    removeOnComplete: false,  // Keep completed jobs
    removeOnFail: false  // Keep failed jobs
  }
}
```

**Adding jobs:**
```javascript
const queue = require('../workers/queue');

// Add job to queue
const job = await queue.addJob('pdf-export', {
  resumeId: '507f1f77bcf86cd799439011',
  userId: '507f1f77bcf86cd799439012',
  options: { quality: 'high', format: 'pdf' }
}, {
  priority: 1,  // Higher priority = processed first
  attempts: 5,
  timeout: 30000  // 30 second timeout
});
```

**Processing jobs:**
```javascript
// Job processor would be in separate file
resumeQueue.process('pdf-export', async (job) => {
  const { resumeId, userId, options } = job.data;

  try {
    // Generate PDF
    const pdfUrl = await generatePDF(resumeId, options);

    // Update progress
    job.progress(100);

    return { success: true, pdfUrl };
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
});
```

**Queue status:**
```javascript
const status = await queue.getQueueStatus();
// Returns: { waiting: 5, active: 2, completed: 100, failed: 3 }
```

---

## Error Handling

### Error Class Hierarchy

```
AppError (Base Error)
├── BadRequestError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── ValidationError (422)
├── TooManyRequestsError (429)
└── InternalServerError (500)
```

### Throwing Errors

```javascript
const { NotFoundError, ForbiddenError } = require('../utils/error');

// In service
async getResume(resumeId, userId) {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new NotFoundError('Resume not found');
  }
  if (resume.userId.toString() !== userId) {
    throw new ForbiddenError('You do not have access to this resume');
  }
  return resume;
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error message for client",
  "code": "RESUME_NOT_FOUND",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## Configuration

### Environment Variables (.env.example)

```bash
# ============================================
# Application
# ============================================
NODE_ENV=production
PORT=3000
API_VERSION=v1
API_PREFIX=/api

# ============================================
# Client URLs (CORS)
# ============================================
CLIENT_URL=https://careercstack.com
CLIENT_URL_DEV=http://localhost:3000

# ============================================
# Database (MongoDB)
# ============================================
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=careercstack
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2

# ============================================
# Redis
# ============================================
REDIS_URI=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=careercstack:
REDIS_TTL=3600

# ============================================
# JWT
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=careercstack

# ============================================
# Session
# ============================================
SESSION_SECRET=your-session-secret-min-32-chars
SESSION_MAX_AGE=604800000

# ============================================
# OpenAI
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORGANIZATION=
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
OPENAI_TIMEOUT=30000

# ============================================
# AWS
# ============================================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=careercstack
AWS_S3_BUCKET_RESUMES=careercstack-resumes
AWS_CLOUDFRONT_DOMAIN=

# ============================================
# Stripe
# ============================================
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key

# ============================================
# Email (SendGrid)
# ============================================
EMAIL_FROM=noreply@careercstack.com
EMAIL_REPLY_TO=support@careercstack.com
SENDGRID_API_KEY=SG.your-sendgrid-key

# ============================================
# Rate Limiting
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
AI_RATE_LIMIT_MAX=20

# ============================================
# File Upload
# ============================================
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/jpg
MAX_RESUME_SIZE=10485760

# ============================================
# Pagination
# ============================================
DEFAULT_PAGE=1
DEFAULT_LIMIT=20
MAX_LIMIT=100

# ============================================
# PDF Generation
# ============================================
PDF_ENGINE_TIMEOUT=30000
PDF_QUALITY=high
PDF_MAX_PAGES=5

# ============================================
# Queue (Bull)
# ============================================
QUEUE_REDIS_HOST=localhost
QUEUE_REDIS_PORT=6379
QUEUE_CONCURRENCY=5
JOB_MAX_ATTEMPTS=3
JOB_BACKOFF_TYPE=exponential
JOB_BACKOFF_DELAY=2000

# ============================================
# Analytics
# ============================================
ANALYTICS_ENABLED=true
MIXPANEL_TOKEN=
GA_TRACKING_ID=

# ============================================
# Security
# ============================================
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=your-32-character-hex-key-here
TWO_FACTOR_AUTH_ENABLED=true

# ============================================
# Monitoring
# ============================================
LOG_LEVEL=info
SENTRY_DSN=
SENTRY_ENVIRONMENT=production

# ============================================
# Feature Flags
# ============================================
ENABLE_AI_FEATURES=true
ENABLE_PUBLIC_PORTFOLIO=true
ENABLE_TEMPLATES=true
ENABLE_EXPORT_PDF=true

# ============================================
# Subscription Limits
# ============================================
FREE_PLAN_RESUMES=3
FREE_PLAN_AI_CREDITS=5
PRO_PLAN_RESUMES=-1
PRO_PLAN_AI_CREDITS=-1
```

---

## Testing

### Test Structure

```
tests/
├── setup.js              # Test setup (before all)
├── global-setup.js       # Global Jest setup
├── global-teardown.js    # Global Jest teardown
│
├── unit/                 # Unit tests
│   ├── models/
│   │   ├── user.model.test.js
│   │   └── resume.model.test.js
│   ├── services/
│   │   ├── auth.service.test.js
│   │   └── resume-builder.service.test.js
│   ├── middlewares/
│   │   ├── auth.middleware.test.js
│   │   └── validation.middleware.test.js
│   └── repositories/
│       └── user.repository.test.js
│
└── integration/          # Integration tests
    └── api.integration.test.js
```

### Running Tests

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

# Run specific test file
npm test -- user.model.test.js
```

### Example Test

```javascript
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/user.model');

describe('Auth Controller', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return error for existing email', async () => {
      await User.create({
        email: 'existing@example.com',
        password: 'hashedPassword',
        firstName: 'Existing',
        lastName: 'User'
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already registered');
    });
  });
});
```

---

## Deployment

### Docker Deployment

**Build image:**
```bash
docker build -t careercstack-backend .
```

**Run container:**
```bash
docker run -p 3000:3000 \
  --env-file .env \
  careercstack-backend
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

### Production Checklist

- [ ] Set strong JWT secrets (min 32 chars)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring (Sentry)
- [ ] Configure log aggregation
- [ ] Set up database backups
- [ ] Configure Redis persistence
- [ ] Enable rate limiting
- [ ] Review security headers
- [ ] Set up CDN for static assets
- [ ] Configure webhook signatures
- [ ] Set up database replication
- [ ] Configure Redis clustering
- [ ] Load test the application
- [ ] Set up CI/CD pipeline

### Environment-Specific Configurations

**Development:**
- Detailed logging
- Hot reload with nodemon
- Local MongoDB/Redis
- CORS enabled for all origins

**Production:**
- Structured JSON logging
- Process management with PM2
- Managed MongoDB Atlas
- Managed Redis (ElastiCache)
- CORS whitelist
- Compression enabled
- Rate limiting enabled

---

## Additional Notes

### API Versioning

The API uses URL-based versioning: `/api/v1/...`

To create a new version:
1. Copy routes to `/api/v2/`
2. Update `API_VERSION` in env config
3. Maintain backward compatibility

### Pagination

Default pagination: `page=1`, `limit=20`

Max limit: 100 items per request

Response format:
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Rate Limiting

Headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

### Caching Strategy

- **Response caching** - Cache GET endpoints for 5 minutes
- **Resume data** - Cache individual resumes
- **User data** - Cache user profiles
- **Session data** - Store in Redis with TTL

### Logging Levels

- `error` - Critical errors requiring attention
- `warn` - Warnings that don't stop execution
- `info` - General informational messages
- `debug` - Detailed debugging information (development only)

---

## Support & Contributing

For issues, questions, or contributions, please refer to the repository:
https://github.com/eistiakahmed/career-stack-backend

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-04-24  
**Author:** Eistiak Ahmed
