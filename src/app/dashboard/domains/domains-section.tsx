'use client';

import { useState } from 'react';
import { Globe, Plus, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { DomainCard } from './domains-card';
import { AddDomainModal } from './domains-modal';
import {
  DomainWithTokens,
  DomainsSectionProps,
} from './domains-types';

export default function DomainsSection({
  initialDomains,
}: DomainsSectionProps) {
  const [domains, setDomains] =
    useState<DomainWithTokens[]>(initialDomains);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddDomain = async (domain: string) => {
    setLoading(true);

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const response = await res.json();

      if (response.success) {
        setDomains([response.data, ...domains]);
        setShowModal(false);
        toast.success(
          response.message || 'Domain added successfully'
        );
      } else {
        toast.error(
          response.error || 'Failed to add domain'
        );
      }
    } catch (error) {
      toast.error('Failed to add domain');
    }

    setLoading(false);
  };

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/domains/${id}/verify`, {
        method: 'POST',
      });

      const response = await res.json();

      if (response.success) {
        setDomains(
          domains.map((d) =>
            d.id === id
              ? { ...d, status: response.status }
              : d
          )
        );

        if (response.verified) {
          toast.success('Domain verified successfully!');
        } else {
          toast(response.message, {
            icon:
              response.status === 'verifying' ? '⏳' : '⚠️',
          });
        }
      } else {
        toast.error(
          response.error || 'Verification failed'
        );
      }
    } catch (error) {
      toast.error('Verification failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/domains/${id}`, {
        method: 'DELETE',
      });

      const response = await res.json();

      if (response.success) {
        setDomains(domains.filter((d) => d.id !== id));
        toast.success('Domain deleted');
      } else {
        toast.error(
          response.error || 'Failed to delete domain'
        );
      }
    } catch (error) {
      toast.error('Failed to delete domain');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {
              domains.filter((d) => d.status === 'verified')
                .length
            }{' '}
            verified
          </span>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </Button>
      </div>

      {domains.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-xl text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No custom domains yet
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Add a custom domain to send emails from your own
            address like{' '}
            <code className="text-primary">
              newsletter@yourdomain.com
            </code>
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Your First Domain
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onVerify={handleVerify}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddDomainModal
        isOpen={showModal}
        loading={loading}
        onClose={() => setShowModal(false)}
        onSave={handleAddDomain}
      />
    </div>
  );
}
