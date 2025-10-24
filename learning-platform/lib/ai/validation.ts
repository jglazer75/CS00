import type {
  AiTaskContextSource,
  AiTaskDataCapture,
  AiTaskDefinition,
  AiTaskInputDefinition,
  AiTaskPrompt,
  AiTaskToggleGroup,
} from './schema';

type ValidationOptions = {
  source?: string;
  expectedModuleId?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const INPUT_KINDS = new Set(['file', 'text', 'textarea', 'select', 'radio', 'pill', 'checkbox']);
const TOGGLE_TYPES = new Set(['single', 'multi']);
const PROMPT_ROLES = new Set(['system', 'user', 'assistant']);
const RESPONSE_FORMAT_TYPES = new Set(['markdown', 'json', 'structured']);
const CACHE_STRATEGIES = new Set(['prompt-hash']);
const DATA_CAPTURE_OPERATIONS = new Set(['insert', 'upsert']);

export class AiTaskValidationError extends Error {
  readonly errors: string[];

  constructor(message: string, errors: string[]) {
    super(`${message}\n- ${errors.join('\n- ')}`);
    this.name = 'AiTaskValidationError';
    this.errors = errors;
  }
}

export function validateAiTaskDefinition(
  raw: unknown,
  options: ValidationOptions = {}
): AiTaskDefinition {
  const { source, expectedModuleId } = options;
  const errors: string[] = [];
  const prefix = source ? `AI task at ${source}` : 'AI task';

  if (!isPlainObject(raw)) {
    throw new AiTaskValidationError(`${prefix} is not a valid object`, ['Task definition must be a JSON object']);
  }

  const task = raw as Record<string, unknown>;

  if (typeof task.version !== 'string' || task.version.trim() === '') {
    errors.push('`version` must be a non-empty string.');
  }

  if (typeof task.id !== 'string' || task.id.trim() === '') {
    errors.push('`id` must be a non-empty string.');
  }

  if (typeof task.moduleId !== 'string' || task.moduleId.trim() === '') {
    errors.push('`moduleId` must be a non-empty string.');
  }

  if (expectedModuleId && task.moduleId !== expectedModuleId) {
    errors.push(`\`moduleId\` must match the parent module (${expectedModuleId}).`);
  }

  if (task.status !== undefined && !['draft', 'active', 'deprecated'].includes(String(task.status))) {
    errors.push('`status` must be one of "draft", "active", or "deprecated" if provided.');
  }

  validateMetadata(task.metadata, errors);
  validatePlacement(task.placement, errors);
  validateUi(task.ui, errors);
  validateToggles(task.toggles, errors);
  validateInputs(task.inputs, errors);
  validateContext(task.context, errors);
  validatePrompt(task.prompt, errors);
  validateDataCapture(task.dataCapture, errors);
  validateCache(task.cache, errors);
  validateTelemetry(task.telemetry, errors);

  if (errors.length > 0) {
    throw new AiTaskValidationError(`${prefix} is invalid`, errors);
  }

  return raw as AiTaskDefinition;
}

function validateMetadata(metadata: unknown, errors: string[]) {
  if (!isPlainObject(metadata)) {
    errors.push('`metadata` must be an object with at least a `title`.');
    return;
  }

  const { title, summary, tags, estimatedDurationMinutes, author, rubricId } = metadata;
  if (typeof title !== 'string' || title.trim() === '') {
    errors.push('`metadata.title` must be a non-empty string.');
  }
  if (summary !== undefined && typeof summary !== 'string') {
    errors.push('`metadata.summary` must be a string when provided.');
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
      errors.push('`metadata.tags` must be an array of strings when provided.');
    }
  }
  if (estimatedDurationMinutes !== undefined && typeof estimatedDurationMinutes !== 'number') {
    errors.push('`metadata.estimatedDurationMinutes` must be a number when provided.');
  }
  if (author !== undefined && typeof author !== 'string') {
    errors.push('`metadata.author` must be a string when provided.');
  }
  if (rubricId !== undefined && typeof rubricId !== 'string') {
    errors.push('`metadata.rubricId` must be a string when provided.');
  }
}

