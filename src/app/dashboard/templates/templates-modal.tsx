'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Pencil,
  Code,
  Variable,
  Eye,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModalKeyboard } from '@/hooks/use-modal-keyboard';
import type { TemplateModalProps } from './templates-types';
import {
  LinkTrackingSection,
  extractLinksFromHtml,
  getExcludedLinksFromHtml,
  updateHtmlWithExclusions,
} from './link-tracking-section';

export function TemplateModal({
  isOpen,
  editingTemplate,
  duplicateSource,
  loading,
  onClose,
  onSave,
}: TemplateModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [activeTab, setActiveTab] = useState<
    'editor' | 'preview'
  >('editor');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [excludedLinks, setExcludedLinks] = useState<
    Set<string>
  >(new Set());

  // Parse links from HTML
  const detectedLinks = useMemo(
    () => extractLinksFromHtml(html),
    [html]
  );

  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setSubject(editingTemplate.subject);
      setHtml(editingTemplate.html);
      setExcludedLinks(
        getExcludedLinksFromHtml(editingTemplate.html)
      );
    } else if (duplicateSource) {
      setName(`Copy of ${duplicateSource.name}`);
      setSubject(duplicateSource.subject);
      setHtml(duplicateSource.html);
      setExcludedLinks(
        getExcludedLinksFromHtml(duplicateSource.html)
      );
    } else {
      setName('');
      setSubject('');
      setHtml('');
      setExcludedLinks(new Set());
    }
  }, [editingTemplate, duplicateSource, isOpen]);

  const canSubmit =
    !loading &&
    name.trim() &&
    subject.trim() &&
    html.trim();

  useModalKeyboard({
    onClose,
    onSubmit: () => canSubmit && handleSave(),
    isOpen,
    submitDisabled: !canSubmit,
  });

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
    // Apply link exclusions to HTML before saving
    const finalHtml = updateHtmlWithExclusions(
      html,
      detectedLinks,
      excludedLinks
    );
    onSave(name, subject, finalHtml);
  };

  const toggleLink = (url: string) => {
    setExcludedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const getPreviewHtml = () => {
    let preview = html;
    previewVars.forEach((v) => {
      preview = preview.replace(
        new RegExp(`\\{\\{${v}\\}\\}`, 'g'),
        `<span style="background:#e07a5f;color:white;padding:2px 6px;border-radius:4px;font-size:12px;">{{${v}}}</span>`
      );
    });
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 16px;
              margin: 0;
              color: #1f2937;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>${preview}</body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div
        className={`bg-card border border-border p-6 rounded-xl w-full shadow-2xl overflow-y-auto transition-all duration-300 ${
          isFullScreen
            ? 'max-w-none mx-0 h-full max-h-full rounded-none'
            : 'max-w-5xl mx-4 max-h-[90vh]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
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
                : duplicateSource
                ? 'Duplicate Template'
                : 'Create Template'}
            </h3>
          </div>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title={
              isFullScreen
                ? 'Exit fullscreen'
                : 'Fullscreen'
            }
          >
            {isFullScreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Mobile Tab Toggle */}
          <div className="flex md:hidden border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'editor'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code className="w-4 h-4" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>

          {/* Editor & Preview Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Editor Panel */}
            <div
              className={`${
                activeTab === 'preview'
                  ? 'hidden md:block'
                  : ''
              }`}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <Code className="w-4 h-4" />
                HTML Content
              </label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="<h1>Hello {{name}}</h1><p>Welcome to {{company}}!</p>"
                rows={isFullScreen ? 24 : 12}
                className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm resize-none"
              />
            </div>

            {/* Preview Panel */}
            <div
              className={`${
                activeTab === 'editor'
                  ? 'hidden md:block'
                  : ''
              }`}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <Eye className="w-4 h-4" />
                Live Preview
              </label>
              <div
                className={`border border-border rounded-lg overflow-hidden bg-white ${
                  isFullScreen ? 'h-[600px]' : 'h-[300px]'
                }`}
              >
                {html.trim() ? (
                  <iframe
                    srcDoc={getPreviewHtml()}
                    sandbox="allow-same-origin"
                    title="Email Preview"
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Start typing HTML to see preview
                  </div>
                )}
              </div>
            </div>
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

          {/* Link Tracking */}
          <LinkTrackingSection
            links={detectedLinks}
            excludedLinks={excludedLinks}
            onToggle={toggleLink}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSave}
            isLoading={loading}
            disabled={
              !name.trim() ||
              !subject.trim() ||
              !html.trim()
            }
            className="flex-1 rounded-lg"
          >
            {loading
              ? 'Saving...'
              : editingTemplate
              ? 'Update Template'
              : duplicateSource
              ? 'Duplicate Template'
              : 'Create Template'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-lg hover:bg-primary/10 hover:border-primary/30"
          >
            Cancel
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono shadow-sm">
            Esc
          </kbd>{' '}
          to close{' · '}
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono shadow-sm">
            ⌘
          </kbd>
          <span className="mx-0.5">+</span>
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono shadow-sm">
            Enter
          </kbd>{' '}
          to save
        </p>
      </div>
    </div>
  );
}
