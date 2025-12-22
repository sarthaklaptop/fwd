export function extractVariables(text: string): string[] {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    const variables = matches.map(match => match.replace(/\{\{|\}\}/g, '').trim());
    return [...new Set(variables)];
}

export function substituteVariables(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        return variables[trimmedKey] ?? match;
    });
}

