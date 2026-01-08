'use client';

import { useState } from 'react';
import { Globe, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModalKeyboard } from '@/hooks/use-modal-keyboard';

interface AddDomainModalProps {
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onSave: (domain: string) => void;
}

export function AddDomainModal({
  isOpen,
  loading,
  onClose,
  onSave,
}: AddDomainModalProps) {
  const [domain, setDomain] = useState('');

  const handleSave = () => {
    if (domain.trim()) {
      onSave(domain.trim());
      setDomain('');
    }
  };

  const handleClose = () => {
    setDomain('');
    onClose();
  };

  const canSubmit = !loading && domain.trim();

  useModalKeyboard({
    onClose: handleClose,
    onSubmit: () => canSubmit && handleSave(),
    isOpen,
    submitDisabled: !canSubmit,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border p-6 rounded-xl max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Add Custom Domain
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Domain Name
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Enter your domain without http:// or www
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-2">
              What happens next?
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                We generate DNS records for your domain
              </li>
              <li>Add the records to your DNS provider</li>
              <li>Click verify to confirm ownership</li>
              <li>
                Start sending emails from your domain!
              </li>
            </ol>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSave}
            isLoading={loading}
            disabled={!domain.trim()}
            className="flex-1 rounded-lg"
          >
            {loading ? 'Adding...' : 'Add Domain'}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-lg hover:bg-primary/10 hover:border-primary/30"
          >
            Cancel
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono shadow-sm">
            Esc
          </kbd>{' '}
          to close,{' '}
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono shadow-sm">
            ⌘/Ctrl + Enter
          </kbd>{' '}
          to submit
        </p>
      </div>
    </div>
  );
}
