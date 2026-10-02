import { useEffect, useRef } from 'react';
import { useMagic } from '../../lib/magic';

/**
 * The mark at the end of a journal volume. Reaching it — actually reading to
 * the last line, not opening the page — is how the quill is found.
 */
export default function EndOfVolume() {
  const ref = useRef<HTMLDivElement>(null);
  const { collect } = useMagic();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          collect('quill');
          observer.disconnect();
        }
      },
      { threshold: 1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [collect]);

  return (
    <div ref={ref} className="mt-16 pb-4 text-center">
      <div className="fleuron mx-auto max-w-xs text-sm text-accent" aria-hidden="true">
        ❦
      </div>
      <p className="mt-4 font-book text-lg italic text-zinc-400">end of the volume</p>
    </div>
  );
}
