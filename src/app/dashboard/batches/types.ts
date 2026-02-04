// Types for campaign modal and related components

// Re-export Template from templates-types (single source of truth)
export type { Template } from '../templates/templates-types';

export interface Domain {
  id: string;
  domain: string;
  status: string;
}

export interface Recipient {
  to: string;
  variables?: Record<string, string>;
}

export interface DuplicateFromData {
  templateId: string;
  fromEmail: string;
  batchId: string;
}

export interface CreateCampaignModalProps {
  isOpen: boolean;
  duplicateFrom?: DuplicateFromData | null;
  onClose: () => void;
  onSuccess: () => void;
}
