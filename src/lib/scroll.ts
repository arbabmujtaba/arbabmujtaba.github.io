export function resetAllScrolls(): void {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.custom-scrollbar').forEach((el) => {
      el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }
}
