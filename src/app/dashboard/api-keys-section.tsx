'use client';

import { useState } from 'react';
import { ConfirmDialog, Toast } from '@/components/ui';

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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
      setToast({ message: 'API key created successfully!', type: 'success' });
    } else {
      setToast({ message: 'Failed to create key', type: 'error' });
    }
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    
    const res = await fetch(`/api/keys/${revokeTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setKeys(keys.map(k => k.id === revokeTarget.id ? { ...k, revokedAt: new Date() } : k));
      setToast({ message: 'API key revoked', type: 'success' });
    } else {
      setToast({ message: 'Failed to revoke key', type: 'error' });
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
    <div>
      <h2 className="text-xl font-bold text-white mb-1">API Keys</h2>
      <p className="text-gray-400 text-sm mb-4">Manage your API keys for authentication</p>

      {/* Create New Key */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g., Production)"
          className="flex-1 max-w-sm px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && createKey()}
        />
        <button
          onClick={createKey}
          disabled={loading || !newKeyName.trim()}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
        >
          {loading ? 'Creating...' : '+ Create Key'}
        </button>
      </div>

      {/* Keys Table */}
      {keys.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔑</div>
          <p className="text-gray-400">No API keys yet</p>
          <p className="text-gray-500 text-sm">Create your first key to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium">{key.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">{key.keyPrefix}...</td>
                  <td className="px-4 py-3 text-sm text-gray-400" suppressHydrationWarning>
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {key.revokedAt ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        Revoked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!key.revokedAt && (
                      <button
                        onClick={() => setRevokeTarget(key)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
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
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">🔑 Your New API Key</h3>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ Copy this key now! It won&apos;t be shown again.
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg mb-4 font-mono text-sm text-green-400 break-all border border-gray-700">
              {newKey}
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg transition-all"
              >
                {copied ? '✓ Copied!' : 'Copy Key'}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
