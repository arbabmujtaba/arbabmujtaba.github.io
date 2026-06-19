/**
 * LiveEditor
 *
 * Full-featured live click-based editing view. Shows the website in an iframe
 * and allows clicking any element to identify and edit the underlying content.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MousePointerClick, Eye, Monitor, Tablet, Smartphone, RefreshCw,
  Save, Sparkles, X, Type, Image, FileText, Loader2, ChevronDown,
  Crosshair, Layers, ExternalLink, Zap
} from 'lucide-react';
import { getLiveEditBridgeScript } from '../lib/liveEditBridge';
import { mapElementToContent, type ClickedElementPayload, type MappedElement, type ContentItem } from '../lib/elementMapper';

// Types
interface CMSItem {
  collection: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  featured?: boolean;
  coverImage?: string;
  excerpt?: string;
  filePath?: string;
  state?: 'draft' | 'review' | 'published' | 'archived';
  unsavedChanges?: boolean;
  publishedAt?: string;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_CONFIGS: Record<ViewportMode, { width: number; label: string }> = {
  desktop: { width: 1440, label: 'Desktop' },
  tablet: { width: 768, label: 'Tablet' },
  mobile: { width: 375, label: 'Mobile' },
};

const PAGE_OPTIONS = [
  { value: '/', label: 'Home' },
  { value: '/journal', label: 'Journal' },
  { value: '/tech', label: 'Tech' },
  { value: '/photography', label: 'Photography' },
  { value: '/portfolio', label: 'Portfolio' },
  { value: '/collection', label: 'Collection' },
];

interface LiveEditorProps {
  content: CMSItem[];
  onNavigateToEditor: (item: CMSItem) => void;
  onToast: (type: string, msg: string) => void;
}

export default function LiveEditor({ content, onNavigateToEditor, onToast }: LiveEditorProps) {
  // State
  const [currentPage, setCurrentPage] = useState('/');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [editMode, setEditMode] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [bridgeReady, setBridgeReady] = useState(false);

  // Selection state
  const [selectedPayload, setSelectedPayload] = useState<ClickedElementPayload | null>(null);
  const [mappedElement, setMappedElement] = useState<MappedElement | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Server connectivity state
  const [serverAvailable, setServerAvailable] = useState(true);

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Convert CMSItems to ContentItems for the mapper
  const contentItems: ContentItem[] = content.map(item => ({
    collection: item.collection,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    coverImage: item.coverImage,
    category: item.category,
  }));

  // Health check: verify the dev server API is available on mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('/api/content');
        if (!res.ok) {
          setServerAvailable(false);
        } else {
          setServerAvailable(true);
        }
      } catch {
        setServerAvailable(false);
      }
    };
    checkServer();
  }, []);

  // Inject bridge script into iframe
  const injectBridge = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Check if already injected
      if (iframeDoc.getElementById('__live-edit-bridge-script__')) {
        // Re-activate if edit mode is on
        if (editMode) {
          iframe.contentWindow?.postMessage({ type: 'activate-edit-mode' }, '*');
        }
        return;
      }

      const script = iframeDoc.createElement('script');
      script.id = '__live-edit-bridge-script__';
      script.textContent = getLiveEditBridgeScript();
      iframeDoc.body.appendChild(script);
    } catch (err) {
      console.error('Failed to inject bridge script:', err);
    }
  }, [editMode]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIframeLoading(false);
    setBridgeReady(false);
    // Inject bridge after a short delay to ensure DOM is ready
    setTimeout(() => {
      injectBridge();
    }, 300);
  };

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin to prevent cross-origin message injection
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== 'object') return;

      switch (event.data.type) {
        case 'bridge-ready':
          setBridgeReady(true);
          if (editMode) {
            iframeRef.current?.contentWindow?.postMessage({ type: 'activate-edit-mode' }, '*');
          }
          break;
        case 'element-clicked':
          handleElementClicked(event.data.payload);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [editMode, contentItems]);

  // Handle element click from iframe
  const handleElementClicked = (payload: ClickedElementPayload) => {
    setSelectedPayload(payload);
    const mapped = mapElementToContent(payload, contentItems);
    setMappedElement(mapped);
    if (mapped) {
      setEditValue(mapped.currentValue);
    } else {
      setEditValue(payload.textContent);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    const newMode = !editMode;
    setEditMode(newMode);
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: newMode ? 'activate-edit-mode' : 'deactivate-edit-mode' },
        '*'
      );
    }
    if (!newMode) {
      setSelectedPayload(null);
      setMappedElement(null);
      setEditValue('');
    }
  };

  // Navigate to a page
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setSelectedPayload(null);
    setMappedElement(null);
    setEditValue('');
    setIframeLoading(true);
    setBridgeReady(false);
    setIframeKey(k => k + 1);
  };

  // Refresh iframe
  const handleRefresh = () => {
    setIframeLoading(true);
    setBridgeReady(false);
    setIframeKey(k => k + 1);
  };

  // Change viewport
  const handleViewportChange = (mode: ViewportMode) => {
    setViewportMode(mode);
  };

  // Save changes
  const handleSave = async () => {
    if (!mappedElement) return;

    // Prevent saving when field type is unknown - no meaningful update can be made
    if (mappedElement.field === 'unknown') {
      onToast('error', 'Cannot save: field type is unknown. Try clicking directly on a heading, paragraph, or image.');
      return;
    }

    setIsSaving(true);

    try {
      // NOTE: This save flow has a known read-modify-write race condition.
      // If two fields of the same content item are edited in quick succession,
      // the second save may overwrite the first because it fetched stale data
      // before the first PUT landed. A field-level PATCH endpoint or optimistic
      // locking would resolve this, but is acceptable for single-user editing.
      const res = await fetch(`/api/content/${mappedElement.collection}/${mappedElement.slug}`);
      if (!res.ok) throw new Error('Failed to fetch content');
      const doc = await res.json();

      // Update the specific field
      const updatedData = { ...doc.data };
      if (mappedElement.field === 'title') {
        updatedData.title = editValue;
      } else if (mappedElement.field === 'excerpt') {
        updatedData.excerpt = editValue;
      } else if (mappedElement.field === 'coverImage') {
        updatedData.coverImage = editValue;
      }

      const body = mappedElement.field === 'body' ? editValue : doc.body;

      const saveRes = await fetch(`/api/content/${mappedElement.collection}/${mappedElement.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: mappedElement.collection,
          slug: mappedElement.slug,
          data: updatedData,
          body: body,
        }),
      });

      if (!saveRes.ok) throw new Error('Failed to save');

      onToast('success', `Updated ${mappedElement.field} for "${updatedData.title || mappedElement.slug}"`);
      // Refresh iframe to reflect changes
      setTimeout(() => handleRefresh(), 500);
    } catch (err) {
      console.error('Save error:', err);
      onToast('error', 'Failed to save changes. Make sure the dev server is running.');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/publish', { method: 'POST' });
      if (!res.ok) throw new Error('Publish failed');
      const data = await res.json();
      onToast('success', data.message || 'Published successfully!');
    } catch (err) {
      console.error('Publish error:', err);
      onToast('error', 'Failed to publish. Check server connection.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Open in full editor
  const handleOpenInEditor = () => {
    if (!mappedElement) return;
    const item = content.find(
      c => c.collection === mappedElement.collection && c.slug === mappedElement.slug
    );
    if (item) {
      onNavigateToEditor(item);
    }
  };

  // Get field icon
  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'title': return <Type className="w-3.5 h-3.5" />;
      case 'coverImage': return <Image className="w-3.5 h-3.5" />;
      case 'body': return <FileText className="w-3.5 h-3.5" />;
      case 'excerpt': return <FileText className="w-3.5 h-3.5" />;
      default: return <Layers className="w-3.5 h-3.5" />;
    }
  };

  const config = VIEWPORT_CONFIGS[viewportMode];

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="border-b border-zinc-900 bg-zinc-950/80 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Page Selector */}
          <div className="relative">
            <select
              value={currentPage}
              onChange={(e) => handlePageChange(e.target.value)}
              className="appearance-none bg-zinc-900/60 border border-zinc-800 text-zinc-300 font-sans text-xs pl-3 pr-8 py-1.5 rounded-sm focus:outline-none focus:border-orange-500/40 cursor-pointer"
            >
              {PAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
          </div>

          {/* Edit Mode Toggle */}
          <button
            onClick={toggleEditMode}
            className={`px-3 py-1.5 rounded-sm font-sans text-xs flex items-center gap-2 transition-all cursor-pointer ${
              editMode
                ? 'bg-orange-500/15 border border-orange-500/40 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.1)]'
                : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            {editMode ? 'Editing Active' : 'Click to Edit'}
          </button>
        </div>

        {/* Viewport Controls */}
        <div className="flex items-center gap-1.5">
          {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map((m) => {
            const Icon = m === 'desktop' ? Monitor : m === 'tablet' ? Tablet : Smartphone;
            return (
              <button
                key={m}
                onClick={() => handleViewportChange(m)}
                className={`px-2 py-1.5 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewportMode === m
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'text-zinc-500 hover:text-zinc-200 border border-transparent hover:bg-zinc-900'
                }`}
                title={VIEWPORT_CONFIGS[m].label}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}

          <button
            onClick={handleRefresh}
            className="ml-2 p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-sm transition-all cursor-pointer"
            title="Refresh Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Status indicators */}
          <div className="ml-3 flex items-center gap-2">
            {editMode && (
              <span className={`flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest ${bridgeReady ? 'text-emerald-500' : 'text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${bridgeReady ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                {bridgeReady ? 'Connected' : 'Connecting'}
              </span>
            )}
            <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
              {config.width}px
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex overflow-hidden">
        {/* Server unavailable banner */}
        {!serverAvailable && (
          <div className="absolute top-[49px] left-0 right-0 z-20 bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2">
            <span className="font-sans text-xs text-amber-400">
              Live editing requires the local development server. Start it with <code className="font-mono bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-300">npm run dev</code>.
            </span>
          </div>
        )}
        {/* Left: Iframe Panel */}
        <div className="flex-grow flex items-start justify-center overflow-auto bg-zinc-950/30 p-4 custom-scrollbar">
          <motion.div
            key={`${viewportMode}-${iframeKey}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0"
            style={{
              width: viewportMode === 'desktop' ? '100%' : config.width,
              maxWidth: config.width,
              height: '100%',
              minHeight: 600,
            }}
          >
            <div
              className="w-full h-full bg-[#0a0a09] border border-zinc-900 shadow-2xl shadow-black/50 overflow-hidden rounded-sm"
            >
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a09] z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Loading site...</span>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={iframeKey}
                title="Live Site Preview"
                src={currentPage}
                className="w-full h-full border-0"
                style={{ minHeight: 600 }}
                onLoad={handleIframeLoad}
              />
            </div>
          </motion.div>
        </div>

        {/* Right: Editing Panel */}
        <div className="w-[340px] shrink-0 border-l border-zinc-900 bg-zinc-950/60 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {!editMode ? (
              <motion.div
                key="inactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow flex items-center justify-center p-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center">
                    <MousePointerClick className="w-7 h-7 text-zinc-600" />
                  </div>
                  <p className="font-sans text-sm text-zinc-500 font-light leading-relaxed mb-2">
                    Enable edit mode to start
                  </p>
                  <p className="font-sans text-xs text-zinc-600 leading-relaxed">
                    Click the "Click to Edit" button above, then click any element on the page to identify and edit its content.
                  </p>
                </div>
              </motion.div>
            ) : !selectedPayload ? (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow flex items-center justify-center p-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Crosshair className="w-7 h-7 text-orange-500 animate-pulse" />
                  </div>
                  <p className="font-sans text-sm text-zinc-300 font-light leading-relaxed mb-2">
                    Click on any element
                  </p>
                  <p className="font-sans text-xs text-zinc-500 leading-relaxed">
                    Hover over elements in the preview to highlight them. Click to select and edit the content.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="selected"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-grow flex flex-col overflow-hidden"
              >
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-orange-500" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">
                      Element Inspector
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPayload(null);
                      setMappedElement(null);
                      setEditValue('');
                    }}
                    className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-sm transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {/* Element Info */}
                  <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-sm p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded uppercase">
                        {selectedPayload.tagName}
                      </span>
                      {selectedPayload.sectionId && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                          #{selectedPayload.sectionId}
                        </span>
                      )}
                    </div>
                    {selectedPayload.textContent && (
                      <p className="font-sans text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                        "{selectedPayload.textContent.slice(0, 100)}{selectedPayload.textContent.length > 100 ? '...' : ''}"
                      </p>
                    )}
                  </div>

                  {/* Mapped Content */}
                  {mappedElement ? (
                    <div className="space-y-3">
                      {/* Content Identification */}
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-sm p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-sans text-xs text-emerald-400 font-medium">Content Identified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded uppercase tracking-wider">
                            {mappedElement.collection}
                          </span>
                          <span className="font-sans text-xs text-zinc-300 truncate">
                            {content.find(c => c.slug === mappedElement.slug)?.title || mappedElement.slug}
                          </span>
                        </div>
                      </div>

                      {/* Edit Field */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getFieldIcon(mappedElement.field)}
                          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                            {mappedElement.field}
                          </span>
                        </div>
                        {mappedElement.field === 'unknown' && (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm p-2">
                            <p className="font-sans text-[11px] text-amber-400 leading-relaxed">
                              This field type could not be determined. Saving is disabled. Try clicking directly on a title, paragraph, or image.
                            </p>
                          </div>
                        )}
                        {mappedElement.field === 'coverImage' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-200 font-mono text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-orange-500/40 transition-colors"
                            placeholder="Image path..."
                          />
                        ) : mappedElement.field === 'body' ? (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            rows={8}
                            className="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-200 font-sans text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-orange-500/40 transition-colors resize-none custom-scrollbar"
                            placeholder="Content body..."
                          />
                        ) : (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            rows={3}
                            className="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-200 font-sans text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-orange-500/40 transition-colors resize-none custom-scrollbar"
                            placeholder={`Edit ${mappedElement.field}...`}
                          />
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving || !serverAvailable || mappedElement.field === 'unknown'}
                          className="w-full px-3 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all rounded-sm font-sans text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={handleOpenInEditor}
                            className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all rounded-sm font-sans text-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Full Editor
                          </button>
                          <button
                            onClick={handlePublish}
                            disabled={isPublishing || !serverAvailable}
                            className="flex-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all rounded-sm font-sans text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isPublishing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                            Publish
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Unmapped element */
                    <div className="space-y-3">
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-sans text-xs text-amber-400 font-medium">Element Not Mapped</span>
                        </div>
                        <p className="font-sans text-[11px] text-zinc-500 leading-relaxed">
                          This element could not be mapped to a specific content item. Try clicking directly on a heading, paragraph text, or image.
                        </p>
                      </div>

                      {/* Show raw text for reference */}
                      {selectedPayload.textContent && (
                        <div className="space-y-2">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                            Raw Text Content
                          </span>
                          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-sm p-3">
                            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                              {selectedPayload.textContent.slice(0, 200)}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedPayload.nearestHeading && (
                        <div className="space-y-2">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                            Nearest Heading
                          </span>
                          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-sm p-3">
                            <p className="font-sans text-xs text-zinc-300">
                              {selectedPayload.nearestHeading}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
