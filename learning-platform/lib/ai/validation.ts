import { AiTaskDefinitionSchema, type AiTaskDefinition } from './schema';

type ValidationOptions = {
  source?: string;
  expectedModuleId?: string;
};

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
  const prefix = source ? `AI task at ${source}` : 'AI task';

  const result = AiTaskDefinitionSchema.safeParse(raw);

  if (!result.success) {
    const formattedErrors = result.error.issues.map(err => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    });
    throw new AiTaskValidationError(`${prefix} is invalid`, formattedErrors);
  }

  const task = result.data;

  // Custom logical validation not covered by Zod
  const errors: string[] = [];

  if (expectedModuleId && task.moduleId !== expectedModuleId) {
    errors.push(`\`moduleId\` must match the parent module (${expectedModuleId}).`);
  }

  if (errors.length > 0) {
    throw new AiTaskValidationError(`${prefix} is invalid`, errors);
  }

  return task;
}