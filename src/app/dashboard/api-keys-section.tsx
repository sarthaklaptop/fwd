'use client';

import { useState } from 'react';

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
    }
  };

  const revokeKey = async (id: string) => {
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setKeys(keys.map(k => k.id === id ? { ...k, revokedAt: new Date() } : k));
    }
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
      <h2 className="text-2xl font-bold text-white mb-2">API Keys</h2>
      <p className="text-gray-400 mb-4">Use these keys to authenticate your API requests</p>

      {/* Create New Key */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g., Production)"
          className="flex-1 max-w-xs px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={createKey}
          disabled={loading || !newKeyName.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Key'}
        </button>
      </div>

      {/* Keys Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-300 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-300 uppercase">Key</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-300 uppercase">Last Used</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-300 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No API keys yet. Create your first key above!
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-white">{key.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono">{key.keyPrefix}...</td>
                  <td className="px-6 py-4 text-sm text-gray-400" suppressHydrationWarning>
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    {key.revokedAt ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                        Revoked
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {!key.revokedAt && (
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">Your New API Key</h3>
            <p className="text-yellow-400 text-sm mb-4">
              ⚠️ Copy this key now! It won&apos;t be shown again.
            </p>
            <div className="bg-gray-900 p-4 rounded-lg mb-4 font-mono text-sm text-green-400 break-all">
              {newKey}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                {copied ? '✓ Copied!' : 'Copy Key'}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg"
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
