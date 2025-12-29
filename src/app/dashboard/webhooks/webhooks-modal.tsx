'use client';

import { useState } from 'react';
import { Webhook, Check } from 'lucide-react';
import type { WebhookModalProps } from './webhooks-types';
import { AVAILABLE_EVENTS } from './webhooks-types';

export function WebhookModal({
  isOpen,
  loading,
  onClose,
  onSave,
}: WebhookModalProps) {
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<
    string[]
  >([]);

  if (!isOpen) return null;

  const toggleEvent = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(
        selectedEvents.filter((e) => e !== eventId)
      );
    } else {
      setSelectedEvents([...selectedEvents, eventId]);
    }
  };

  const handleSave = () => {
    onSave(url, selectedEvents);
    setUrl('');
    setSelectedEvents([]);
  };

  const handleClose = () => {
    setUrl('');
    setSelectedEvents([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border p-6 rounded-xl max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Webhook className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Add Webhook Endpoint
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Endpoint URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.your-app.com/webhooks/email"
              className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Events to Subscribe
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {AVAILABLE_EVENTS.map((event) => (
                <div
                  key={event.id}
                  onClick={() => toggleEvent(event.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedEvents.includes(event.id)
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-transparent border-border hover:border-primary/30'
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      selectedEvents.includes(event.id)
                        ? 'text-primary'
                        : 'text-foreground'
                    }`}
                  >
                    {event.label}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedEvents.includes(event.id)
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {selectedEvents.includes(event.id) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={
              loading ||
              !url.trim() ||
              selectedEvents.length === 0
            }
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              'Add Endpoint'
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2.5 bg-transparent hover:bg-primary/10 text-foreground font-medium rounded-lg border border-border hover:border-primary/30 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
