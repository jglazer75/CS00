export type AiTaskStatus = 'draft' | 'active' | 'deprecated';

export type AiTaskToggleOption = {
  id: string;
  label: string;
  description?: string;
  promptInjections?: {
    system?: string[];
    user?: string[];
    assistant?: string[];
  };
  metadata?: Record<string, unknown>;
};

export type AiTaskToggleGroup = {
  id: string;
  label: string;
  type: 'single' | 'multi';
  description?: string;
  defaultValue?: string | string[];
  options: AiTaskToggleOption[];
  ui?: {
    control: 'select' | 'radio' | 'pill';
    order?: number;
  };
  exposeAsInput?: boolean;
};

export type AiTaskInputBase = {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  description?: string;
};

export type AiTaskFileInput = AiTaskInputBase & {
  kind: 'file';
  accept: string[];
  maxSizeMB?: number;
  storage?: 'supabase' | 'inline';
};

export type AiTaskTextInput = AiTaskInputBase & {
  kind: 'text' | 'textarea';
  placeholder?: string;
  maxLength?: number;
};

export type AiTaskEnumOption = {
  value: string;
  label: string;
  description?: string;
};

export type AiTaskEnumInput = AiTaskInputBase & {
  kind: 'select' | 'radio' | 'pill';
  options: AiTaskEnumOption[];
  defaultValue?: string;
  sourceToggleId?: string;
};

export type AiTaskBooleanInput = AiTaskInputBase & {
  kind: 'checkbox';
  defaultValue?: boolean;
};

export type AiTaskInputDefinition =
  | AiTaskFileInput
  | AiTaskTextInput
  | AiTaskEnumInput
  | AiTaskBooleanInput;

export type AiTaskContextSource =
  | {
      id: string;
      type: 'markdown';
      path: string;
      includeHeadings?: string[];
    }
  | {
      id: string;
      type: 'excerpt';
      path: string;
      startHeading?: string;
      endHeading?: string;
    }
  | {
      id: string;
      type: 'static';
      value: string;
    }
  | {
      id: string;
      type: 'dataset';
      table: string;
      filter?: Record<string, unknown>;
      select?: string[];
    };

export type AiPromptTemplateSegment = {
  role: 'system' | 'user' | 'assistant';
  template: string;
  when?: {
    toggleId?: string;
    optionIds?: string[];
  };
};

export type AiTaskPrompt = {
  version?: 'prompt-v1';
  segments: AiPromptTemplateSegment[];
  responseFormat?: {
    type: 'markdown' | 'json' | 'structured';
    schema?: Record<string, unknown>;
  };
};

export type AiTaskDataCaptureField = {
  column: string;
  value: string;
};

export type AiTaskDataCaptureOperation = {
  table: string;
  operation: 'insert' | 'upsert';
  conflictTarget?: string[];
  fields: AiTaskDataCaptureField[];
};

export type AiTaskDataCapture = {
  storeRawResponse?: boolean;
  operations: AiTaskDataCaptureOperation[];
};

export type AiTaskCacheStrategy = {
  enabled?: boolean;
  strategy?: 'prompt-hash';
  ttlSeconds?: number;
};

export type AiTaskMetadata = {
  title: string;
  summary?: string;
  tags?: string[];
  estimatedDurationMinutes?: number;
  author?: string;
  rubricId?: string;
};

export interface AiTaskDefinition {
  version: string;
  id: string;
  moduleId: string;
  status?: AiTaskStatus;
  metadata: AiTaskMetadata;
  placement: {
    pageSlug: string;
    anchorId: string;
    order?: number;
  };
  ui: {
    component: string;
    props?: Record<string, unknown>;
  };
  toggles?: {
    difficulty?: AiTaskToggleGroup;
    persona?: AiTaskToggleGroup;
    additional?: AiTaskToggleGroup[];
  };
  inputs: AiTaskInputDefinition[];
  context?: AiTaskContextSource[];
  prompt: AiTaskPrompt;
  dataCapture?: AiTaskDataCapture;
  cache?: AiTaskCacheStrategy;
  telemetry?: {
    eventName?: string;
    additional?: Record<string, unknown>;
  };
}

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
