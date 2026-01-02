'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Send,
  FileText,
  Users,
  Eye,
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  subject: string;
  html: string;
}

interface Recipient {
  to: string;
  variables?: Record<string, string>;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCampaignModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCampaignModalProps) {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>(
    []
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<Template | null>(null);
  const [recipients, setRecipients] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setStep(1);
      setSelectedTemplate(null);
      setRecipients('');
      setError(null);
    }
  }, [isOpen]);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
      const response = await res.json();
      if (response.success) {
        setTemplates(response.data.templates);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
    setLoading(false);
  }

  function parseRecipients(): Recipient[] {
    const lines = recipients
      .trim()
      .split('\n')
      .filter((line) => line.trim());
    return lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const to = parts[0];
      const variables: Record<string, string> = {};

      // Parse name if provided (format: email,name)
      if (parts[1]) {
        variables.name = parts[1];
      }

      return { to, variables };
    });
  }

  async function handleSend() {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    const parsedRecipients = parseRecipients();
    if (parsedRecipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          recipients: parsedRecipients,
        }),
      });

      const response = await res.json();

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(
          response.message || 'Failed to send campaign'
        );
      }
    } catch (err) {
      setError('Failed to send campaign');
    }
    setSending(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Create Campaign
              </h3>
              <p className="text-muted-foreground text-sm">
                Step {step} of 3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Select Template */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Select Template
              </h4>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-secondary/50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No templates found</p>
                  <p className="text-sm mt-1">
                    Create a template first in the Templates
                    section
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() =>
                        setSelectedTemplate(template)
                      }
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                      }`}
                    >
                      <p className="font-medium text-foreground truncate">
                        {template.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {template.subject}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Add Recipients */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Add Recipients
              </h4>
              <p className="text-sm text-muted-foreground">
                Enter email addresses, one per line.
                Optionally add name after comma
                (email,name).
              </p>
              <textarea
                value={recipients}
                onChange={(e) =>
                  setRecipients(e.target.value)
                }
                placeholder="john@example.com,John Doe
jane@example.com,Jane Smith
user@example.com"
                className="w-full h-48 px-4 py-3 bg-secondary/30 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder:text-muted-foreground font-mono text-sm"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="w-4 h-4" />
                <span>
                  {parseRecipients().length} recipients
                  detected
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Send */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Review Campaign
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase mb-1">
                    Template
                  </p>
                  <p className="font-medium text-foreground">
                    {selectedTemplate?.name}
                  </p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase mb-1">
                    Recipients
                  </p>
                  <p className="font-medium text-foreground">
                    {parseRecipients().length}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-2">
                  Subject
                </p>
                <p className="text-foreground">
                  {selectedTemplate?.subject}
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500 text-sm">
                ✨ Links in this email will be automatically
                tracked via Shrnk
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/20">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && !selectedTemplate) {
                    setError('Please select a template');
                    return;
                  }
                  if (
                    step === 2 &&
                    parseRecipients().length === 0
                  ) {
                    setError(
                      'Please add at least one recipient'
                    );
                    return;
                  }
                  setError(null);
                  setStep(step + 1);
                }}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Campaign
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
