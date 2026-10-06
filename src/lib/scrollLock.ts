/**
 * One owner for "freeze the page behind this overlay".
 *
 * The drawer, the lightbox and the hidden rooms used to each set
 * `body.style.overflow` and put back whatever they had read — so two of them
 * open at once (a room over a drawer, a lightbox inside a drawer) could leave
 * the page frozen or unfrozen at the wrong moment. Locks are counted here.
 *
 * Hiding the scrollbar also used to narrow-then-widen the whole document by
 * its width, reflowing every section of the page behind the overlay at the
 * moment it opened. The gap is padded back so nothing moves.
 */

let locks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

export function lockScroll(): () => void {
  if (typeof document === 'undefined') return () => {};
  const body = document.body;
  if (locks === 0) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0 && saved) {
      body.style.overflow = saved.overflow;
      body.style.paddingRight = saved.paddingRight;
      saved = null;
    }
  };
}
