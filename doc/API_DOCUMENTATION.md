# Resume Builder SaaS API Documentation

## Overview

This is the REST API documentation for the Resume Builder SaaS platform. The API provides endpoints for user authentication, resume management, AI-powered features, templates, subscriptions, portfolios, and admin operations.

**Base URL**: `http://localhost:3000/api/v1`

**API Version**: v1

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Resumes](#resumes)
4. [Templates](#templates)
5. [AI Features](#ai-features)
6. [Subscriptions](#subscriptions)
7. [Portfolios](#portfolios)
8. [Admin](#admin)
9. [Health Checks](#health-checks)

---

## Authentication

### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Login

**POST** `/auth/login`

Authenticate with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "tokens": {...}
  }
}
```

### Refresh Token

**POST** `/auth/refresh`

Get a new access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout

**POST** `/auth/logout`

Invalidate the current session.

**Headers:** `Authorization: Bearer <accessToken>`

---

## Users

### Get Current User

**GET** `/users/me`

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### Update Profile

**PUT** `/users/me`

Update the authenticated user's profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

### Upload Avatar

**POST** `/users/avatar`

Upload a profile avatar image.

**Headers:** `Authorization: Bearer <accessToken>`

**Content-Type:** `multipart/form-data`

---

## Resumes

### Get All Resumes

**GET** `/resumes`

Get all resumes for the authenticated user.

**Headers:** `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string: 'draft', 'complete', 'archived')

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resumes": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

### Create Resume

**POST** `/resumes`

Create a new resume.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "title": "Software Developer Resume",
  "targetJobTitle": "Software Developer"
}
```

### Get Resume by ID

**GET** `/resumes/:id`

Get a specific resume.

**Headers:** `Authorization: Bearer <accessToken>`

### Update Resume

**PUT** `/resumes/:id`

Update a resume (full replacement).

**Headers:** `Authorization: Bearer <accessToken>`

### Patch Resume

**PATCH** `/resumes/:id`

Update a resume (partial update).

**Headers:** `Authorization: Bearer <accessToken>`

### Delete Resume

**DELETE** `/resumes/:id`

Delete a resume.

**Headers:** `Authorization: Bearer <accessToken>`

### Duplicate Resume

**POST** `/resumes/:id/duplicate`

Create a copy of a resume.

**Headers:** `Authorization: Bearer <accessToken>`

---

## Work Experience

### Add Experience

**POST** `/resumes/:id/experience`

Add work experience to a resume.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "company": "Tech Corp",
  "position": "Senior Developer",
  "location": "San Francisco, CA",
  "startDate": "2020-01-01",
  "endDate": "2023-12-31",
  "isCurrentPosition": false,
  "description": "Led development of...",
  "achievements": ["Increased revenue by 20%"],
  "skillsUsed": ["JavaScript", "Node.js"]
}
```

### Update Experience

**PUT** `/resumes/:id/experience/:experienceId`

Update work experience.

**Headers:** `Authorization: Bearer <accessToken>`

### Delete Experience

**DELETE** `/resumes/:id/experience/:experienceId`

Delete work experience.

**Headers:** `Authorization: Bearer <accessToken>`

---

## Education

### Add Education

**POST** `/resumes/:id/education`

Add education to a resume.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "institution": "University Name",
  "degree": "Bachelor of Science",
  "field": "Computer Science",
  "location": "Cambridge, MA",
  "startDate": "2015-09-01",
  "endDate": "2019-05-31",
  "gpa": "3.8"
}
```

### Update Education

**PUT** `/resumes/:id/education/:educationId`

Update education.

**Headers:** `Authorization: Bearer <accessToken>`

### Delete Education

**DELETE** `/resumes/:id/education/:educationId`

Delete education.

**Headers:** `Authorization: Bearer <accessToken>`

---

## Skills

### Add Skills

**POST** `/resumes/:id/skills`

Add skills to a resume.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "skills": [
    { "name": "JavaScript", "level": "expert" },
    { "name": "Python", "level": "intermediate" }
  ]
}
```

### Update Skills

**PUT** `/resumes/:id/skills`

Update all skills.

**Headers:** `Authorization: Bearer <accessToken>`

### Delete Skill

**DELETE** `/resumes/:id/skills/:skillId`

Delete a skill.

**Headers:** `Authorization: Bearer <accessToken>`

---

## Templates

### Get All Templates

**GET** `/templates`

Get all available templates.

**Query Parameters:**
- `category` (string)
- `tier` (string: 'free', 'pro', 'enterprise')

### Get Featured Templates

**GET** `/templates/featured`

Get featured templates.

### Get Template Categories

**GET** `/templates/categories`

Get all template categories.

### Get Template by ID

**GET** `/templates/:templateId`

Get a specific template.

---

## AI Features

### Optimize Resume

**POST** `/ai/optimize`

AI-powered resume optimization.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "resumeId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "jobDescription": "Senior Software Developer position..."
}
```

### Get ATS Score

**POST** `/ai/ats-score`

Calculate ATS compatibility score.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "resumeId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "jobDescription": "Job description..."
}
```

### Generate Career Objective

**POST** `/ai/career-objective`

Generate a professional summary.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "resumeId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "targetJobTitle": "Software Developer"
}
```

---

## Subscriptions

### Get Plans

**GET** `/subscription/plans`

Get available subscription plans.

### Get Current Subscription

**GET** `/subscription/current`

Get the authenticated user's current subscription.

**Headers:** `Authorization: Bearer <accessToken>`

### Create Subscription

**POST** `/subscription/create`

Create a new subscription.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "planId": "pro",
  "paymentMethodId": "pm_1234567890"
}
```