function validatePlacement(placement: unknown, errors: string[]) {
  if (!isPlainObject(placement)) {
    errors.push('`placement` must be an object containing `pageSlug` and `anchorId`.');
    return;
  }

  const { pageSlug, anchorId, order } = placement;
  if (typeof pageSlug !== 'string' || pageSlug.trim() === '') {
    errors.push('`placement.pageSlug` must be a non-empty string.');
  }
  if (typeof anchorId !== 'string' || anchorId.trim() === '') {
    errors.push('`placement.anchorId` must be a non-empty string.');
  }
  if (order !== undefined && typeof order !== 'number') {
    errors.push('`placement.order` must be a number when provided.');
  }
}

function validateUi(ui: unknown, errors: string[]) {
  if (!isPlainObject(ui)) {
    errors.push('`ui` must be an object containing a `component` string.');
    return;
  }

  const { component, props } = ui;
  if (typeof component !== 'string' || component.trim() === '') {
    errors.push('`ui.component` must be a non-empty string.');
  }
  if (props !== undefined && !isPlainObject(props)) {
    errors.push('`ui.props` must be an object when provided.');
  }
}

function validateToggles(toggles: unknown, errors: string[]) {
  if (toggles === undefined) {
    return;
  }

  if (!isPlainObject(toggles)) {
    errors.push('`toggles` must be an object when provided.');
    return;
  }

  const { difficulty, persona, additional } = toggles as Record<string, unknown>;
  if (difficulty !== undefined) {
    validateToggleGroup(difficulty, 'toggles.difficulty', errors);
  }
  if (persona !== undefined) {
    validateToggleGroup(persona, 'toggles.persona', errors);
  }
  if (additional !== undefined) {
    if (!Array.isArray(additional)) {
      errors.push('`toggles.additional` must be an array of toggle definitions when provided.');
    } else {
      additional.forEach((group, index) => validateToggleGroup(group, `toggles.additional[${index}]`, errors));
    }
  }
}

function validateToggleGroup(toggle: unknown, path: string, errors: string[]) {
  if (!isPlainObject(toggle)) {
    errors.push(`\`${path}\` must be an object.`);
    return;
  }

  const group = toggle as AiTaskToggleGroup;
  if (typeof group.id !== 'string' || group.id.trim() === '') {
    errors.push(`\`${path}.id\` must be a non-empty string.`);
  }
  if (typeof group.label !== 'string' || group.label.trim() === '') {
    errors.push(`\`${path}.label\` must be a non-empty string.`);
  }
  if (!TOGGLE_TYPES.has(group.type)) {
    errors.push(`\`${path}.type\` must be either "single" or "multi".`);
  }
  if (!Array.isArray(group.options) || group.options.length === 0) {
    errors.push(`\`${path}.options\` must be a non-empty array.`);
  } else {
    group.options.forEach((option, index) => {
      if (!isPlainObject(option)) {
        errors.push(`\`${path}.options[${index}]\` must be an object.`);
        return;
      }
      if (typeof option.id !== 'string' || option.id.trim() === '') {
        errors.push(`\`${path}.options[${index}].id\` must be a non-empty string.`);
      }
      if (typeof option.label !== 'string' || option.label.trim() === '') {
        errors.push(`\`${path}.options[${index}].label\` must be a non-empty string.`);
      }
      if (option.description !== undefined && typeof option.description !== 'string') {
        errors.push(`\`${path}.options[${index}].description\` must be a string when provided.`);
      }
      if (option.promptInjections !== undefined) {
        if (!isPlainObject(option.promptInjections)) {
          errors.push(`\`${path}.options[${index}].promptInjections\` must be an object when provided.`);
        } else {
          for (const key of ['system', 'user', 'assistant'] as const) {
            const injection = option.promptInjections[key];
            if (injection !== undefined) {
              if (!Array.isArray(injection) || !injection.every((v) => typeof v === 'string')) {
                errors.push(`\`${path}.options[${index}].promptInjections.${key}\` must be an array of strings.`);
              }
            }
          }
        }
      }
    });
  }

  const { ui } = group as AiTaskToggleGroup;
  if (ui !== undefined) {
    if (!isPlainObject(ui)) {
      errors.push(`\`${path}.ui\` must be an object when provided.`);
    } else {
      const { control, order } = ui;
      if (control !== undefined && !['select', 'radio', 'pill'].includes(String(control))) {
        errors.push(`\`${path}.ui.control\` must be "select", "radio", or "pill" when provided.`);
      }
      if (order !== undefined && typeof order !== 'number') {
        errors.push(`\`${path}.ui.order\` must be a number when provided.`);
      }
    }
  }

  const { defaultValue, exposeAsInput, description } = group as AiTaskToggleGroup;
  if (description !== undefined && typeof description !== 'string') {
    errors.push(`\`${path}.description\` must be a string when provided.`);
  }
  if (defaultValue !== undefined) {
    if (typeof defaultValue === 'string') {
      // ok
    } else if (Array.isArray(defaultValue) && defaultValue.every((value) => typeof value === 'string')) {
      // ok
    } else {
      errors.push(`\`${path}.defaultValue\` must be a string or an array of strings.`);
    }
  }
  if (exposeAsInput !== undefined && typeof exposeAsInput !== 'boolean') {
    errors.push(`\`${path}.exposeAsInput\` must be a boolean when provided.`);
  }
}

