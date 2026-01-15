import { z } from 'zod';

// --- Enums & Constants ---

export const AiTaskStatusSchema = z.enum(['draft', 'active', 'deprecated']);
export const InputKindSchema = z.enum(['file', 'text', 'textarea', 'select', 'radio', 'pill', 'checkbox']);
export const ToggleTypeSchema = z.enum(['single', 'multi']);
export const PromptRoleSchema = z.enum(['system', 'user', 'assistant']);
export const ResponseFormatTypeSchema = z.enum(['markdown', 'json', 'structured']);
export const CacheStrategySchema = z.enum(['prompt-hash']);
export const DataCaptureOperationTypeSchema = z.enum(['insert', 'upsert']);

// --- Toggles ---

export const AiTaskToggleOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  promptInjections: z.object({
    system: z.array(z.string()).optional(),
    user: z.array(z.string()).optional(),
    assistant: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AiTaskToggleGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: ToggleTypeSchema,
  description: z.string().optional(),
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
  options: z.array(AiTaskToggleOptionSchema).min(1),
  ui: z.object({
    control: z.enum(['select', 'radio', 'pill']),
    order: z.number().optional(),
  }).optional(),
  exposeAsInput: z.boolean().optional(),
});

// --- Inputs ---

const InputBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().optional(),
  description: z.string().optional(),
});

export const AiTaskFileInputSchema = InputBaseSchema.extend({
  kind: z.literal('file'),
  accept: z.array(z.string()).min(1),
  maxSizeMB: z.number().positive().optional(),
  storage: z.enum(['supabase', 'inline']).optional(),
});

export const AiTaskTextInputSchema = InputBaseSchema.extend({
  kind: z.enum(['text', 'textarea']),
  placeholder: z.string().optional(),
  maxLength: z.number().positive().optional(),
});

export const AiTaskEnumOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});

export const AiTaskEnumInputSchema = InputBaseSchema.extend({
  kind: z.enum(['select', 'radio', 'pill']),
  options: z.array(AiTaskEnumOptionSchema).min(1),
  defaultValue: z.string().optional(),
  sourceToggleId: z.string().optional(),
});

export const AiTaskBooleanInputSchema = InputBaseSchema.extend({
  kind: z.literal('checkbox'),
  defaultValue: z.boolean().optional(),
});

export const AiTaskInputDefinitionSchema = z.discriminatedUnion('kind', [
  AiTaskFileInputSchema,
  AiTaskTextInputSchema,
  // For text/textarea, since they share the schema structure but have different literal kinds in the enum, 
  // we might need to separate them if we want strict discriminatedUnion. 
  // However, TextInputSchema uses an enum for kind. 
  // Zod discriminatedUnion requires a single literal or enum-like discriminator.
  // Let's split text/textarea for strictness if needed, or use a union.
  // Actually, discriminatedUnion works best with literals.
  // Let's redefine TextInput to be separate or just use a standard union.
  // Standard union is easier for now given the previous structure.
  AiTaskEnumInputSchema,
  AiTaskBooleanInputSchema
]);

// Redefining InputDefinition to handle the 'text' | 'textarea' overlap nicely in a union
export const AiTaskInputSchema = z.union([
  AiTaskFileInputSchema,
  InputBaseSchema.extend({ kind: z.literal('text'), placeholder: z.string().optional(), maxLength: z.number().optional() }),
  InputBaseSchema.extend({ kind: z.literal('textarea'), placeholder: z.string().optional(), maxLength: z.number().optional() }),
  AiTaskEnumInputSchema,
  AiTaskBooleanInputSchema
]);


// --- Context ---

