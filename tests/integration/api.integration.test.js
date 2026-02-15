/**
 * API Integration Tests
 * Testing end-to-end API workflows
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');

describe('API Integration Tests', () => {
  let authToken;
  let refreshToken;
  let userId;
  let testUser = {
    email: `integration${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Integration',
    lastName: 'Test',
  };

  beforeAll(async () => {
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Authentication Flow', () => {
    test('should complete full registration flow', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();

      authToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
      userId = response.body.data.user.id;
    });

    test('should login registered user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    test('should access protected route with token', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    test('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();

      authToken = response.body.data.tokens.accessToken;
    });

    test('should logout user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should not access protected route after logout', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('User Management Flow', () => {
    beforeAll(async () => {
      // Login again for user tests
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      authToken = loginResponse.body.data.tokens.accessToken;
    });

    test('should update user profile', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updates.firstName);
    });

    test('should get user stats', async () => {
      const response = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Resume Management Flow', () => {
    let resumeId;

    test('should create resume', async () => {
      const resumeData = {
        title: 'Software Developer Resume',
        targetJobTitle: 'Software Developer',
      };

      const response = await request(app)
        .post('/api/v1/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(resumeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(resumeData.title);

      resumeId = response.body.data.id;
    });

    test('should get all resumes', async () => {
      const response = await request(app)
        .get('/api/v1/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resumes).toBeInstanceOf(Array);
      expect(response.body.data.resumes.length).toBeGreaterThan(0);
    });

    test('should get specific resume', async () => {
      const response = await request(app)
        .get(`/api/v1/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(resumeId);
    });

    test('should add work experience', async () => {
      const experienceData = {
        company: 'Tech Corp',
        position: 'Senior Developer',
        location: 'San Francisco, CA',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        description: 'Led development team',
      };

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/experience`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(experienceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workExperience).toBeDefined();
    });

    test('should add education', async () => {
      const educationData = {
        institution: 'MIT',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'Cambridge, MA',
        startDate: '2015-09-01',
        endDate: '2019-05-31',
      };

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/education`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(educationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.education).toBeDefined();
    });

    test('should add skills', async () => {
      const skillsData = {
        skills: [
          { name: 'JavaScript', level: 'expert' },
          { name: 'Python', level: 'intermediate' },
        ],
      };

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/skills`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(skillsData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.skills).toHaveLength(2);
    });

    test('should update resume', async () => {
      const updates = {
        title: 'Updated Resume Title',
      };

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updates.title);
    });

    test('should duplicate resume', async () => {
      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toContain('Copy');
    });

    test('should delete resume', async () => {
      const response = await request(app)
        .delete(`/api/v1/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should not find deleted resume', async () => {
      const response = await request(app)
        .get(`/api/v1/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Template Flow', () => {
    test('should get all templates', async () => {
      const response = await request(app)
        .get('/api/v1/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toBeInstanceOf(Array);
    });

    test('should get featured templates', async () => {
      const response = await request(app)
        .get('/api/v1/templates/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should get template categories', async () => {
      const response = await request(app)
        .get('/api/v1/templates/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Health Checks', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
    });

    test('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/v1/health/readiness')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/v1/health/liveness')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent route', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'short',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    test('should handle concurrent requests', async () => {
      const requests = Array(20).fill(null).map((_, i) =>
        request(app)
          .get('/api/v1/templates')
          .expect(200)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });

    test('should respond within reasonable time', async () => {
      const start = Date.now();

      await request(app)
        .get('/api/v1/health')
        .expect(200);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // 1 second threshold
    });
  });

  describe('Security', () => {
    test('should reject SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'password',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject XSS attempts', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!',
          firstName: '<script>alert("xss")</script>',
          lastName: 'Test',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should have proper CORS headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should have security headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});
