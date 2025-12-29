'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { KeysTable } from './api-keys-table';
import { NewKeyModal } from './api-keys-modal';
import type {
  ApiKey,
  ApiKeysSectionProps,
} from './api-keys-types';

export default function ApiKeysSection({
  initialKeys,
}: ApiKeysSectionProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [newKeyName, setNewKeyName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revokeTarget, setRevokeTarget] =
    useState<ApiKey | null>(null);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    });

    const response = await res.json();
    setLoading(false);

    if (response.success) {
      setNewKey(response.data.key);
      setShowModal(true);
      setKeys([
        {
          ...response.data,
          lastUsedAt: null,
          revokedAt: null,
        },
        ...keys,
      ]);
      setNewKeyName('');
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;

    const res = await fetch(
      `/api/keys/${revokeTarget.id}`,
      {
        method: 'DELETE',
      }
    );
    const response = await res.json();
    if (response.success) {
      setKeys(
        keys.map((k) =>
          k.id === revokeTarget.id
            ? { ...k, revokedAt: new Date() }
            : k
        )
      );
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
    setRevokeTarget(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewKey(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g., Production)"
          className="flex-1 max-w-sm px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          onKeyDown={(e) =>
            e.key === 'Enter' && createKey()
          }
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

      <KeysTable keys={keys} onRevoke={setRevokeTarget} />

      <ConfirmDialog
        isOpen={!!revokeTarget}
        title="Revoke API Key"
        message={`Are you sure you want to revoke "${revokeTarget?.name}"? This action cannot be undone and any applications using this key will stop working.`}
        confirmText="Revoke Key"
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeTarget(null)}
        variant="danger"
      />

      {showModal && newKey && (
        <NewKeyModal newKey={newKey} onClose={closeModal} />
      )}
    </div>
  );
}
