'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Send,
  Loader2,
  Mail,
  Variable,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModalKeyboard } from '@/hooks/use-modal-keyboard';
import {
  extractTemplateVariables,
  getSampleValue,
} from '@/lib/templates';
import toast from 'react-hot-toast';

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    name: string;
    subject: string;
    html: string;
  } | null;
  userEmail: string;
}

export function TestEmailModal({
  isOpen,
  onClose,
  template,
  userEmail,
}: TestEmailModalProps) {
  const [email, setEmail] = useState(userEmail);
  const [variables, setVariables] = useState<
    Record<string, string>
  >({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Get detected variables
  const detectedVars = template
    ? [
        ...new Set([
          ...extractTemplateVariables(template.subject),
          ...extractTemplateVariables(template.html),
        ]),
      ]
    : [];

  // Initialize on open
  useEffect(() => {
    if (isOpen && template) {
      setEmail(userEmail);
      setSent(false);
      setSending(false);

      // Set default sample values
      const defaults: Record<string, string> = {};
      const vars = [
        ...new Set([
          ...extractTemplateVariables(template.subject),
          ...extractTemplateVariables(template.html),
        ]),
      ];
      vars.forEach((v) => {
        defaults[v] = getSampleValue(v, userEmail);
      });
      setVariables(defaults);
    }
  }, [isOpen, template, userEmail]);

  useModalKeyboard({
    onClose,
    isOpen,
  });

  const handleSendTest = async () => {
    if (!template || !email) return;

    setSending(true);
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: template.subject,
          html: template.html,
          variables,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send');
      }

      setSent(true);
      toast.success(`Test email sent to ${email}!`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to send',
      );
    }
    setSending(false);
  };

  // Get preview subject with substitutions
  const getPreviewSubject = () => {
    if (!template) return '';
    let preview = template.subject;
    detectedVars.forEach((v) => {
      preview = preview.replace(
        new RegExp(`\\{\\{${v}\\}\\}`, 'g'),
        variables[v] || `{{${v}}}`,
      );
    });
    return preview;
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Send Test Email
              </h3>
              <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                {template.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {sent ? (
            /* Success State */
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Test Email Sent!
              </h4>
              <p className="text-muted-foreground">
                Check your inbox at{' '}
                <strong className="text-foreground">
                  {email}
                </strong>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Subject will include [TEST] prefix
              </p>
              <Button onClick={onClose} className="mt-6">
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Email Input */}
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1.5">
                  <Mail className="w-4 h-4" />
                  Send to
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Variable Inputs */}
              {detectedVars.length > 0 && (
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-2">
                    <Variable className="w-4 h-4" />
                    Sample Variable Values
                  </label>
                  <div className="space-y-2">
                    {detectedVars.map((varName) => (
                      <div
                        key={varName}
                        className="flex gap-2"
                      >
                        <span className="flex items-center px-3 py-2 bg-muted/30 rounded-lg text-sm font-mono min-w-[120px] text-muted-foreground">
                          {`{{${varName}}}`}
                        </span>
                        <input
                          type="text"
                          value={variables[varName] || ''}
                          onChange={(e) =>
                            setVariables((prev) => ({
                              ...prev,
                              [varName]: e.target.value,
                            }))
                          }
                          placeholder={`Sample ${varName}`}
                          className="flex-1 px-3 py-2 bg-transparent border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject Preview */}
              <div className="p-3 bg-muted/20 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">
                  Subject Preview:
                </p>
                <p className="text-sm text-foreground font-medium">
                  <span className="text-primary">
                    [TEST]
                  </span>{' '}
                  {getPreviewSubject()}
                </p>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendTest}
                disabled={sending || !email}
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>

              {/* Info note */}
              <p className="text-xs text-muted-foreground text-center">
                Test emails are not tracked and include
                [TEST] in the subject.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