export const AiTaskContextSourceSchema = z.union([
  z.object({
    id: z.string().min(1),
    type: z.literal('markdown'),
    path: z.string().min(1),
    includeHeadings: z.array(z.string()).optional(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('excerpt'),
    path: z.string().min(1),
    startHeading: z.string().optional(),
    endHeading: z.string().optional(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('static'),
    value: z.string(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('dataset'),
    table: z.string().min(1),
    filter: z.record(z.string(), z.unknown()).optional(),
    select: z.array(z.string()).optional(),
  }),
]);

// --- Prompt ---

export const AiPromptTemplateSegmentSchema = z.object({
  role: PromptRoleSchema,
  template: z.string().min(1),
  when: z.object({
    toggleId: z.string().optional(),
    optionIds: z.array(z.string()).optional(),
  }).optional(),
});

export const AiTaskPromptSchema = z.object({
  version: z.literal('prompt-v1').optional(),
  segments: z.array(AiPromptTemplateSegmentSchema).min(1),
  responseFormat: z.object({
    type: ResponseFormatTypeSchema,
    schema: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
});

// --- Data Capture ---

export const AiTaskDataCaptureFieldSchema = z.object({
  column: z.string().min(1),
  value: z.string().min(1),
});

export const AiTaskDataCaptureOperationSchema = z.object({
  table: z.string().min(1),
  operation: DataCaptureOperationTypeSchema,
  conflictTarget: z.array(z.string()).optional(),
  fields: z.array(AiTaskDataCaptureFieldSchema).min(1),
});

export const AiTaskDataCaptureSchema = z.object({
  storeRawResponse: z.boolean().optional(),
  operations: z.array(AiTaskDataCaptureOperationSchema).min(1),
});

// --- Cache ---

export const AiTaskCacheStrategySchema = z.object({
  enabled: z.boolean().optional(),
  strategy: CacheStrategySchema.optional(),
  ttlSeconds: z.number().positive().optional(),
});

// --- Metadata ---

export const AiTaskMetadataSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedDurationMinutes: z.number().positive().optional(),
  author: z.string().optional(),
  rubricId: z.string().optional(),
});

// --- Main Definition ---

export const AiTaskDefinitionSchema = z.object({
  version: z.string().min(1),
  id: z.string().min(1),
  moduleId: z.string().min(1),
  status: AiTaskStatusSchema.optional(),
  metadata: AiTaskMetadataSchema,
  placement: z.object({
    pageSlug: z.string().min(1),
    anchorId: z.string().min(1),
    order: z.number().optional(),
  }),
  ui: z.object({
    component: z.string().min(1),
    props: z.record(z.string(), z.unknown()).optional(),
  }),
  toggles: z.object({
    difficulty: AiTaskToggleGroupSchema.optional(),
    persona: AiTaskToggleGroupSchema.optional(),
    additional: z.array(AiTaskToggleGroupSchema).optional(),
  }).optional(),
  inputs: z.array(AiTaskInputSchema),
  context: z.array(AiTaskContextSourceSchema).optional(),
  prompt: AiTaskPromptSchema,
  dataCapture: AiTaskDataCaptureSchema.optional(),
  cache: AiTaskCacheStrategySchema.optional(),
  telemetry: z.object({
    eventName: z.string().optional(),
    additional: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
});

// --- Types ---

export type AiTaskStatus = z.infer<typeof AiTaskStatusSchema>;
export type AiTaskToggleOption = z.infer<typeof AiTaskToggleOptionSchema>;
export type AiTaskToggleGroup = z.infer<typeof AiTaskToggleGroupSchema>;
export type AiTaskInputDefinition = z.infer<typeof AiTaskInputSchema>;
export type AiTaskContextSource = z.infer<typeof AiTaskContextSourceSchema>;
export type AiPromptTemplateSegment = z.infer<typeof AiPromptTemplateSegmentSchema>;
export type AiTaskPrompt = z.infer<typeof AiTaskPromptSchema>;
export type AiTaskDataCapture = z.infer<typeof AiTaskDataCaptureSchema>;
export type AiTaskDataCaptureOperation = z.infer<typeof AiTaskDataCaptureOperationSchema>;
export type AiTaskCacheStrategy = z.infer<typeof AiTaskCacheStrategySchema>;
export type AiTaskMetadata = z.infer<typeof AiTaskMetadataSchema>;
export type AiTaskDefinition = z.infer<typeof AiTaskDefinitionSchema>;

export type AiTaskResponseEnvelope = {
  taskId: string;
  moduleId: string;
  requestId: string;
  provider: string;
  model: string;
  runId?: string;
  content: string | Record<string, unknown>;
  capturedData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};