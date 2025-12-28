'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { Key, Plus, Copy, Check, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}

export default function ApiKeysSection({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [newKeyName, setNewKeyName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setNewKey(data.key);
      setShowModal(true);
      setKeys([{ ...data, lastUsedAt: null, revokedAt: null }, ...keys]);
      setNewKeyName('');
      toast.success('API key created successfully!');
    } else {
      toast.error('Failed to create key');
    }
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;

    const res = await fetch(`/api/keys/${revokeTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setKeys(keys.map(k => k.id === revokeTarget.id ? { ...k, revokedAt: new Date() } : k));
      toast.success('API key revoked');
    } else {
      toast.error('Failed to revoke key');
    }
    setRevokeTarget(null);
  };

  const copyToClipboard = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setNewKey(null);
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      {/* Create New Key */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g., Production)"
          className="flex-1 max-w-sm px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && createKey()}
        />
        <button
          onClick={createKey}
          disabled={loading || !newKeyName.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:opacity-50 transition-all"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create Key
            </>
          )}
        </button>
      </div>

      {/* Keys Table */}
      {keys.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-xl bg-card/50">
          <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-foreground font-medium">No API keys yet</p>
          <p className="text-muted-foreground text-sm mt-1">Create your first key to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{key.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{key.keyPrefix}...</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground" suppressHydrationWarning>
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {key.revokedAt ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 dark:text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400"></span>
                        Revoked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"></span>
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!key.revokedAt && (
                      <button
                        onClick={() => setRevokeTarget(key)}
                        className="inline-flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!revokeTarget}
        title="Revoke API Key"
        message={`Are you sure you want to revoke "${revokeTarget?.name}"? This action cannot be undone and any applications using this key will stop working.`}
        confirmText="Revoke Key"
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeTarget(null)}
        variant="danger"
      />

      {/* New Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card border border-border p-6 rounded-xl max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Your New API Key</h3>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                Copy this key now! It won&apos;t be shown again.
              </p>
            </div>
            <div className="bg-secondary p-4 rounded-lg mb-4 font-mono text-sm text-green-600 dark:text-green-400 break-all border border-border">
              {newKey}
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Key
                  </>
                )}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2.5 bg-transparent hover:bg-primary/10 text-foreground font-medium rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
