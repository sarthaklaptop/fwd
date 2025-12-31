'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { BatchesTable } from './batches-table';
import { BatchDetailModal } from './batches-modal';
import { CreateCampaignModal } from './create-campaign-modal';
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
  const [showCreateModal, setShowCreateModal] =
    useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    setLoading(true);
    try {
      const res = await fetch('/api/batches?limit=20');
      const response = await res.json();
      if (response.success) {
        setBatches(response.data.batches);
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
      const response = await res.json();
      if (response.success) {
        setSelectedBatch({
          ...response.data.batch,
          emails: response.data.emails,
          linkStats: response.data.linkStats || null,
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

  function handleCampaignSuccess() {
    fetchBatches();
  }

  const pendingBatch = pendingBatchId
    ? batches.find((b) => b.id === pendingBatchId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
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

      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCampaignSuccess}
      />
    </div>
  );
}
