import { Key, Trash2 } from 'lucide-react';
import type {
  ApiKey,
  KeysTableProps,
  StatusBadgeProps,
} from './api-keys-types';

export function KeysTable({
  keys,
  onRevoke,
}: KeysTableProps) {
  if (keys.length === 0) {
    return (
      <div className="text-center py-12 border border-border rounded-xl bg-card/50">
        <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-foreground font-medium">
          No API keys yet
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Create your first key to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border rounded-xl">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Key</th>
            <th className="px-4 py-3">Last Used</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {keys.map((key) => (
            <tr
              key={key.id}
              className="hover:bg-secondary/30 transition-colors"
            >
              <td className="px-4 py-3 text-sm text-foreground font-medium">
                {key.name}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                {key.keyPrefix}...
              </td>
              <td
                className="px-4 py-3 text-sm text-muted-foreground"
                suppressHydrationWarning
              >
                {key.lastUsedAt
                  ? new Date(
                      key.lastUsedAt
                    ).toLocaleString()
                  : 'Never'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge isRevoked={!!key.revokedAt} />
              </td>
              <td className="px-4 py-3">
                {!key.revokedAt && (
                  <button
                    onClick={() => onRevoke(key)}
                    className="inline-flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ isRevoked }: StatusBadgeProps) {
  if (isRevoked) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 dark:text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400"></span>
        Revoked
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"></span>
      Active
    </span>
  );
}
