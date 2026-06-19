/**
 * liveEditBridge.ts
 *
 * Returns a JavaScript string to be injected into the live editing iframe.
 * When activated, this script:
 * - Adds hover highlights (subtle outline) on elements
 * - Captures click events and sends element details to the parent via postMessage
 * - Listens for activate/deactivate messages from the parent window
 */

export function getLiveEditBridgeScript(): string {
  return `
(function() {
  let isActive = false;
  let styleEl = null;
  let selectedEl = null;

  const STYLE_ID = '__live-edit-bridge-styles__';
  const HIGHLIGHT_CLASS = '__live-edit-hover__';
  const SELECTED_CLASS = '__live-edit-selected__';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = \`
      .\${HIGHLIGHT_CLASS} {
        outline: 2px solid rgba(59, 130, 246, 0.5) !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
        transition: outline 0.15s ease;
      }
      .\${SELECTED_CLASS} {
        outline: 2px solid rgba(249, 115, 22, 0.8) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.15) !important;
      }
      * { cursor: pointer !important; }
    \`;
    document.head.appendChild(styleEl);
  }

  function removeStyles() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
    styleEl = null;
  }

  function getNearestHeading(el) {
    let current = el;
    while (current && current !== document.body) {
      if (/^H[1-3]$/.test(current.tagName)) {
        return current.textContent.trim();
      }
      current = current.parentElement;
    }
    // Check preceding siblings
    current = el;
    while (current && current !== document.body) {
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (/^H[1-3]$/.test(sibling.tagName)) {
          return sibling.textContent.trim();
        }
        sibling = sibling.previousElementSibling;
      }
      current = current.parentElement;
    }
    return '';
  }

  function getSectionId(el) {
    let current = el;
    while (current && current !== document.body) {
      if (current.id) return current.id;
      current = current.parentElement;
    }
    return '';
  }

  function handleMouseOver(e) {
    if (!isActive) return;
    const target = e.target;
    if (target === document.body || target === document.documentElement) return;
    target.classList.add(HIGHLIGHT_CLASS);
  }

  function handleMouseOut(e) {
    if (!isActive) return;
    e.target.classList.remove(HIGHLIGHT_CLASS);
  }

  function handleClick(e) {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;

    // Remove previous selection highlight
    if (selectedEl) {
      selectedEl.classList.remove(SELECTED_CLASS);
    }
    target.classList.remove(HIGHLIGHT_CLASS);
    target.classList.add(SELECTED_CLASS);
    selectedEl = target;

    const payload = {
      tagName: target.tagName,
      textContent: (target.textContent || '').trim().slice(0, 200),
      src: target.src || target.querySelector('img')?.src || '',
      href: target.href || target.closest('a')?.href || '',
      classList: Array.from(target.classList).filter(c => !c.startsWith('__live-edit')),
      nearestHeading: getNearestHeading(target),
      sectionId: getSectionId(target),
      pageUrl: window.location.pathname
    };

    window.parent.postMessage({ type: 'element-clicked', payload: payload }, '*');
  }

  function activate() {
    if (isActive) return;
    isActive = true;
    injectStyles();
    document.body.addEventListener('mouseover', handleMouseOver, true);
    document.body.addEventListener('mouseout', handleMouseOut, true);
    document.body.addEventListener('click', handleClick, true);
  }

  function deactivate() {
    if (!isActive) return;
    isActive = false;
    removeStyles();
    document.body.removeEventListener('mouseover', handleMouseOver, true);
    document.body.removeEventListener('mouseout', handleMouseOut, true);
    document.body.removeEventListener('click', handleClick, true);
    // Clean up classes
    document.querySelectorAll('.' + HIGHLIGHT_CLASS).forEach(el => el.classList.remove(HIGHLIGHT_CLASS));
    document.querySelectorAll('.' + SELECTED_CLASS).forEach(el => el.classList.remove(SELECTED_CLASS));
    selectedEl = null;
  }

  // Listen for messages from parent
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'activate-edit-mode') {
      activate();
    } else if (event.data && event.data.type === 'deactivate-edit-mode') {
      deactivate();
    }
  });

  // Notify parent that bridge is ready
  window.parent.postMessage({ type: 'bridge-ready' }, '*');
})();
`;
}
