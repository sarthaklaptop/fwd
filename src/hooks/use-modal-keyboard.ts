import { useEffect, useCallback } from 'react';

interface UseModalKeyboardOptions {
  onClose: () => void;
  onSubmit?: () => void;
  isOpen?: boolean;
  submitDisabled?: boolean;
}

export function useModalKeyboard({
  onClose,
  onSubmit,
  isOpen = true,
  submitDisabled = false,
}: UseModalKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === 'Enter' &&
        onSubmit &&
        !submitDisabled
      ) {
        e.preventDefault();
        onSubmit();
      }
    },
    [isOpen, onClose, onSubmit, submitDisabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () =>
      window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
