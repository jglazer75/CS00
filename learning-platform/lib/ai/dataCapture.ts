import type { AiTaskDataCapture, AiTaskDataCaptureOperation, AiTaskDefinition } from './schema';
import { renderTemplateString } from './taskLoader';
import { getSupabaseServerClient } from '@/lib/supabase/server';

type ExecuteDataCaptureParams = {
  task: AiTaskDefinition;
  dataCapture?: AiTaskDataCapture;
  templateContext: Record<string, unknown>;
};

export async function executeDataCapture(params: ExecuteDataCaptureParams) {
  const { dataCapture, templateContext } = params;
  if (!dataCapture || !dataCapture.operations?.length) {
    return;
  }

  const supabase = getSupabaseServerClient();

  for (const operation of dataCapture.operations) {
    const row = buildRowFromOperation(operation, templateContext);

    if (operation.operation === 'insert') {
      const { error } = await supabase.from(operation.table).insert(row);
      if (error) {
        throw new Error(`Data capture insert failed on table "${operation.table}": ${error.message}`);
      }
    } else if (operation.operation === 'upsert') {
      const { error } = await supabase.from(operation.table).upsert(row, {
        onConflict: operation.conflictTarget?.join(','),
      });
      if (error) {
        throw new Error(`Data capture upsert failed on table "${operation.table}": ${error.message}`);
      }
    } else {
      throw new Error(`Unsupported data capture operation "${operation.operation}" for table "${operation.table}".`);
    }
  }
}

function buildRowFromOperation(operation: AiTaskDataCaptureOperation, context: Record<string, unknown>) {
  const row: Record<string, unknown> = {};

  for (const field of operation.fields) {
    const rendered = renderTemplateString(field.value, context);
    row[field.column] = deserializeFieldValue(rendered);
  }

  return row;
}

function deserializeFieldValue(value: string) {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  if (!Number.isNaN(Number(trimmed)) && trimmed === String(Number(trimmed))) {
    return Number(trimmed);
  }

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall back to string
    }
  }

  return value;
}
