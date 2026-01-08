'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import {
  getStatusColor,
  getStatusLabel,
  DomainWithTokens,
} from './domains-types';

interface DomainCardProps {
  domain: DomainWithTokens;
  onVerify: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DomainCard({
  domain,
  onVerify,
  onDelete,
}: DomainCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);
  const [copiedRecord, setCopiedRecord] = useState<
    string | null
  >(null);

  const handleVerify = async () => {
    setVerifying(true);
    await onVerify(domain.id);
    setVerifying(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(domain.id);
    setShowDeleteConfirm(false);
    setDeleting(false);
  };

  // Close delete dialog on Escape key
  useEffect(() => {
    if (!showDeleteConfirm) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        setShowDeleteConfirm(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () =>
      document.removeEventListener('keydown', handleEscape);
  }, [showDeleteConfirm, deleting]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(label);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const dkimRecords = domain.dkimTokens.map((token) => ({
    type: 'CNAME',
    name: `${token}._domainkey.${domain.domain}`,
    value: `${token}.dkim.amazonses.com`,
  }));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {domain.domain}
            </h3>
            <p className="text-xs text-muted-foreground">
              Added{' '}
              {
                new Date(domain.createdAt)
                  .toISOString()
                  .split('T')[0]
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
              domain.status
            )}`}
          >
            {getStatusLabel(domain.status)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        {domain.status !== 'verified' && (
          <Button
            onClick={handleVerify}
            isLoading={verifying}
            size="sm"
            className="rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            {verifying ? 'Checking...' : 'Verify DNS'}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide DNS
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show DNS
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
          className="rounded-lg text-red-500 hover:text-red-600 hover:border-red-500/50"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in"
          onClick={() =>
            !deleting && setShowDeleteConfirm(false)
          }
        >
          <div
            className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Delete Domain
                </h3>
                <p className="text-sm text-muted-foreground">
                  {domain.domain}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              This action cannot be undone. The domain will
              be removed from AWS SES and all associated DNS
              records will need to be reconfigured if you
              add it again.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-500 hover:bg-red-600 text-white"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Domain
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DNS Records */}
      {expanded && (
        <div className="border-t border-border p-4 bg-muted/30 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              DKIM Records (Add all 3)
            </h4>
            <div className="space-y-2">
              {dkimRecords.map((record, i) => (
                <div
                  key={i}
                  className="bg-background border border-border rounded-lg p-4"
                >
                  <span className="text-sm font-medium text-primary mb-3 block">
                    CNAME Record {i + 1}
                  </span>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-muted-foreground w-14 pt-1 shrink-0">
                        Name:
                      </span>
                      <code className="flex-1 text-sm font-mono text-foreground bg-muted px-2 py-1 rounded break-all select-all">
                        {record.name}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            record.name,
                            `dkim-name-${i}`
                          )
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded"
                        title="Copy name"
                      >
                        {copiedRecord ===
                        `dkim-name-${i}` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-muted-foreground w-14 pt-1 shrink-0">
                        Value:
                      </span>
                      <code className="flex-1 text-sm font-mono text-foreground bg-muted px-2 py-1 rounded break-all select-all">
                        {record.value}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            record.value,
                            `dkim-value-${i}`
                          )
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded"
                        title="Copy value"
                      >
                        {copiedRecord ===
                        `dkim-value-${i}` ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              SPF Record (Recommended)
            </h4>
            <div className="bg-background border border-border rounded-lg p-4">
              <span className="text-sm font-medium text-yellow-500 mb-3 block">
                TXT Record
              </span>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-sm text-muted-foreground w-14 pt-1 shrink-0">
                    Name:
                  </span>
                  <code className="flex-1 text-sm font-mono text-foreground bg-muted px-2 py-1 rounded select-all">
                    {domain.domain}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        domain.domain,
                        'spf-name'
                      )
                    }
                    className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded"
                    title="Copy name"
                  >
                    {copiedRecord === 'spf-name' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm text-muted-foreground w-14 pt-1 shrink-0">
                    Value:
                  </span>
                  <code className="flex-1 text-sm font-mono text-foreground bg-muted px-2 py-1 rounded select-all">
                    v=spf1 include:amazonses.com ~all
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'v=spf1 include:amazonses.com ~all',
                        'spf-value'
                      )
                    }
                    className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded"
                    title="Copy value"
                  >
                    {copiedRecord === 'spf-value' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            DNS changes can take up to 48 hours to
            propagate. Click "Verify DNS" to check status.
          </p>
        </div>
      )}
    </div>
  );
}
