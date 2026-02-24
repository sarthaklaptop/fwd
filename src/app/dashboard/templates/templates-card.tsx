'use client';

import {
  FileText,
  Pencil,
  Trash2,
  Copy,
  Zap,
} from 'lucide-react';
import type {
  TemplateCardProps,
  EmptyStateProps,
} from './templates-types';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onSendTest,
}: TemplateCardProps) {
  return (
    <TooltipProvider>
      <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="text-foreground font-medium truncate cursor-default">
                {template.name}
              </h3>
            </TooltipTrigger>
            <TooltipContent>{template.name}</TooltipContent>
          </Tooltip>
          <div className="flex gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSendTest(template)}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Send Test</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDuplicate(template)}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Duplicate</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onEdit(template)}
                  className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDelete(template)}
                  className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
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
              ),
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
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
