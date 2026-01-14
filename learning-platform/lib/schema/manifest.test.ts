import { describe, it, expect } from 'vitest';
import { ModuleManifestSchema } from './manifest';

describe('ModuleManifestSchema', () => {
  it('should validate a valid manifest', () => {
    const validManifest = {
      id: 'CS01',
      title: 'Test Module',
      version: '1.0.0',
      description: 'A test module',
      roles: ['Student', 'Teacher'],
      navigation: [
        {
          id: 'page-1',
          title: 'Page 1',
          type: 'page',
          content_source: './pages/page1.md',
        },
        {
          id: 'section-1',
          title: 'Section 1',
          type: 'section',
          children: [
            {
              id: 'page-2',
              title: 'Page 2',
              type: 'page',
              content_source: './pages/page2.md',
            },
          ],
        },
        {
            id: 'ai-sim',
            title: 'AI Sim',
            type: 'ai-interaction',
            config: {
                ai_task_id: 'sim-1'
            }
        }
      ],
    };

    const result = ModuleManifestSchema.safeParse(validManifest);
    expect(result.success).toBe(true);
  });

  it('should fail if required fields are missing', () => {
    const invalidManifest = {
      id: 'CS01',
      // Missing title
    };

    const result = ModuleManifestSchema.safeParse(invalidManifest);
    expect(result.success).toBe(false);
  });

  it('should validate visibility rules', () => {
      const manifestWithRules = {
          id: 'CS01',
          title: 'Test',
          version: '1.0.0',
          navigation: [{
              id: 'secret',
              title: 'Secret',
              type: 'page',
              content_source: 'secret.md',
              visibility: {
                  rule: "user.role == 'Admin'"
              }
          }]
      };
      const result = ModuleManifestSchema.safeParse(manifestWithRules);
      expect(result.success).toBe(true);
  });

  it('should fail if nesting is invalid (e.g. page having children)', () => {
      const invalidNesting = {
          id: 'CS01',
          title: 'Test',
          version: '1.0.0',
          navigation: [{
              id: 'bad-page',
              title: 'Bad Page',
              type: 'page',
              content_source: 'page.md',
              children: [] // Pages cannot have children
          }]
      };
       const result = ModuleManifestSchema.safeParse(invalidNesting);
       expect(result.success).toBe(false);
  });
});
