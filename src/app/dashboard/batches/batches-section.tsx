'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { BatchesTable } from './batches-table';
import { BatchDetailModal } from './batches-modal';
import type { Batch, BatchDetail } from './batches-types';

export default function BatchesSection() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] =
    useState<BatchDetail | null>(null);
  const [pendingBatchId, setPendingBatchId] = useState<
    string | null
  >(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    setLoading(true);
    try {
      const res = await fetch('/api/batches?limit=20');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
    setLoading(false);
  }

  async function fetchBatchDetail(batch: Batch) {
    setPendingBatchId(batch.id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/batches/${batch.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBatch({
          ...data.batch,
          emails: data.emails,
        });
      }
    } catch (error) {
      console.error('Failed to fetch batch detail:', error);
    }
    setDetailLoading(false);
  }

  function closeModal() {
    setSelectedBatch(null);
    setPendingBatchId(null);
  }

  const pendingBatch = pendingBatchId
    ? batches.find((b) => b.id === pendingBatchId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => fetchBatches()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-primary/10 text-foreground text-sm font-medium rounded-lg border border-border hover:border-primary/30 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              loading ? 'animate-spin' : ''
            }`}
          />
          Refresh
        </button>
      </div>

      <BatchesTable
        batches={batches}
        loading={loading}
        onSelectBatch={fetchBatchDetail}
      />

      {(selectedBatch || pendingBatchId) && (
        <BatchDetailModal
          batch={selectedBatch}
          pendingBatch={pendingBatch}
          loading={detailLoading}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
