'use client';

import { useEffect, useRef } from 'react';

interface UseCommandPaletteOptions {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function useCommandPaletteKeyboard({
  isOpen,
  onOpen,
  onClose,
}: UseCommandPaletteOptions) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd+K / Ctrl+K to toggle
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === 'k'
      ) {
        event.preventDefault();
        event.stopPropagation();
        if (isOpen) {
          onClose();
        } else {
          previousFocusRef.current =
            document.activeElement as HTMLElement;
          onOpen();
        }
        return;
      }

      // Escape to close
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
      true
    );
    return () =>
      document.removeEventListener(
        'keydown',
        handleKeyDown,
        true
      );
  }, [isOpen, onOpen, onClose]);

  // Restore focus when closing
  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      const timer = setTimeout(() => {
        previousFocusRef.current?.focus();
        previousFocusRef.current = null;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return { previousFocusRef };
}
