import { z } from 'zod';

export const VisibilityRuleSchema = z.object({
  role: z.union([z.string(), z.array(z.string())]).optional(),
  rule: z.string().optional(), // Logic string e.g. "user.role == 'Admin'"
}).strict();

const BaseNodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  visibility: VisibilityRuleSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
}); // Base schema doesn't need strict() yet as we extend it

export const PageNodeSchema = BaseNodeSchema.extend({
  type: z.literal('page'),
  content_source: z.string().min(1),
  layout: z.enum(['reader', 'workbench', 'immersive']).optional().default('reader'),
}).strict();

export const AiInteractionNodeSchema = BaseNodeSchema.extend({
  type: z.literal('ai-interaction'),
  config: z.object({
    ai_task_id: z.string().min(1),
    mode: z.string().optional(),
    role_required: z.boolean().optional(),
    starting_state_file: z.string().optional(),
    completion_criteria: z.record(z.unknown()).optional(),
  }).strict(),
  layout: z.enum(['reader', 'workbench', 'immersive']).optional().default('immersive'),
}).strict();

// Recursive schema for sections
export const SectionNodeSchema: z.ZodType<any> = BaseNodeSchema.extend({
  type: z.literal('section'),
  content_source: z.string().optional(), // Sections might have intro content
  layout: z.enum(['reader', 'workbench', 'immersive']).optional().default('reader'),
  layout_config: z.record(z.unknown()).optional(),
  children: z.lazy(() => z.array(z.union([PageNodeSchema, AiInteractionNodeSchema, SectionNodeSchema]))),
}).strict();

export const ModuleNodeSchema = z.union([PageNodeSchema, SectionNodeSchema, AiInteractionNodeSchema]);

export const ModuleManifestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  roles: z.array(z.string()).optional(),
  navigation: z.array(ModuleNodeSchema),
}).strict();

export type ModuleManifest = z.infer<typeof ModuleManifestSchema>;
export type ModuleNode = z.infer<typeof ModuleNodeSchema>;
export type VisibilityRule = z.infer<typeof VisibilityRuleSchema>;