function validateInputs(inputs: unknown, errors: string[]) {
  if (!Array.isArray(inputs)) {
    errors.push('`inputs` must be an array (empty array allowed).');
    return;
  }

  inputs.forEach((input, index) => {
    const path = `inputs[${index}]`;
    if (!isPlainObject(input)) {
      errors.push(`\`${path}\` must be an object.`);
      return;
    }

    const base = input as AiTaskInputDefinition;
    if (typeof base.id !== 'string' || base.id.trim() === '') {
      errors.push(`\`${path}.id\` must be a non-empty string.`);
    }
    if (typeof base.name !== 'string' || base.name.trim() === '') {
      errors.push(`\`${path}.name\` must be a non-empty string.`);
    }
    if (typeof base.label !== 'string' || base.label.trim() === '') {
      errors.push(`\`${path}.label\` must be a non-empty string.`);
    }
    if (base.description !== undefined && typeof base.description !== 'string') {
      errors.push(`\`${path}.description\` must be a string when provided.`);
    }
    if (base.required !== undefined && typeof base.required !== 'boolean') {
      errors.push(`\`${path}.required\` must be a boolean when provided.`);
    }

    const { kind } = base as { kind?: string };
    if (typeof kind !== 'string' || !INPUT_KINDS.has(kind)) {
      errors.push(`\`${path}.kind\` must be one of ${Array.from(INPUT_KINDS).join(', ')}.`);
      return;
    }

    switch (kind) {
      case 'file':
        validateFileInput(base, path, errors);
        break;
      case 'text':
      case 'textarea':
        validateTextInput(base, path, errors);
        break;
      case 'select':
      case 'radio':
      case 'pill':
        validateEnumInput(base, path, errors);
        break;
      case 'checkbox':
        validateBooleanInput(base, path, errors);
        break;
      default:
        errors.push(`Unsupported input kind "${kind}" at ${path}.`);
        break;
    }
  });
}

