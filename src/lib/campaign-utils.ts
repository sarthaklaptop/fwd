import type { Recipient } from '@/app/dashboard/batches/types';

/**
 * Parse recipient text (CSV format) into structured Recipient array
 */
export function parseRecipients(
  recipientText: string,
  templateVariables: string[],
): Recipient[] {
  const lines = recipientText
    .trim()
    .split('\n')
    .filter((line) => line.trim());

  return lines.map((line) => {
    const parts = line.split(',').map((p) => p.trim());
    const to = parts[0];
    const variables: Record<string, string> = {};

    // Map CSV columns to detected template variables
    templateVariables.forEach((varName, index) => {
      if (parts[index + 1]) {
        variables[varName] = parts[index + 1];
      }
    });

    return { to, variables };
  });
}

/**
 * Count recipients with missing variable columns
 */
export function getMissingVariablesCount(
  recipientText: string,
  templateVariables: string[],
): number {
  if (templateVariables.length === 0) return 0;

  const lines = recipientText
    .trim()
    .split('\n')
    .filter((line) => line.trim());

  const expectedColumns = templateVariables.length + 1; // email + variables

  return lines.filter((line) => {
    const parts = line.split(',').map((p) => p.trim());
    return (
      parts.length > 0 &&
      parts[0] &&
      parts.length < expectedColumns
    );
  }).length;
}
