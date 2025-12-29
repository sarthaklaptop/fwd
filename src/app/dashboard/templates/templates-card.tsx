'use client';

import { FileText, Pencil, Trash2 } from 'lucide-react';
import type {
  Template,
  TemplateCardProps,
  EmptyStateProps,
} from './templates-types';

export function TemplateCard({
  template,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-foreground font-medium truncate">
          {template.name}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(template)}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm p-1 rounded hover:bg-primary/10 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(template)}
            className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm p-1 rounded hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-muted-foreground text-sm truncate mb-2">
        {template.subject}
      </p>
      {template.variables && (
        <div className="flex flex-wrap gap-1">
          {JSON.parse(template.variables).map(
            (v: string) => (
              <span
                key={v}
                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
              >
                {`{{${v}}}`}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  onCreateClick,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 border border-border rounded-xl bg-card/50">
      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
      <p className="text-foreground font-medium">
        No templates yet
      </p>
      <p className="text-muted-foreground text-sm mt-1">
        Create your first template to get started
      </p>
    </div>
  );
}
