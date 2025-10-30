import fs from 'fs';
import path from 'path';
import type {
  AiTaskDefinition,
  AiTaskPrompt,
  AiTaskToggleGroup,
  AiTaskToggleOption,
} from './schema';
import { validateAiTaskDefinition } from './validation';
import type { RenderedPrompt } from './types';

const contentRoot = path.join(process.cwd(), 'content');

export class TaskNotFoundError extends Error {
  constructor(moduleId: string, taskId: string) {
    super(`AI task "${taskId}" not found in module "${moduleId}"`);
    this.name = 'TaskNotFoundError';
  }
}

type PromptRenderParams = {
  task: AiTaskDefinition;
  moduleId: string;
  inputs: Record<string, unknown>;
  toggles: Record<string, string | string[] | undefined>;
  context: Record<string, string>;
  auth: {
    userId: string;
    email?: string | null;
    teamId?: string | null;
  };
};

export function loadTaskDefinition(moduleId: string, taskId: string): AiTaskDefinition {
  const tasksDirectory = path.join(contentRoot, moduleId, 'ai-tasks');

  if (!fs.existsSync(tasksDirectory)) {
    throw new TaskNotFoundError(moduleId, taskId);
  }

  const entries = fs.readdirSync(tasksDirectory, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.json')) {
      continue;
    }

    const filePath = path.join(tasksDirectory, entry.name);
    let raw: unknown;

    try {
      raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to parse AI task JSON at ${filePath}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }

    const task = validateAiTaskDefinition(raw, { source: filePath, expectedModuleId: moduleId });

    if (task.id === taskId) {
      return task;
    }
  }

  throw new TaskNotFoundError(moduleId, taskId);
}

export function renderTaskPrompt(params: PromptRenderParams): RenderedPrompt {
  const { task, toggles, inputs, context, moduleId, auth } = params;
  const prompt = task.prompt;

  const templateVariables = buildTemplateContext({
    task,
    moduleId,
    inputs,
    toggles,
    context,
    auth,
  });

  const segments = (prompt?.segments ?? [])
    .filter((segment) => shouldIncludeSegment(segment, toggles))
    .map((segment) => ({
      role: segment.role,
      content: renderTemplateString(segment.template, templateVariables),
    }));

  return { segments };
}

export function extractResponseFormat(prompt: AiTaskPrompt | undefined) {
  return prompt?.responseFormat;
}

type TemplateContextParams = {
  task: AiTaskDefinition;
  moduleId: string;
  inputs: Record<string, unknown>;
  toggles: Record<string, string | string[] | undefined>;
  context: Record<string, string>;
  auth: {
    userId: string;
    email?: string | null;
    teamId?: string | null;
  };
  response?: {
    content: string | Record<string, unknown>;
    raw?: unknown;
    model?: string;
  };
};

export function buildTemplateContext(params: TemplateContextParams): Record<string, unknown> {
  const { task, moduleId, inputs, toggles, context, auth, response } = params;

  const toggleContext = buildToggleTemplateContext(task, toggles);

  return {
    task: {
      id: task.id,
      moduleId,
      metadata: task.metadata,
      placement: task.placement,
    },
    inputs: {
      ...inputs,
      json: JSON.stringify(inputs),
    },
    toggles: toggleContext,
    context,
    auth,
    response: response
      ? {
          ...response,
          json: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
        }
      : undefined,
  };
}

