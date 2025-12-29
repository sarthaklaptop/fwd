export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface ApiKeysSectionProps {
  initialKeys: ApiKey[];
}

export interface KeysTableProps {
  keys: ApiKey[];
  onRevoke: (key: ApiKey) => void;
}

export interface StatusBadgeProps {
  isRevoked: boolean;
}

export interface NewKeyModalProps {
  newKey: string;
  onClose: () => void;
}
