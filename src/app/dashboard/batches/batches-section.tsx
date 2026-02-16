'use client';

import { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  ChevronDown,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BatchesTable } from './batches-table';
import { BatchDetailModal } from './batches-modal';
import { CreateCampaignModal } from './create-campaign-modal';
import type { Batch, BatchDetail } from './batches-types';

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
  const [statusFilter, setStatusFilter] = useState('');

  // Filter batches client-side
  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      !search ||
      (b.templateName
        ?.toLowerCase()
        .includes(search.toLowerCase()) ??
        false);
    const matchesStatus =
      !statusFilter || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function fetchBatches() {
    setLoading(true);
    try {
      const res = await fetch('/api/batches?limit=50');
      const response = await res.json();
      if (response.success) {
        setBatches(response.data.batches);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      toast.error('Failed to load batches');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBatches();
  }, []);

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
        toast.success(
          response.message || 'Retrying failed emails',
        );
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
              placeholder="Search by template..."
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
        batches={filteredBatches}
        loading={loading}
        onSelectBatch={fetchBatchDetail}
        onCreateClick={() => setShowCreateModal(true)}
      />

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