function validateFileInput(input: unknown, path: string, errors: string[]) {
  const fileInput = input as Extract<AiTaskInputDefinition, { kind: 'file' }>;
  if (!Array.isArray(fileInput.accept) || fileInput.accept.length === 0 || !fileInput.accept.every((v) => typeof v === 'string')) {
    errors.push(`\`${path}.accept\` must be a non-empty array of strings.`);
  }
  if (fileInput.maxSizeMB !== undefined && typeof fileInput.maxSizeMB !== 'number') {
    errors.push(`\`${path}.maxSizeMB\` must be a number when provided.`);
  }
  if (fileInput.storage !== undefined && !['supabase', 'inline'].includes(String(fileInput.storage))) {
    errors.push(`\`${path}.storage\` must be "supabase" or "inline" when provided.`);
  }
}

function validateTextInput(input: unknown, path: string, errors: string[]) {
  const textInput = input as Extract<AiTaskInputDefinition, { kind: 'text' | 'textarea' }>;
  if (textInput.placeholder !== undefined && typeof textInput.placeholder !== 'string') {
    errors.push(`\`${path}.placeholder\` must be a string when provided.`);
  }
  if (textInput.maxLength !== undefined && typeof textInput.maxLength !== 'number') {
    errors.push(`\`${path}.maxLength\` must be a number when provided.`);
  }
}

function validateEnumInput(input: unknown, path: string, errors: string[]) {
  const enumInput = input as Extract<AiTaskInputDefinition, { kind: 'select' | 'radio' | 'pill' }>;
  if (!Array.isArray(enumInput.options) || enumInput.options.length === 0) {
    errors.push(`\`${path}.options\` must be a non-empty array.`);
  } else {
    enumInput.options.forEach((option, index) => {
      if (!isPlainObject(option)) {
        errors.push(`\`${path}.options[${index}]\` must be an object.`);
        return;
      }
      if (typeof option.value !== 'string' || option.value.trim() === '') {
        errors.push(`\`${path}.options[${index}].value\` must be a non-empty string.`);
      }
      if (typeof option.label !== 'string' || option.label.trim() === '') {
        errors.push(`\`${path}.options[${index}].label\` must be a non-empty string.`);
      }
      if (option.description !== undefined && typeof option.description !== 'string') {
        errors.push(`\`${path}.options[${index}].description\` must be a string when provided.`);
      }
    });
  }
  if (enumInput.defaultValue !== undefined && typeof enumInput.defaultValue !== 'string') {
    errors.push(`\`${path}.defaultValue\` must be a string when provided.`);
  }
  if (enumInput.sourceToggleId !== undefined && typeof enumInput.sourceToggleId !== 'string') {
    errors.push(`\`${path}.sourceToggleId\` must be a string when provided.`);
  }
}

function validateBooleanInput(input: unknown, path: string, errors: string[]) {
  const boolInput = input as Extract<AiTaskInputDefinition, { kind: 'checkbox' }>;
  if (boolInput.defaultValue !== undefined && typeof boolInput.defaultValue !== 'boolean') {
    errors.push(`\`${path}.defaultValue\` must be a boolean when provided.`);
  }
}

function validateContext(context: unknown, errors: string[]) {
  if (context === undefined) {
    return;
  }

  if (!Array.isArray(context)) {
    errors.push('`context` must be an array when provided.');
    return;
  }

  context.forEach((entry, index) => validateContextEntry(entry, `context[${index}]`, errors));
}

