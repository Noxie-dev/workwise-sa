import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 520);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#102a47] text-white shadow-lg transition hover:bg-[#183e67] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c94c] focus-visible:ring-offset-2"
      aria-label="Scroll back to top"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