### Cancel Subscription

**POST** `/subscription/cancel`

Cancel the current subscription.

**Headers:** `Authorization: Bearer <accessToken>`

---

## Portfolios

### Get Public Portfolio

**GET** `/portfolio/:username`

Get a user's public portfolio.

### Create Portfolio

**POST** `/portfolio`

Create a public portfolio.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "username": "johndoe",
  "displayName": "John Doe",
  "bio": "Software Developer..."
}
```

### Update Portfolio

**PUT** `/portfolio`

Update portfolio.

**Headers:** `Authorization: Bearer <accessToken>`

### Delete Portfolio

**DELETE** `/portfolio`

Delete portfolio.

**Headers:** `Authorization: Bearer <accessToken>`

---

## Admin

### Get Dashboard Stats

**GET** `/admin/dashboard`

Get platform statistics.

**Headers:** `Authorization: Bearer <accessToken>` (Admin only)

### Get Users

**GET** `/admin/users`

Get all users (paginated).

**Headers:** `Authorization: Bearer <accessToken>` (Admin only)

### Get Analytics

**GET** `/admin/analytics`

Get platform analytics.

**Headers:** `Authorization: Bearer <accessToken>` (Admin only)

---

## Health Checks

### Health Check

**GET** `/health`

Check API health status.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Readiness Check

**GET** `/health/readiness`

Check if the API is ready to handle requests.

### Liveness Check

**GET** `/health/liveness`

Check if the API is alive.

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limiting

- **General**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **AI Features**: 20 requests per 15 minutes
- **Export**: 10 requests per hour

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Authentication

Most endpoints require authentication using Bearer tokens:

```
Authorization: Bearer <your_access_token>
```

Access tokens expire after 15 minutes. Use the refresh endpoint to get a new token.

---

## Pagination

List endpoints support pagination using these query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Webhooks

### Stripe Webhook

**POST** `/subscription/webhook`

Handle Stripe webhook events.

**Headers:**
- `Stripe-Signature` - Webhook signature

---

## Support

For API support, contact: api@yourplatform.com

---

**© 2024 Resume Builder SaaS Platform. All rights reserved.**