function validateContextEntry(entry: unknown, path: string, errors: string[]) {
  if (!isPlainObject(entry)) {
    errors.push(`\`${path}\` must be an object.`);
    return;
  }

  const contextEntry = entry as AiTaskContextSource;

  if (typeof contextEntry.id !== 'string' || contextEntry.id.trim() === '') {
    errors.push(`\`${path}.id\` must be a non-empty string.`);
  }

  if (typeof contextEntry.type !== 'string') {
    errors.push(`\`${path}.type\` must be a string.`);
    return;
  }

  switch (contextEntry.type) {
    case 'markdown':
      if (typeof contextEntry.path !== 'string' || contextEntry.path.trim() === '') {
        errors.push(`\`${path}.path\` must be a non-empty string for markdown context.`);
      }
      if (
        contextEntry.includeHeadings !== undefined &&
        (!Array.isArray(contextEntry.includeHeadings) ||
          !contextEntry.includeHeadings.every((heading) => typeof heading === 'string'))
      ) {
        errors.push(`\`${path}.includeHeadings\` must be an array of strings when provided.`);
      }
      break;
    case 'excerpt':
      if (typeof contextEntry.path !== 'string' || contextEntry.path.trim() === '') {
        errors.push(`\`${path}.path\` must be a non-empty string for excerpt context.`);
      }
      if (contextEntry.startHeading !== undefined && typeof contextEntry.startHeading !== 'string') {
        errors.push(`\`${path}.startHeading\` must be a string when provided.`);
      }
      if (contextEntry.endHeading !== undefined && typeof contextEntry.endHeading !== 'string') {
        errors.push(`\`${path}.endHeading\` must be a string when provided.`);
      }
      break;
    case 'static':
      if (typeof contextEntry.value !== 'string') {
        errors.push(`\`${path}.value\` must be a string for static context.`);
      }
      break;
    case 'dataset':
      if (typeof contextEntry.table !== 'string' || contextEntry.table.trim() === '') {
        errors.push(`\`${path}.table\` must be a non-empty string for dataset context.`);
      }
      if (contextEntry.select !== undefined) {
        if (!Array.isArray(contextEntry.select) || !contextEntry.select.every((field) => typeof field === 'string')) {
          errors.push(`\`${path}.select\` must be an array of strings when provided.`);
        }
      }
      if (contextEntry.filter !== undefined && !isPlainObject(contextEntry.filter)) {
        errors.push(`\`${path}.filter\` must be an object when provided.`);
      }
      break;
    default:
      errors.push(`\`${path}.type\` must be one of "markdown", "excerpt", "static", or "dataset".`);
      break;
  }
}

function validatePrompt(prompt: unknown, errors: string[]) {
  if (!isPlainObject(prompt)) {
    errors.push('`prompt` must be an object with a `segments` array.');
    return;
  }

  const promptDef = prompt as AiTaskPrompt;
  if (!Array.isArray(promptDef.segments) || promptDef.segments.length === 0) {
    errors.push('`prompt.segments` must be a non-empty array.');
  } else {
    promptDef.segments.forEach((segment, index) => {
      const path = `prompt.segments[${index}]`;
      if (!isPlainObject(segment)) {
        errors.push(`\`${path}\` must be an object.`);
        return;
      }
      if (!PROMPT_ROLES.has(segment.role)) {
        errors.push(`\`${path}.role\` must be one of "system", "user", or "assistant".`);
      }
      if (typeof segment.template !== 'string' || segment.template.trim() === '') {
        errors.push(`\`${path}.template\` must be a non-empty string.`);
      }
      if (segment.when !== undefined) {
        if (!isPlainObject(segment.when)) {
          errors.push(`\`${path}.when\` must be an object when provided.`);
        } else {
          if (segment.when.toggleId !== undefined && typeof segment.when.toggleId !== 'string') {
            errors.push(`\`${path}.when.toggleId\` must be a string when provided.`);
          }
          if (
            segment.when.optionIds !== undefined &&
            (!Array.isArray(segment.when.optionIds) ||
              !segment.when.optionIds.every((id) => typeof id === 'string'))
          ) {
            errors.push(`\`${path}.when.optionIds\` must be an array of strings when provided.`);
          }
        }
      }
    });
  }

  if (promptDef.responseFormat !== undefined) {
    if (!isPlainObject(promptDef.responseFormat)) {
      errors.push('`prompt.responseFormat` must be an object when provided.');
    } else {
      if (!RESPONSE_FORMAT_TYPES.has(promptDef.responseFormat.type)) {
        errors.push('`prompt.responseFormat.type` must be "markdown", "json", or "structured".');
      }
      if (
        promptDef.responseFormat.schema !== undefined &&
        !isPlainObject(promptDef.responseFormat.schema)
      ) {
        errors.push('`prompt.responseFormat.schema` must be an object when provided.');
      }
    }
  }
}

