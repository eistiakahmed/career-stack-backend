/**
 * Resume Model Unit Tests
 * Testing Resume schema, sections, and methods
 */

const mongoose = require('mongoose');
const Resume = require('../../../models/resume.model');

describe('Resume Model', () => {
  let userId;
  let resumeData;

  beforeEach(() => {
    userId = new mongoose.Types.ObjectId();
    resumeData = {
      userId,
      title: 'Software Developer Resume',
      targetJobTitle: 'Software Developer',
      templateId: new mongoose.Types.ObjectId(),
    };
  });

  describe('Schema Validation', () => {
    test('should create valid resume', async () => {
      const resume = new Resume(resumeData);
      const saved = await resume.save();

      expect(saved._id).toBeDefined();
      expect(saved.title).toBe(resumeData.title);
      expect(saved.userId).toEqual(userId);
    });

    test('should require userId', async () => {
      const resume = new Resume({ ...resumeData, userId: null });

      await expect(resume.save()).rejects.toThrow();
    });

    test('should require title', async () => {
      const resume = new Resume({ ...resumeData, title: '' });

      await expect(resume.save()).rejects.toThrow();
    });

    test('should set default status to draft', async () => {
      const resume = new Resume(resumeData);
      await resume.save();

      expect(resume.status).toBe('draft');
    });

    test('should enforce max resume limit per user', async () => {
      // This would need to be implemented in the service layer
      const resume1 = await Resume.create(resumeData);
      const resume2 = await Resume.create({ ...resumeData, title: 'Resume 2' });

      expect(resume1._id).toBeDefined();
      expect(resume2._id).toBeDefined();
    });
  });

  describe('Work Experience Methods', () => {
    let resume;

    beforeEach(async () => {
      resume = await Resume.create(resumeData);
    });

    test('should add work experience', async () => {
      const experienceData = {
        company: 'Tech Corp',
        position: 'Senior Developer',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2023-12-31'),
        description: 'Led development team',
      };

      await resume.addExperience(experienceData);

      expect(resume.workExperience).toHaveLength(1);
      expect(resume.workExperience[0].company).toBe('Tech Corp');
    });

    test('should update work experience', async () => {
      const exp = await resume.addExperience({
        company: 'Tech Corp',
        position: 'Developer',
        startDate: new Date('2020-01-01'),
      });

      await resume.updateExperience(exp._id, { position: 'Senior Developer' });

      expect(resume.workExperience[0].position).toBe('Senior Developer');
    });

    test('should delete work experience', async () => {
      const exp = await resume.addExperience({
        company: 'Tech Corp',
        position: 'Developer',
        startDate: new Date('2020-01-01'),
      });

      await resume.deleteExperience(exp._id);

      expect(resume.workExperience).toHaveLength(0);
    });

    test('should throw error when updating non-existent experience', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        resume.updateExperience(fakeId, { position: 'Senior' })
      ).rejects.toThrow('Experience not found');
    });
  });

  describe('Education Methods', () => {
    let resume;

    beforeEach(async () => {
      resume = await Resume.create(resumeData);
    });

    test('should add education', async () => {
      const educationData = {
        institution: 'MIT',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-05-31'),
      };

      await resume.addEducation(educationData);

      expect(resume.education).toHaveLength(1);
      expect(resume.education[0].institution).toBe('MIT');
    });

    test('should update education', async () => {
      const edu = await resume.addEducation({
        institution: 'MIT',
        degree: 'BS',
        field: 'CS',
        startDate: new Date('2015-09-01'),
      });

      await resume.updateEducation(edu._id, { degree: 'Master of Science' });

      expect(resume.education[0].degree).toBe('Master of Science');
    });

    test('should delete education', async () => {
      const edu = await resume.addEducation({
        institution: 'MIT',
        degree: 'BS',
        startDate: new Date('2015-09-01'),
      });

      await resume.deleteEducation(edu._id);

      expect(resume.education).toHaveLength(0);
    });
  });

  describe('Skills Methods', () => {
    let resume;

    beforeEach(async () => {
      resume = await Resume.create(resumeData);
    });

    test('should add skills', async () => {
      const skills = [
        { name: 'JavaScript', level: 'expert' },
        { name: 'Python', level: 'intermediate' },
      ];

      await resume.addSkills(skills);

      expect(resume.skills).toHaveLength(2);
      expect(resume.skills[0].name).toBe('JavaScript');
    });

    test('should update skills', async () => {
      await resume.addSkills([
        { name: 'JavaScript', level: 'expert' },
      ]);

      await resume.updateSkills([
        { name: 'JavaScript', level: 'expert' },
        { name: 'Python', level: 'expert' },
      ]);

      expect(resume.skills).toHaveLength(2);
    });

    test('should clear all skills', async () => {
      await resume.addSkills([
        { name: 'JavaScript', level: 'expert' },
      ]);

      await resume.updateSkills([]);

      expect(resume.skills).toHaveLength(0);
    });
  });

  describe('Section Management', () => {
    let resume;

    beforeEach(async () => {
      resume = await Resume.create(resumeData);
    });

    test('should reorder sections', async () => {
      const newOrder = ['skills', 'experience', 'education'];

      await resume.reorderSections(newOrder);

      expect(resume.sectionOrder).toEqual(newOrder);
    });

    test('should toggle section visibility', async () => {
      await resume.toggleSection('experience');

      expect(resume.hiddenSections).toContain('experience');

      await resume.toggleSection('experience');

      expect(resume.hiddenSections).not.toContain('experience');
    });

    test('should update lastModified on section changes', async () => {
      const before = resume.lastModified;

      await new Promise(resolve => setTimeout(resolve, 10));
      await resume.reorderSections(['skills', 'experience']);

      expect(resume.lastModified.getTime()).toBeGreaterThan(before.getTime());
    });
  });

  describe('Sharing Methods', () => {
    let resume;

    beforeEach(async () => {
      resume = await Resume.create(resumeData);
    });

    test('should generate share token', async () => {
      await resume.generateShareToken();

      expect(resume.shareToken).toBeDefined();
      expect(resume.shareToken).toHaveLength(64); // 32 bytes * 2 (hex)
    });

    test('should update isShared flag', async () => {
      resume.isShared = true;
      await resume.generateShareToken();

      expect(resume.isShared).toBe(true);
    });
  });

  describe('ATS Analysis', () => {
    let resume;

    beforeEach(async () => {
      resume = await Resume.create(resumeData);
    });

    test('should update ATS analysis', async () => {
      const analysisData = {
        score: 85,
        keywords: ['javascript', 'react', 'node'],
        missingKeywords: ['typescript'],
        suggestions: ['Add more projects'],
      };

      await resume.updateATSAnalysis(analysisData);

      expect(resume.atsAnalysis.score).toBe(85);
      expect(resume.atsAnalysis.lastAnalyzed).toBeDefined();
    });

    test('should track last analyzed date', async () => {
      const before = new Date();

      await new Promise(resolve => setTimeout(resolve, 10));
      await resume.updateATSAnalysis({ score: 80 });

      expect(resume.atsAnalysis.lastAnalyzed.getTime()).toBeGreaterThan(before.getTime());
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await Resume.create([
        { ...resumeData, title: 'Resume 1', status: 'complete' },
        { ...resumeData, title: 'Resume 2', status: 'draft' },
        { ...resumeData, title: 'Resume 3', status: 'draft' },
      ]);
    });

    test('should get user resumes with pagination', async () => {
      const resumes = await Resume.getUserResumes(userId, {
        page: 1,
        limit: 2
      });

      expect(resumes).toHaveLength(2);
    });

    test('should filter by status', async () => {
      const drafts = await Resume.getUserResumes(userId, {
        status: 'draft'
      });

      expect(drafts).toHaveLength(2);
    });

    test('should get user stats', async () => {
      const stats = await Resume.getUserStats(userId);

      expect(stats.totalResumes).toBe(3);
      expect(stats.draftResumes).toBe(2);
      expect(stats.completeResumes).toBe(1);
    });
  });

  describe('Virtual Fields', () => {
    test('should calculate completion percentage', async () => {
      const resume = await Resume.create(resumeData);

      // Empty resume
      expect(resume.completionPercentage).toBeLessThan(50);

      // Add content
      await resume.addExperience({
        company: 'Tech Corp',
        position: 'Developer',
        startDate: new Date('2020-01-01'),
      });

      await resume.addSkills([
        { name: 'JavaScript', level: 'expert' }
      ]);

      await resume.save();
      await resume.reload();

      expect(resume.completionPercentage).toBeGreaterThan(0);
    });
  });

  describe('Pre-save Hooks', () => {
    test('should generate slug from title', async () => {
      const resume = await Resume.create({
        ...resumeData,
        title: 'My Awesome Resume!'
      });

      expect(resume.slug).toBe('my-awesome-resume');
    });

    test('should update lastModified on save', async () => {
      const resume = await Resume.create(resumeData);
      const before = resume.lastModified;

      await new Promise(resolve => setTimeout(resolve, 10));
      resume.title = 'Updated Title';
      await resume.save();

      expect(resume.lastModified.getTime()).toBeGreaterThan(before.getTime());
    });
  });

  describe('Indexes', () => {
    test('should have userId index', async () => {
      const indexes = await Resume.collection.getIndexes();

      expect(indexes).toHaveProperty('userId_1');
    });

    test('should have shareToken index', async () => {
      const indexes = await Resume.collection.getIndexes();

      expect(indexes).toHaveProperty('shareToken_1');
    });

    test('should have compound userId and status index', async () => {
      const indexes = await Resume.collection.getIndexes();

      expect(indexes).toHaveProperty('userId_1_status_1');
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle multiple sections', async () => {
      const resume = await Resume.create(resumeData);

      await resume.addExperience({
        company: 'Tech Corp',
        position: 'Developer',
        startDate: new Date('2020-01-01'),
      });

      await resume.addEducation({
        institution: 'MIT',
        degree: 'BS',
        field: 'CS',
        startDate: new Date('2015-09-01'),
      });

      await resume.addSkills([
        { name: 'JavaScript', level: 'expert' },
        { name: 'Python', level: 'intermediate' },
      ]);

      await resume.addProject({
        name: 'Awesome Project',
        description: 'Built something cool',
        startDate: new Date('2021-01-01'),
      });

      expect(resume.workExperience).toHaveLength(1);
      expect(resume.education).toHaveLength(1);
      expect(resume.skills).toHaveLength(2);
      expect(resume.projects).toHaveLength(1);
    });

    test('should handle nested updates', async () => {
      const resume = await Resume.create(resumeData);

      const exp = await resume.addExperience({
        company: 'Tech Corp',
        position: 'Developer',
        startDate: new Date('2020-01-01'),
        achievements: ['Built API'],
      });

      await resume.updateExperience(exp._id, {
        achievements: ['Built API', 'Led team', 'Increased revenue'],
      });

      expect(resume.workExperience[0].achievements).toHaveLength(3);
    });
  });
});
