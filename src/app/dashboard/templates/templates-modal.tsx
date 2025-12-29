'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Pencil,
  Code,
  Variable,
} from 'lucide-react';
import type { TemplateModalProps } from './templates-types';

export function TemplateModal({
  isOpen,
  editingTemplate,
  loading,
  onClose,
  onSave,
}: TemplateModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setSubject(editingTemplate.subject);
      setHtml(editingTemplate.html);
    } else {
      setName('');
      setSubject('');
      setHtml('');
    }
  }, [editingTemplate, isOpen]);

  if (!isOpen) return null;

  const extractedVars = (text: string) => {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map((m) =>
      m.replace(/\{\{|\}\}/g, '').trim()
    );
  };

  const previewVars = [
    ...new Set([
      ...extractedVars(subject),
      ...extractedVars(html),
    ]),
  ];

  const handleSave = () => {
    onSave(name, subject, html);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border p-6 rounded-xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            {editingTemplate ? (
              <Pencil className="w-5 h-5 text-primary" />
            ) : (
              <FileText className="w-5 h-5 text-primary" />
            )}
          </div>
          <h3 className="text-xl font-bold text-foreground">
            {editingTemplate
              ? 'Edit Template'
              : 'Create Template'}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Email"
              className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Welcome to {{company}}, {{name}}!"
              className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
              <Code className="w-4 h-4" />
              HTML Content
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="<h1>Hello {{name}}</h1><p>Welcome to {{company}}!</p>"
              rows={6}
              className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
            />
          </div>

          {previewVars.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Variable className="w-4 h-4" />
                Detected Variables
              </label>
              <div className="flex flex-wrap gap-2">
                {previewVars.map((v) => (
                  <span
                    key={v}
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={
              loading ||
              !name.trim() ||
              !subject.trim() ||
              !html.trim()
            }
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : editingTemplate ? (
              'Update Template'
            ) : (
              'Create Template'
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-transparent hover:bg-primary/10 text-foreground font-medium rounded-lg border border-border hover:border-primary/30 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
