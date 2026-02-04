import { useState, useEffect } from 'react';

/**
 * Hook to fetch and cache user email for test email modals.
 * Caches in localStorage to avoid repeated API calls.
 */
export function useUserEmail() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUserEmail() {
      // Check cache first
      const cachedEmail = localStorage.getItem(
        'fwd_user_email',
      );
      if (cachedEmail) {
        setUserEmail(cachedEmail);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.data.profile.email) {
          const email = data.data.profile.email;
          setUserEmail(email);
          localStorage.setItem('fwd_user_email', email);
        }
      } catch {
        // Silently fail, user can type email manually
      }
      setLoading(false);
    }

    fetchUserEmail();
  }, []);

  return { userEmail, loading };
}
