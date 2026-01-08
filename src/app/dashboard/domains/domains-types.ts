import { Domain } from '@/db/schema';

export interface DomainWithTokens
  extends Omit<Domain, 'dkimTokens'> {
  dkimTokens: string[];
}

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

export interface DomainsSectionProps {
  initialDomains: DomainWithTokens[];
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'verified':
      return 'bg-green-500/20 text-green-500';
    case 'verifying':
      return 'bg-yellow-500/20 text-yellow-500';
    case 'failed':
      return 'bg-red-500/20 text-red-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'verifying':
      return 'Verifying...';
    case 'failed':
      return 'Failed';
    default:
      return 'Pending';
  }
};
