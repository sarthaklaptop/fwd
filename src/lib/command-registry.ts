'use client';

import type { ReactNode } from 'react';

export type CommandGroup =
  | 'navigation'
  | 'actions'
  | 'settings';

export interface Command {
  id: string;
  label: string;
  group: CommandGroup;
  icon: ReactNode;
  shortcut?: string;
  keywords?: string[];
  action: () => void;
}

export const COMMAND_GROUPS: Record<
  CommandGroup,
  { label: string; priority: number }
> = {
  navigation: { label: 'Navigation', priority: 1 },
  actions: { label: 'Actions', priority: 2 },
  settings: { label: 'Settings', priority: 3 },
};

function normalize(str: string): string {
  return str.toLowerCase().trim();
}

function matchesQuery(
  command: Command,
  query: string
): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  if (normalize(command.label).includes(normalizedQuery))
    return true;
  if (
    command.keywords?.some((k) =>
      normalize(k).includes(normalizedQuery)
    )
  )
    return true;
  if (normalize(command.group).includes(normalizedQuery))
    return true;

  return false;
}

export function searchCommands(
  query: string,
  commands: Command[]
): Command[] {
  const trimmed = query.trim();
  if (!trimmed) return commands;
  return commands.filter((cmd) =>
    matchesQuery(cmd, trimmed)
  );
}

export function groupCommands(
  commands: Command[]
): Map<CommandGroup, Command[]> {
  const groups = new Map<CommandGroup, Command[]>();

  const sortedGroupKeys = (
    Object.keys(COMMAND_GROUPS) as CommandGroup[]
  ).sort(
    (a, b) =>
      COMMAND_GROUPS[a].priority -
      COMMAND_GROUPS[b].priority
  );

  for (const groupKey of sortedGroupKeys) {
    groups.set(groupKey, []);
  }

  for (const command of commands) {
    groups.get(command.group)?.push(command);
  }

  for (const [key, value] of groups) {
    if (value.length === 0) groups.delete(key);
  }

  return groups;
}
