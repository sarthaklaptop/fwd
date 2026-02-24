/**
 * Extract template variables like {{name}}, {{company}} from text
 */
export function extractTemplateVariables(
  text: string,
): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  const variables = matches.map((match) =>
    match.replace(/\{\{|\}\}/g, '').trim(),
  );
  return [...new Set(variables)];
}

// Backward compatible alias
export const extractVariables = extractTemplateVariables;

export function substituteVariables(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return variables[trimmedKey] ?? match;
  });
}

/**
 * Generate a smart sample value based on the variable name.
 * Used for live previews and test emails.
 */
export function getSampleValue(
  varName: string,
  userEmail?: string,
): string {
  const lower = varName.toLowerCase();
  if (lower.includes('name') && lower.includes('first'))
    return 'John';
  if (lower.includes('name') && lower.includes('last'))
    return 'Doe';
  if (lower.includes('name')) return 'John Doe';
  if (lower.includes('email'))
    return userEmail || 'user@example.com';
  if (lower.includes('company') || lower.includes('org'))
    return 'Acme Inc';
  if (lower.includes('phone')) return '+1 555-123-4567';
  if (lower.includes('date'))
    return new Date().toLocaleDateString();
  if (lower.includes('url') || lower.includes('link'))
    return 'https://example.com';
  if (lower.includes('amount') || lower.includes('price'))
    return '$99.00';
  if (lower.includes('code') || lower.includes('token'))
    return 'ABC123';
  return `Sample ${varName}`;
}

/**
 * Generate a map of sample values for all detected variables.
 */
export function generateSampleValues(
  vars: string[],
  userEmail?: string,
): Record<string, string> {
  const values: Record<string, string> = {};
  vars.forEach((v) => {
    values[v] = getSampleValue(v, userEmail);
  });
  return values;
}