function validateDataCapture(dataCapture: unknown, errors: string[]) {
  if (dataCapture === undefined) {
    return;
  }

  if (!isPlainObject(dataCapture)) {
    errors.push('`dataCapture` must be an object when provided.');
    return;
  }

  const dc = dataCapture as AiTaskDataCapture;
  if (dc.storeRawResponse !== undefined && typeof dc.storeRawResponse !== 'boolean') {
    errors.push('`dataCapture.storeRawResponse` must be a boolean when provided.');
  }

  if (!Array.isArray(dc.operations) || dc.operations.length === 0) {
    errors.push('`dataCapture.operations` must be a non-empty array.');
  } else {
    dc.operations.forEach((operation, index) => {
      const path = `dataCapture.operations[${index}]`;
      if (!isPlainObject(operation)) {
        errors.push(`\`${path}\` must be an object.`);
        return;
      }
      if (typeof operation.table !== 'string' || operation.table.trim() === '') {
        errors.push(`\`${path}.table\` must be a non-empty string.`);
      }
      if (!DATA_CAPTURE_OPERATIONS.has(String(operation.operation))) {
        errors.push(`\`${path}.operation\` must be "insert" or "upsert".`);
      }
      if (operation.conflictTarget !== undefined) {
        if (
          !Array.isArray(operation.conflictTarget) ||
          !operation.conflictTarget.every((column) => typeof column === 'string')
        ) {
          errors.push(`\`${path}.conflictTarget\` must be an array of strings when provided.`);
        }
      }
      if (!Array.isArray(operation.fields) || operation.fields.length === 0) {
        errors.push(`\`${path}.fields\` must be a non-empty array.`);
      } else {
        operation.fields.forEach((field, fieldIndex) => {
          const fieldPath = `${path}.fields[${fieldIndex}]`;
          if (!isPlainObject(field)) {
            errors.push(`\`${fieldPath}\` must be an object.`);
            return;
          }
          if (typeof field.column !== 'string' || field.column.trim() === '') {
            errors.push(`\`${fieldPath}.column\` must be a non-empty string.`);
          }
          if (typeof field.value !== 'string' || field.value.trim() === '') {
            errors.push(`\`${fieldPath}.value\` must be a non-empty string.`);
          }
        });
      }
    });
  }
}

function validateCache(cache: unknown, errors: string[]) {
  if (cache === undefined) {
    return;
  }
  if (!isPlainObject(cache)) {
    errors.push('`cache` must be an object when provided.');
    return;
  }
  const { enabled, strategy, ttlSeconds } = cache as Record<string, unknown>;
  if (enabled !== undefined && typeof enabled !== 'boolean') {
    errors.push('`cache.enabled` must be a boolean when provided.');
  }
  if (strategy !== undefined && !CACHE_STRATEGIES.has(String(strategy))) {
    errors.push('`cache.strategy` must be "prompt-hash" when provided.');
  }
  if (ttlSeconds !== undefined) {
    if (typeof ttlSeconds !== 'number' || Number.isNaN(ttlSeconds) || ttlSeconds <= 0) {
      errors.push('`cache.ttlSeconds` must be a positive number when provided.');
    }
  }
}

function validateTelemetry(telemetry: unknown, errors: string[]) {
  if (telemetry === undefined) {
    return;
  }
  if (!isPlainObject(telemetry)) {
    errors.push('`telemetry` must be an object when provided.');
    return;
  }
  const { eventName, additional } = telemetry as Record<string, unknown>;
  if (eventName !== undefined && typeof eventName !== 'string') {
    errors.push('`telemetry.eventName` must be a string when provided.');
  }
  if (additional !== undefined && !isPlainObject(additional)) {
    errors.push('`telemetry.additional` must be an object when provided.');
  }
}