export function loadTaskContextValues(task: AiTaskDefinition): Record<string, string> {
  const contextSpecs = task.context ?? [];
  const values: Record<string, string> = {};

  for (const spec of contextSpecs) {
    try {
      if (spec.type === 'static') {
        values[spec.id] = spec.value;
        continue;
      }

      if (spec.type === 'markdown') {
        const markdown = readContentFile(spec.path);
        values[spec.id] = spec.includeHeadings?.length
          ? extractHeadings(markdown, spec.includeHeadings)
          : markdown.trim();
        continue;
      }

      if (spec.type === 'excerpt') {
        const markdown = readContentFile(spec.path);
        values[spec.id] = extractExcerpt(markdown, spec.startHeading, spec.endHeading);
        continue;
      }

      if (spec.type === 'dataset') {
        console.warn(`Dataset context "${spec.id}" is not yet supported. Returning placeholder.`);
        values[spec.id] = '';
        continue;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(`Failed to load context "${spec.id}" for task "${task.id}": ${message}`);
    }
  }

  return values;
}

function shouldIncludeSegment(
  segment: AiTaskDefinition['prompt']['segments'][number],
  toggleSelections: Record<string, string | string[] | undefined>
) {
  if (!segment.when) {
    return true;
  }

  const selection = toggleSelections[segment.when.toggleId ?? ''];
  if (!selection) {
    return false;
  }

  if (!segment.when.optionIds || segment.when.optionIds.length === 0) {
    return true;
  }

  if (Array.isArray(selection)) {
    return segment.when.optionIds.some((option) => selection.includes(option));
  }

  return segment.when.optionIds.includes(selection);
}

function readContentFile(relativePath: string): string {
  const resolved = resolveContentPath(relativePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Context file not found at ${relativePath}`);
  }

  return fs.readFileSync(resolved, 'utf8');
}

function resolveContentPath(relativePath: string): string {
  const normalized = path.normalize(relativePath);
  const absolute = path.resolve(contentRoot, normalized);
  const relative = path.relative(contentRoot, absolute);

  if (relative.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Context path "${relativePath}" is outside the content directory.`);
  }

  return absolute;
}

function extractHeadings(markdown: string, headings: string[]): string {
  const targets = new Set(headings.map(normalizeHeading));
  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];
  let include = false;

  for (const line of lines) {
    const headingText = parseHeadingText(line);
    if (headingText) {
      include = targets.has(normalizeHeading(headingText));
    }

    if (include) {
      output.push(line);
    }
  }

  return output.join('\n').trim();
}

function extractExcerpt(markdown: string, startHeading?: string, endHeading?: string): string {
  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];
  const start = startHeading ? normalizeHeading(startHeading) : undefined;
  const end = endHeading ? normalizeHeading(endHeading) : undefined;

  let collecting = start ? false : true;

  for (const line of lines) {
    const headingText = parseHeadingText(line);
    if (headingText) {
      const normalized = normalizeHeading(headingText);

      if (!collecting && start && normalized === start) {
        collecting = true;
      } else if (collecting && end && normalized === end) {
        break;
      }
    }

    if (collecting) {
      output.push(line);
    }
  }

  return output.join('\n').trim();
}

function parseHeadingText(line: string): string | null {
  const match = line.match(/^#{1,6}\s+(.+?)\s*$/);
  return match ? match[1] : null;
}

function normalizeHeading(value: string): string {
  return value.trim().toLowerCase();
}

export function renderTemplateString(template: string, context: Record<string, unknown>): string {
  return template.replace(/{{\s*([^}]+?)\s*}}/g, (_, expression) => {
    const value = resolveTemplateValue(context, expression.trim());
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

function resolveTemplateValue(context: Record<string, unknown>, pathExpression: string): unknown {
  const segments = pathExpression.split('.').filter(Boolean);
  let current: unknown = context;

  for (const segment of segments) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function buildToggleTemplateContext(
  task: AiTaskDefinition,
  selections: Record<string, string | string[] | undefined>
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  const toggleGroups = collectToggleGroups(task);

  for (const group of toggleGroups) {
    const rawSelection = selections[group.id];
    if (!rawSelection) {
      continue;
    }

    if (group.type === 'single') {
      if (typeof rawSelection !== 'string') {
        continue;
      }
      const option = findToggleOption(group, rawSelection);
      if (!option) {
        continue;
      }
      context[group.id] = {
        id: option.id,
        label: option.label,
        option,
        group: {
          id: group.id,
          label: group.label,
          type: group.type,
        },
      };
    } else if (Array.isArray(rawSelection)) {
      const selectedOptions = rawSelection
        .map((id) => findToggleOption(group, id))
        .filter((option): option is AiTaskToggleOption => option !== undefined);

      context[group.id] = selectedOptions.map((option) => ({
        id: option.id,
        label: option.label,
        option,
      }));
    }
  }

  return context;
}

function collectToggleGroups(task: AiTaskDefinition): AiTaskToggleGroup[] {
  const groups: AiTaskToggleGroup[] = [];
  if (task.toggles?.difficulty) {
    groups.push(task.toggles.difficulty);
  }
  if (task.toggles?.persona) {
    groups.push(task.toggles.persona);
  }
  if (task.toggles?.additional?.length) {
    groups.push(...task.toggles.additional);
  }
  return groups;
}

function findToggleOption(group: AiTaskToggleGroup, optionId: string): AiTaskToggleOption | undefined {
  return group.options.find((option) => option.id === optionId);
}
