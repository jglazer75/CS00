import { z } from 'zod';

export const VisibilityRuleSchema = z.object({
  role: z.union([z.string(), z.array(z.string())]).optional(),
  rule: z.string().optional(), // Logic string e.g. "user.role == 'Admin'"
}).strict();

const BaseNodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  visibility: VisibilityRuleSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type BaseNode = z.infer<typeof BaseNodeSchema>;

export const PageNodeSchema = BaseNodeSchema.extend({
  type: z.literal('page'),
  content_source: z.string().min(1),
  layout: z.enum(['reader', 'workbench', 'immersive']).optional().default('reader'),
}).strict();

export type PageNode = z.infer<typeof PageNodeSchema>;

export const AiInteractionNodeSchema = BaseNodeSchema.extend({
  type: z.literal('ai-interaction'),
  config: z.object({
    ai_task_id: z.string().min(1),
    mode: z.string().optional(),
    role_required: z.boolean().optional(),
    starting_state_file: z.string().optional(),
    completion_criteria: z.record(z.string(), z.unknown()).optional(),
  }).strict(),
  layout: z.enum(['reader', 'workbench', 'immersive']).optional().default('immersive'),
}).strict();

export type AiInteractionNode = z.infer<typeof AiInteractionNodeSchema>;

export type SectionNode = BaseNode & {
  type: 'section';
  content_source?: string;
  layout: 'reader' | 'workbench' | 'immersive';
  layout_config?: Record<string, unknown>;
  children: ModuleNode[];
};

export type ModuleNode = PageNode | AiInteractionNode | SectionNode;

// Recursive schema for sections
export const SectionNodeSchema: z.ZodType<SectionNode> = BaseNodeSchema.extend({
  type: z.literal('section'),
  content_source: z.string().optional(), // Sections might have intro content
  layout: z.enum(['reader', 'workbench', 'immersive']).optional().default('reader'),
  layout_config: z.record(z.string(), z.unknown()).optional(),
  children: z.lazy(() => z.array(ModuleNodeSchema)),
}).strict();

export const ModuleNodeSchema: z.ZodType<ModuleNode> = z.union([PageNodeSchema, SectionNodeSchema, AiInteractionNodeSchema]);

export const ModuleManifestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  roles: z.array(z.string()).optional(),
  navigation: z.array(ModuleNodeSchema),
}).strict();

export type ModuleManifest = z.infer<typeof ModuleManifestSchema>;
export type VisibilityRule = z.infer<typeof VisibilityRuleSchema>;
