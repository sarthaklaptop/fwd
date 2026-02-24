'use client';

import { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Pencil,
  Code,
  Variable,
  Eye,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  Mail,
  Tags,
  Type,
  ChevronDown,
  ChevronUp,
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
import {
  extractTemplateVariables,
  substituteVariables,
  generateSampleValues,
} from '@/lib/templates';

type ViewportMode = 'desktop' | 'mobile';
type PreviewMode = 'sample' | 'tags';

/**
 * Wrapper component that uses a key to force the inner modal
 * to remount with fresh state whenever the modal opens with new data.
 * This avoids setState-in-effects which the React Compiler disallows.
 */
export function TemplateModal(props: TemplateModalProps) {
  if (!props.isOpen) return null;

  // Generate a unique key so the inner component remounts when the
  // editing target changes, giving it fresh initial state each time.
  const key =
    props.editingTemplate?.id ||
    (props.duplicateSource
      ? `dup-${props.duplicateSource.id}`
      : 'new');

  return <TemplateModalInner key={key} {...props} />;
}

function TemplateModalInner({
  isOpen,
  editingTemplate,
  duplicateSource,
  loading,
  onClose,
  onSave,
}: TemplateModalProps) {
  // Derive initial values from props (runs once on mount due to key-based remount)
  const source = editingTemplate || duplicateSource;

  const [name, setName] = useState(() =>
    editingTemplate
      ? editingTemplate.name
      : duplicateSource
        ? `Copy of ${duplicateSource.name}`
        : '',
  );
  const [subject, setSubject] = useState(
    () => source?.subject ?? '',
  );
  const [html, setHtml] = useState(
    () => source?.html ?? '',
  );
  const [activeTab, setActiveTab] = useState<
    'editor' | 'preview'
  >('editor');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [excludedLinks, setExcludedLinks] = useState<
    Set<string>
  >(() =>
    source
      ? getExcludedLinksFromHtml(source.html)
      : new Set(),
  );

  // Enhanced feature states
  const [viewportMode, setViewportMode] =
    useState<ViewportMode>('desktop');
  const [previewMode, setPreviewMode] =
    useState<PreviewMode>('sample');
  const [sampleOverrides, setSampleOverrides] = useState<
    Record<string, string>
  >({});
  const [showVariablePanel, setShowVariablePanel] =
    useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse links from HTML
  const detectedLinks = useMemo(
    () => extractLinksFromHtml(html),
    [html],
  );

  // Extract variables from subject + HTML
  const previewVars = useMemo(() => {
    return [
      ...new Set([
        ...extractTemplateVariables(subject),
        ...extractTemplateVariables(html),
      ]),
    ];
  }, [subject, html]);

  // Derive effective sample values: auto-generated defaults merged with user overrides
  const sampleValues = useMemo(() => {
    const defaults = generateSampleValues(previewVars);
    const merged: Record<string, string> = {};
    previewVars.forEach((v) => {
      merged[v] =
        v in sampleOverrides
          ? sampleOverrides[v]
          : defaults[v];
    });
    return merged;
  }, [previewVars, sampleOverrides]);

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

  const handleSave = () => {
    const finalHtml = updateHtmlWithExclusions(
      html,
      detectedLinks,
      excludedLinks,
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

  // Handle Tab key in textarea for indentation
  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue =
        html.substring(0, start) +
        '  ' +
        html.substring(end);
      setHtml(newValue);

      requestAnimationFrame(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
      });
    }
  };

  // Generate line numbers
  const lineCount = html.split('\n').length;
  const lineNumbers = Array.from(
    { length: Math.max(lineCount, 1) },
    (_, i) => i + 1,
  );

  // Preview HTML generation
  const getPreviewHtml = () => {
    let preview = html;

    if (previewMode === 'sample') {
      preview = substituteVariables(preview, sampleValues);
    } else {
      previewVars.forEach((v) => {
        preview = preview.replace(
          new RegExp(`\\{\\{${v}\\}\\}`, 'g'),
          `<span style="background:#e07a5f;color:white;padding:2px 6px;border-radius:4px;font-size:12px;">{{${v}}}</span>`,
        );
      });
    }

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
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>${preview}</body>
      </html>
    `;
  };

  // Subject preview with variable substitution
  const getPreviewSubject = () => {
    if (previewMode === 'sample') {
      return substituteVariables(subject, sampleValues);
    }
    return subject;
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
        {/* Header */}
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
          {/* Name + Subject Inputs */}
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

          {/* Subject Preview */}
          {subject.trim() && (
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border border-border rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Subject Preview
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {getPreviewSubject()}
                </p>
              </div>
            </div>
          )}

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
              <div
                className={`relative border border-border rounded-lg overflow-hidden ${
                  isFullScreen ? 'h-[600px]' : 'h-[300px]'
                }`}
              >
                {/* Line Numbers */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-10 bg-muted/30 border-r border-border overflow-hidden pointer-events-none select-none z-10"
                  aria-hidden="true"
                >
                  <div className="pt-[10px] px-1 text-right">
                    {lineNumbers.map((num) => (
                      <div
                        key={num}
                        className="text-[11px] leading-[20px] text-muted-foreground/60 font-mono"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="<h1>Hello {{name}}</h1><p>Welcome to {{company}}!</p>"
                  className="w-full h-full pl-12 pr-4 py-2.5 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none font-mono text-sm resize-none leading-[20px]"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Preview Panel */}
            <div
              className={`${
                activeTab === 'editor'
                  ? 'hidden md:block'
                  : ''
              }`}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Eye className="w-4 h-4" />
                  Live Preview
                </label>
                <div className="flex items-center gap-1">
                  {/* Preview Mode Toggle */}
                  <button
                    onClick={() =>
                      setPreviewMode(
                        previewMode === 'sample'
                          ? 'tags'
                          : 'sample',
                      )
                    }
                    className={`p-1.5 rounded-md transition-colors ${
                      previewMode === 'tags'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title={
                      previewMode === 'sample'
                        ? 'Show variable tags'
                        : 'Show with sample data'
                    }
                  >
                    {previewMode === 'tags' ? (
                      <Tags className="w-4 h-4" />
                    ) : (
                      <Type className="w-4 h-4" />
                    )}
                  </button>

                  {/* Divider */}
                  <div className="w-px h-4 bg-border mx-0.5" />

                  {/* Viewport Toggle */}
                  <button
                    onClick={() =>
                      setViewportMode('desktop')
                    }
                    className={`p-1.5 rounded-md transition-colors ${
                      viewportMode === 'desktop'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Desktop view"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setViewportMode('mobile')
                    }
                    className={`p-1.5 rounded-md transition-colors ${
                      viewportMode === 'mobile'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Mobile view (375px)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview Device Frame */}
              <div
                className={`flex items-center justify-center overflow-hidden ${
                  isFullScreen ? 'h-[600px]' : 'h-[340px]'
                }`}
              >
                {html.trim() ? (
                  viewportMode === 'desktop' ? (
                    /* ─── Laptop Frame ─── */
                    <div className="flex flex-col items-center h-full w-full py-2">
                      {/* Screen bezel */}
                      <div className="relative bg-[#1a1a1a] rounded-t-xl pt-3 pb-1 px-2 flex-1 w-full flex flex-col min-h-0">
                        {/* Camera dot */}
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#333]" />
                        {/* Screen */}
                        <div className="flex-1 bg-white rounded-[2px] overflow-hidden min-h-0">
                          <iframe
                            srcDoc={getPreviewHtml()}
                            sandbox="allow-same-origin"
                            title="Email Preview"
                            className="w-full h-full border-0"
                          />
                        </div>
                      </div>
                      {/* Laptop base / hinge */}
                      <div className="w-[110%] max-w-full">
                        <div className="h-[3px] bg-[#2a2a2a] rounded-b-sm mx-auto w-[70%]" />
                        <div className="h-[8px] bg-linear-to-b from-[#c0c0c0] to-[#a0a0a0] rounded-b-lg mx-auto shadow-sm" />
                      </div>
                    </div>
                  ) : (
                    /* ─── Phone Frame ─── */
                    <div className="flex flex-col items-center h-full py-2">
                      <div className="relative bg-[#1a1a1a] rounded-[28px] p-[6px] flex flex-col h-full w-[200px] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_20px_rgba(0,0,0,0.3)]">
                        {/* Top bar with notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60px] h-[18px] bg-[#1a1a1a] rounded-b-xl z-10 flex items-center justify-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-[#333]" />
                          <div className="w-6 h-1 rounded-full bg-[#333]" />
                        </div>
                        {/* Screen */}
                        <div className="flex-1 bg-white rounded-[22px] overflow-hidden min-h-0">
                          <iframe
                            srcDoc={getPreviewHtml()}
                            sandbox="allow-same-origin"
                            title="Email Preview (Mobile)"
                            className="w-full h-full border-0"
                          />
                        </div>
                        {/* Home indicator */}
                        <div className="flex justify-center py-1">
                          <div className="w-[40%] h-[3px] bg-[#444] rounded-full" />
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full w-full text-muted-foreground text-sm">
                    Start typing HTML to see preview
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sample Variable Values Panel */}
          {previewVars.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setShowVariablePanel(!showVariablePanel)
                }
                className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Variable className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Sample Variable Values
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({previewVars.length}{' '}
                    {previewVars.length === 1
                      ? 'variable'
                      : 'variables'}
                    )
                  </span>
                </div>
                {showVariablePanel ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {showVariablePanel && (
                <div className="p-4 space-y-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3">
                    Edit sample values to see how your
                    template looks with real data.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewVars.map((v) => (
                      <div
                        key={v}
                        className="flex items-center gap-2"
                      >
                        <span className="flex items-center px-2.5 py-1.5 bg-primary/10 rounded-md text-xs font-mono text-primary min-w-[100px] shrink-0">
                          {`{{${v}}}`}
                        </span>
                        <input
                          type="text"
                          value={sampleValues[v] || ''}
                          onChange={(e) =>
                            setSampleOverrides((prev) => ({
                              ...prev,
                              [v]: e.target.value,
                            }))
                          }
                          placeholder={`Sample ${v}`}
                          className="flex-1 px-3 py-1.5 bg-transparent border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-w-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Link Tracking */}
          <LinkTrackingSection
            links={detectedLinks}
            excludedLinks={excludedLinks}
            onToggle={toggleLink}
          />
        </div>

        {/* Footer */}
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
