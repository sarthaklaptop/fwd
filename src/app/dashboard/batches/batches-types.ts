export interface Batch {
  id: string;
  templateId: string | null;
  templateName: string | null;
  total: number;
  valid: number;
  suppressed: number;
  duplicates: number;
  queued: number;
  completed: number;
  failed: number;
  status: string;
  createdAt: Date;
}

export interface BatchEmail {
  id: string;
  to: string;
  subject: string;
  status: string;
  openedAt: Date | null;
  createdAt: Date;
}

export interface BatchDetail extends Batch {
  emails: BatchEmail[];
}

export interface BatchesTableProps {
  batches: Batch[];
  loading: boolean;
  onSelectBatch: (batch: Batch) => void;
}

export interface StatusBadgeProps {
  status: string;
}

export interface SuccessRateProps {
  completed: number;
  queued: number;
}

export interface BatchDetailModalProps {
  batch: BatchDetail | null;
  pendingBatch: Batch | null | undefined;
  loading: boolean;
  onClose: () => void;
}

export interface StatCardProps {
  label: string;
  value: number;
  color?: string;
}

export interface EmailStatusBadgeProps {
  status: string;
}
