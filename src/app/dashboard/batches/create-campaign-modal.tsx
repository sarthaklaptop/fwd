'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Send,
  FileText,
  Users,
  Eye,
  ChevronDown,
  Check,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useModalKeyboard } from '@/hooks/use-modal-keyboard';
import { TestEmailModal } from '../templates/templates-test-modal';

interface Template {
  id: string;
  name: string;
  subject: string;
  html: string;
}

interface Domain {
  id: string;
  domain: string;
  status: string;
}

interface Recipient {
  to: string;
  variables?: Record<string, string>;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  duplicateFrom?: {
    templateId: string;
    fromEmail: string;
    batchId: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCampaignModal({
  isOpen,
  duplicateFrom,
  onClose,
  onSuccess,
}: CreateCampaignModalProps) {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>(
    [],
  );
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<Template | null>(null);
  const [recipients, setRecipients] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<
    string | null
  >(null);
  const [templateVariables, setTemplateVariables] =
    useState<string[]>([]);

  // From fields
  const [fromName, setFromName] = useState('');
  const [fromPrefix, setFromPrefix] = useState('');
  const [selectedDomain, setSelectedDomain] =
    useState<Domain | null>(null);
  const [domainDropdownOpen, setDomainDropdownOpen] =
    useState(false);
  const [domainsLoading, setDomainsLoading] =
    useState(false);
  const domainDropdownRef = useRef<HTMLDivElement>(null);

  // Test email modal state
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Duplicate mode state
  const [loadPrevRecipients, setLoadPrevRecipients] =
    useState(false);
  const [prevRecipientsLoading, setPrevRecipientsLoading] =
    useState(false);
  const [prevRecipientCount, setPrevRecipientCount] =
    useState(0);
  const [duplicatePrefilling, setDuplicatePrefilling] =
    useState(false);
  // Cache batch emails to avoid duplicate API calls
  const cachedBatchEmails = useRef<Array<{
    to: string;
    variables?: string;
  }> | null>(null);

  // Click outside to close domain dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        domainDropdownRef.current &&
        !domainDropdownRef.current.contains(
          event.target as Node,
        )
      ) {
        setDomainDropdownOpen(false);
      }
    }
    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );
    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
  }, []);

  useModalKeyboard({
    onClose,
    onSubmit: () => step === 3 && !sending && handleSend(),
    isOpen,
    submitDisabled: step !== 3 || sending,
  });

  // Fetch user email for test modal
  useEffect(() => {
    async function fetchUserEmail() {
      const cachedEmail = localStorage.getItem(
        'fwd_user_email',
      );
      if (cachedEmail) {
        setUserEmail(cachedEmail);
        return;
      }
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.data.profile.email) {
          const email = data.data.profile.email;
          setUserEmail(email);
          localStorage.setItem('fwd_user_email', email);
        }
      } catch {
        // Silently fail, user can type email
      }
    }
    if (isOpen) fetchUserEmail();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchDomains();
      setStep(1);
      setSelectedTemplate(null);
      setRecipients('');
      setError(null);
      setLoadPrevRecipients(false);
      setPrevRecipientCount(0);
      setTemplateVariables([]);
      cachedBatchEmails.current = null;

      // If not duplicating, use last used values
      if (!duplicateFrom) {
        const lastFromName =
          localStorage.getItem('fwd_last_from_name') || '';
        const lastFromPrefix =
          localStorage.getItem('fwd_last_from_prefix') ||
          '';
        setFromName(lastFromName);
        setFromPrefix(lastFromPrefix);
      }
    }
  }, [isOpen, duplicateFrom]);

  // Pre-fill when duplicating (after templates/domains load)
  useEffect(() => {
    if (
      !isOpen ||
      !duplicateFrom ||
      templates.length === 0 ||
      domains.length === 0
    )
      return;

    // Capture values for closure (fixes TypeScript null checks)
    const dupFrom = duplicateFrom;

    // Prevent duplicate runs
    let cancelled = false;

    async function prefillDuplicateData() {
      setDuplicatePrefilling(true);

      // Find and select the template
      const template = templates.find(
        (t) => t.id === dupFrom.templateId,
      );
      if (template && !cancelled) {
        setSelectedTemplate(template);
        const subjectVars = extractTemplateVariables(
          template.subject,
        );
        const htmlVars = extractTemplateVariables(
          template.html,
        );
        const allVars = [
          ...new Set([...subjectVars, ...htmlVars]),
        ];
        setTemplateVariables(allVars);
      }

      // Parse and set from address
      if (dupFrom.fromEmail && !cancelled) {
        const emailMatch = dupFrom.fromEmail.match(
          /<(.+)>/,
        ) || [null, dupFrom.fromEmail];
        const email = emailMatch[1] || dupFrom.fromEmail;
        const [prefix, domainPart] = email.split('@');

        const nameMatch =
          dupFrom.fromEmail.match(/^(.+?)\s*</);
        if (nameMatch) {
          setFromName(nameMatch[1].trim());
        }

        setFromPrefix(prefix);
        const matchedDomain = domains.find(
          (d) => d.domain === domainPart,
        );
        if (matchedDomain) setSelectedDomain(matchedDomain);
      }

      // Fetch and cache batch emails (single API call)
      if (dupFrom.batchId && !cancelled) {
        try {
          const res = await fetch(
            `/api/batches/${dupFrom.batchId}`,
          );
          const data = await res.json();
          if (
            data.success &&
            data.data.emails &&
            !cancelled
          ) {
            cachedBatchEmails.current = data.data.emails;
            setPrevRecipientCount(data.data.emails.length);
          }
        } catch (err) {
          console.error('Failed to fetch batch data:', err);
        }
      }

      if (!cancelled) setDuplicatePrefilling(false);
    }

    prefillDuplicateData();

    return () => {
      cancelled = true;
    };
  }, [isOpen, duplicateFrom, templates, domains]);

  // Load recipients from cache (no duplicate API call)
  function loadOriginalRecipients() {
    if (!cachedBatchEmails.current) return;
    setPrevRecipientsLoading(true);

    const emailList = cachedBatchEmails.current
      .map((e) => {
        let vars: Record<string, string> = {};
        if (e.variables) {
          try {
            vars = JSON.parse(e.variables);
          } catch {
            /* ignore */
          }
        }

        if (
          templateVariables.length > 0 &&
          Object.keys(vars).length > 0
        ) {
          const varValues = templateVariables
            .map((v) => vars[v] || '')
            .join(', ');
          return `${e.to}, ${varValues}`;
        }
        return e.to;
      })
      .join('\n');
    setRecipients(emailList);
    setPrevRecipientsLoading(false);
  }

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

  async function fetchDomains() {
    setDomainsLoading(true);
    try {
      const res = await fetch('/api/domains');
      const response = await res.json();
      if (response.success) {
        const verifiedDomains = response.data.filter(
          (d: Domain) => d.status === 'verified',
        );
        setDomains(verifiedDomains);
        // Set first domain as default if not already set
        if (verifiedDomains.length > 0 && !selectedDomain) {
          const lastDomainId = localStorage.getItem(
            'fwd_last_domain_id',
          );
          const lastDomain = verifiedDomains.find(
            (d: Domain) => d.id === lastDomainId,
          );
          setSelectedDomain(
            lastDomain || verifiedDomains[0],
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    } finally {
      setDomainsLoading(false);
    }
  }

  // Extract template variables like {{name}}, {{organization}} from HTML
  function extractTemplateVariables(
    html: string,
  ): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = regex.exec(html)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  }

  // Handle template selection and extract variables from subject + HTML
  function handleTemplateSelect(template: Template) {
    setSelectedTemplate(template);
    // Extract from both subject and HTML, remove duplicates
    const subjectVars = extractTemplateVariables(
      template.subject,
    );
    const htmlVars = extractTemplateVariables(
      template.html,
    );
    const allVars = [
      ...new Set([...subjectVars, ...htmlVars]),
    ];
    setTemplateVariables(allVars);
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

      // Map CSV columns to detected template variables
      templateVariables.forEach((varName, index) => {
        if (parts[index + 1]) {
          variables[varName] = parts[index + 1];
        }
      });

      return { to, variables };
    });
  }

  // Check for recipients with missing variable columns
  function getMissingVariablesCount(): number {
    if (templateVariables.length === 0) return 0;
    const lines = recipients
      .trim()
      .split('\n')
      .filter((line) => line.trim());
    const expectedColumns = templateVariables.length + 1; // email + variables
    return lines.filter((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return (
        parts.length > 0 &&
        parts[0] &&
        parts.length < expectedColumns
      );
    }).length;
  }

  async function handleSend() {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    if (!selectedDomain) {
      setError('Please select a verified domain');
      return;
    }

    if (!fromPrefix.trim()) {
      setError('Please enter a from email address');
      return;
    }

    const parsedRecipients = parseRecipients();
    if (parsedRecipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    // Build from address
    const fromEmail = `${fromPrefix.trim()}@${
      selectedDomain.domain
    }`;
    const from = fromName.trim()
      ? `${fromName.trim()} <${fromEmail}>`
      : fromEmail;

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
          from,
        }),
      });

      const response = await res.json();

      if (response.success) {
        // Save last used values
        localStorage.setItem(
          'fwd_last_from_name',
          fromName,
        );
        localStorage.setItem(
          'fwd_last_from_prefix',
          fromPrefix,
        );
        localStorage.setItem(
          'fwd_last_domain_id',
          selectedDomain.id,
        );

        toast.success(
          response.message || 'Campaign sent successfully!',
        );
        onSuccess();
        onClose();
      } else {
        toast.error(
          response.message || 'Failed to send campaign',
        );
      }
    } catch (err) {
      toast.error('Failed to send campaign');
    }
    setSending(false);
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col">
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
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto overflow-x-visible max-h-[calc(85vh-140px)] flex-1">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Loading overlay for duplicate pre-fill */}
            {duplicatePrefilling && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading campaign data...
                </p>
              </div>
            )}

            {!duplicatePrefilling && (
              <>
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
                          Create a template first in the
                          Templates section
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() =>
                              handleTemplateSelect(template)
                            }
                            className={`p-4 rounded-lg border text-left transition-all ${
                              selectedTemplate?.id ===
                              template.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50 hover:bg-primary/10'
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

                    {/* From Address Section */}
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                        📧 From Address
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">
                            From Name (optional)
                          </label>
                          <input
                            type="text"
                            value={fromName}
                            onChange={(e) =>
                              setFromName(e.target.value)
                            }
                            placeholder="My Newsletter"
                            className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">
                            From Email *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={fromPrefix}
                              onChange={(e) =>
                                setFromPrefix(
                                  e.target.value.replace(
                                    /[^a-zA-Z0-9._-]/g,
                                    '',
                                  ),
                                )
                              }
                              placeholder="newsletter"
                              className="flex-1 px-3 py-2 bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-mono"
                            />
                            <span className="flex items-center text-muted-foreground text-sm">
                              @
                            </span>
                            <div
                              className="relative flex-1"
                              ref={domainDropdownRef}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setDomainDropdownOpen(
                                    !domainDropdownOpen,
                                  )
                                }
                                className="w-full min-w-[140px] flex items-center justify-between gap-2 px-3 py-2 bg-muted/20 border border-border rounded-lg text-foreground text-sm font-mono hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                              >
                                <span
                                  className={
                                    selectedDomain
                                      ? 'text-foreground'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  {domainsLoading
                                    ? 'Loading...'
                                    : selectedDomain?.domain ||
                                      'Select domain'}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                                    domainDropdownOpen
                                      ? 'rotate-180'
                                      : ''
                                  }`}
                                />
                              </button>
                              {domainDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 py-1 animate-fade-in max-h-48 overflow-auto">
                                  {domains.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                      No verified domains
                                    </div>
                                  ) : (
                                    domains.map(
                                      (domain) => (
                                        <button
                                          key={domain.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedDomain(
                                              domain,
                                            );
                                            setDomainDropdownOpen(
                                              false,
                                            );
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-mono text-left transition-colors ${
                                            selectedDomain?.id ===
                                            domain.id
                                              ? 'bg-primary/10 text-primary'
                                              : 'text-foreground hover:bg-primary/10'
                                          }`}
                                        >
                                          <span>
                                            {domain.domain}
                                          </span>
                                          {selectedDomain?.id ===
                                            domain.id && (
                                            <Check className="w-4 h-4" />
                                          )}
                                        </button>
                                      ),
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {domains.length === 0 && (
                            <p className="text-xs text-yellow-500 mt-1">
                              ⚠️ Add and verify a domain in
                              the Domains section first
                            </p>
                          )}
                          {selectedDomain && fromPrefix && (
                            <p className="text-xs text-green-500 mt-1">
                              ✓ Will send from:{' '}
                              {fromName
                                ? `${fromName} <${fromPrefix}@${selectedDomain.domain}>`
                                : `${fromPrefix}@${selectedDomain.domain}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Add Recipients */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Add Recipients
                    </h4>

                    {/* Load previous recipients toggle (only in duplicate mode) */}
                    {duplicateFrom &&
                      prevRecipientCount > 0 && (
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-3">
                            <RotateCcw className="w-4 h-4 text-primary" />
                            <div>
                              <p className="text-sm text-foreground">
                                Load previous recipients
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {prevRecipientCount} emails
                                from original campaign
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newValue =
                                !loadPrevRecipients;
                              setLoadPrevRecipients(
                                newValue,
                              );
                              if (newValue) {
                                loadOriginalRecipients();
                              } else {
                                setRecipients('');
                              }
                            }}
                            disabled={prevRecipientsLoading}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              loadPrevRecipients
                                ? 'bg-primary'
                                : 'bg-muted'
                            }`}
                          >
                            {prevRecipientsLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin absolute left-1.5" />
                            ) : (
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  loadPrevRecipients
                                    ? 'translate-x-6'
                                    : 'translate-x-1'
                                }`}
                              />
                            )}
                          </button>
                        </div>
                      )}

                    {/* Dynamic format instructions based on template variables */}
                    {templateVariables.length > 0 ? (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Enter one recipient per line using
                          format:{' '}
                          <span className="text-foreground font-mono">
                            email,{' '}
                            {templateVariables.join(', ')}
                          </span>
                        </p>
                        <p className="text-xs">
                          Example: john@acme.com,{' '}
                          {templateVariables
                            .map((v, i) =>
                              i === 0
                                ? 'John'
                                : `${
                                    v
                                      .charAt(0)
                                      .toUpperCase() +
                                    v.slice(1)
                                  } Value`,
                            )
                            .join(', ')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Enter email addresses, one per line.
                      </p>
                    )}

                    <textarea
                      value={recipients}
                      onChange={(e) =>
                        setRecipients(e.target.value)
                      }
                      placeholder={
                        templateVariables.length > 0
                          ? `john@example.com, ${templateVariables
                              .map((v, i) =>
                                i === 0
                                  ? 'John Doe'
                                  : `${
                                      v
                                        .charAt(0)
                                        .toUpperCase() +
                                      v.slice(1)
                                    } Value`,
                              )
                              .join(
                                ', ',
                              )}\njane@example.com, ${templateVariables
                              .map((v, i) =>
                                i === 0
                                  ? 'Jane Smith'
                                  : `Another ${
                                      v
                                        .charAt(0)
                                        .toUpperCase() +
                                      v.slice(1)
                                    }`,
                              )
                              .join(', ')}`
                          : `john@example.com\njane@example.com`
                      }
                      className="w-full h-48 px-4 py-3 bg-muted/20 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder:text-muted-foreground font-mono text-sm"
                    />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="w-4 h-4" />
                      <span>
                        {parseRecipients().length}{' '}
                        recipients detected
                      </span>
                    </div>
                    {getMissingVariablesCount() > 0 && (
                      <p className="text-xs text-yellow-500">
                        ⚠️ {getMissingVariablesCount()}{' '}
                        recipient(s) missing variable values
                      </p>
                    )}
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
                      ✨ Links in this email will be
                      automatically tracked via Shrnk
                    </div>

                    {/* Send Test Email Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Want to preview first?
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTestEmailOpen(true)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Send Test Email
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/20">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  step > 1 && setStep(step - 1)
                }
                disabled={step === 1}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono shadow-sm">
                  Esc
                </kbd>{' '}
                to close
                {step === 3 && (
                  <>
                    {' · '}
                    <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono shadow-sm">
                      ⌘
                    </kbd>
                    <span className="mx-0.5">+</span>
                    <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono shadow-sm">
                      Enter
                    </kbd>{' '}
                    to send
                  </>
                )}
              </span>
            </div>
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
                        'Please add at least one recipient',
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

      {/* Test Email Modal */}
      <TestEmailModal
        isOpen={testEmailOpen}
        onClose={() => setTestEmailOpen(false)}
        template={selectedTemplate}
        userEmail={userEmail}
      />
    </>
  );
}
