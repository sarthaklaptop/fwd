'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  ChevronDown,
  Check,
  RotateCcw,
  Send,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BatchesTable } from './batches-table';
import { BatchDetailModal } from './batches-modal';
import { CreateCampaignModal } from './create-campaign-modal';
import type { Batch, BatchDetail } from './batches-types';

function toastBatchRetried(count?: number) {
  toast(
    () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: 320, boxSizing: 'border-box' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(234,179,8,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RotateCcw size={18} color="#eab308" />
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Retrying failed emails</p>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>{count ? `${count} email${count !== 1 ? 's' : ''} queued` : 'Emails queued for retry'}</p>
        </div>
      </div>
    ),
    { duration: 4000 },
  );
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'partial', label: 'Partial' },
  { value: 'failed', label: 'Failed' },
];

export default function BatchesSection() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedBatch, setSelectedBatch] =
    useState<BatchDetail | null>(null);
  const [pendingBatchId, setPendingBatchId] = useState<
    string | null
  >(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [duplicateFrom, setDuplicateFrom] = useState<{
    templateId: string;
    fromEmail: string;
    batchId: string;
  } | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search),
      500,
    );
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBatches = useCallback(
    async (cursor?: string | null) => {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (statusFilter) params.set('status', statusFilter);
        params.set('limit', '20');

        const res = await fetch(`/api/batches?${params}`);
        const response = await res.json();
        if (response.success) {
          if (cursor) {
            setBatches((prev) => [
              ...prev,
              ...response.data.batches,
            ]);
          } else {
            setBatches(response.data.batches);
          }
          setNextCursor(response.data.nextCursor);
          setHasMore(response.data.hasMore);
        }
      } catch (error) {
        console.error('Failed to fetch batches:', error);
        toast.error('Failed to load batches');
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Listen for command palette event
  useEffect(() => {
    const handleNewCampaign = () =>
      setShowCreateModal(true);
    window.addEventListener(
      'cmd:new-campaign',
      handleNewCampaign,
    );
    return () =>
      window.removeEventListener(
        'cmd:new-campaign',
        handleNewCampaign,
      );
  }, []);

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
      toast.error('Failed to load batch details');
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

  function handleDuplicate(batch: BatchDetail) {
    setSelectedBatch(null);
    setPendingBatchId(null);
    setDuplicateFrom({
      templateId: batch.templateId || '',
      fromEmail: batch.fromEmail || '',
      batchId: batch.id,
    });
    setShowCreateModal(true);
  }

  async function handleRetryFailed(batchId: string) {
    try {
      const res = await fetch(
        `/api/batches/${batchId}/retry`,
        {
          method: 'POST',
        },
      );
      const response = await res.json();
      if (response.success) {
        toastBatchRetried(response.data?.count);
        // Refresh the batch detail
        const batch = batches.find((b) => b.id === batchId);
        if (batch) {
          fetchBatchDetail(batch);
        }
        fetchBatches();
      } else {
        toast.error(
          response.message || 'Failed to retry emails',
        );
      }
    } catch (error) {
      console.error('Failed to retry emails:', error);
      toast.error('Failed to retry emails');
    }
  }

  const pendingBatch = pendingBatchId
    ? batches.find((b) => b.id === pendingBatchId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by template or sender..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
            />
          </div>
          <StatusFilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
        <div className="flex gap-2">
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
          </button>
        </div>
      </div>

      <BatchesTable
        batches={batches}
        loading={loading}
        onSelectBatch={fetchBatchDetail}
        onCreateClick={() => setShowCreateModal(true)}
      />

      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchBatches(nextCursor)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2 bg-transparent hover:bg-primary/10 text-foreground text-sm font-medium rounded-lg border border-border hover:border-primary/30 transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {(selectedBatch || pendingBatchId) && (
        <BatchDetailModal
          batch={selectedBatch}
          pendingBatch={pendingBatch}
          loading={detailLoading}
          onClose={closeModal}
          onDuplicate={handleDuplicate}
          onRetryFailed={handleRetryFailed}
        />
      )}

      <CreateCampaignModal
        isOpen={showCreateModal}
        duplicateFrom={duplicateFrom}
        onClose={() => {
          setShowCreateModal(false);
          setDuplicateFrom(null);
        }}
        onSuccess={handleCampaignSuccess}
      />
    </div>
  );
}

function StatusFilterDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
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

  const selectedOption =
    STATUS_OPTIONS.find((opt) => opt.value === value) ||
    STATUS_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 px-4 py-2 min-w-[140px] bg-transparent border border-border rounded-lg text-foreground text-sm hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-full min-w-[160px] bg-card border border-border rounded-lg shadow-xl z-50 py-1 animate-fade-in">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                value === option.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-primary/10'
              }`}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
