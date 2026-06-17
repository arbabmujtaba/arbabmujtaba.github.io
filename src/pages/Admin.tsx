import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Edit3, Trash2, ChevronLeft, Save, Sparkles, 
  UploadCloud, Check, FileText, Calendar, Tag, Layers, 
  Settings, Eye, Terminal, Globe, Github, Info, AlertTriangle, 
  Filter, Award, Loader2, ArrowUpRight, Archive, RotateCcw, Rocket, Activity
} from 'lucide-react';
import Markdown from 'react-markdown';
import SafeImage from '../components/SafeImage';
import { normalizeImagePath } from '../lib/image';
import PreviewFrame from '../components/PreviewFrame';
import DeploymentCenter from '../components/DeploymentCenter';
import PublishingModal from '../components/PublishingModal';
import { ToastContainer, type ToastItem } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import ActivityFeed from '../components/ActivityFeed';

// Define localized types for form handling
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

export default function Admin({ setView }: { setView: (v: string) => void }) {
  // Navigation & State management
  const [viewState, setViewState] = useState<'list' | 'editor' | 'deployment'>('list');
  const [allContent, setAllContent] = useState<CMSItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCollection, setFilterCollection] = useState('all');
  const [filterState, setFilterState] = useState<string>('all');
  
  // Editor state
  const [activeCollection, setActiveCollection] = useState<string>('journal');
  const [isEditing, setIsEditing] = useState(false);
  const [originalSlug, setOriginalSlug] = useState('');
  
  // Editor form inputs state
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formBody, setFormBody] = useState('');
  
  // Portfolio exclusive fields
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [featuredProject, setFeaturedProject] = useState(false);

  // Status indicators
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [draftAlert, setDraftAlert] = useState(false);
  const [lastDraftTime, setLastDraftTime] = useState<string | null>(null);

  // Publishing modal state
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishJobId, setPublishJobId] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (type: ToastItem['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, type, message }]);
  };
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Drag and drop areas
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Retrieve current system parameters depending on Collection Type Selected
  const collectionOptions = [
    { value: 'journal', label: 'Journal' },
    { value: 'tech', label: 'Tech Logs' },
    { value: 'photography', label: 'Photography' },
    { value: 'collection', label: 'Museum Collection' },
    { value: 'portfolio', label: 'Portfolio Project' }
  ];

  const categoryOptionsMap: Record<string, string[]> = {
    journal: ['Life', 'People', 'Travel', 'Thoughts', 'Milestones'],
    tech: ['Linux', 'Networking', 'Programming', 'Build Logs', 'Experiments', 'Tech News', 'Things I Like'],
    photography: ['Favorites', 'Life', 'Connected', 'Travel', 'Behind The Shot', 'Gear'],
    collection: ['Uses', 'Music', 'Books', 'Gear', 'Timeline', 'Inspirations', 'Favorites'],
    portfolio: ['Web Development', 'Systems', 'Embedded & DSP', 'Audio Engineering', 'Design', 'Other']
  };

  // Run dynamic fetch to load recent items from API
  const loadContent = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const data = await res.json();
        setAllContent(data);
      } else {
        console.error('Failed to load dynamic contents from Express backend APIs');
      }
    } catch (err) {
      console.error('Local Express Dev server not active or failed to respond:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Filter content matching queries
  const processedContent = useMemo(() => {
    return allContent.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.excerpt && item.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCollection = filterCollection === 'all' || item.collection === filterCollection;
      const matchesState = filterState === 'all' || item.state === filterState;
      return matchesSearch && matchesCollection && matchesState;
    });
  }, [allContent, searchQuery, filterCollection, filterState]);

  // Handle active field alterations
  const handleCollectionChange = (newVal: string) => {
    setActiveCollection(newVal);
    // Fill categories dynamically with sensible baseline
    const cats = categoryOptionsMap[newVal] || [];
    setFormCategory(cats[0] || '');
  };

  // Draft saver triggers
  const getDraftKey = (col: string) => `cms_draft_${col}`;

  // Automatically check for existing drafts on collection updates
  useEffect(() => {
    if (viewState === 'editor') {
      const draftKey = getDraftKey(activeCollection);
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setLastDraftTime(parsed.savedAt ? new Date(parsed.savedAt).toLocaleTimeString() : 'Recently');
          setDraftAlert(true);
        } catch (e) {
          localStorage.removeItem(draftKey);
        }
      } else {
        setDraftAlert(false);
      }
    }
  }, [activeCollection, viewState]);

  // Synchronize dynamic updates back to LocalStorage drafts
  const saveLocalDraft = () => {
    const draftPayload = {
      title: formTitle,
      slug: formSlug,
      category: formCategory,
      date: formDate,
      coverImage: formCoverImage,
      galleryImages,
      excerpt: formExcerpt,
      body: formBody,
      techStack,
      githubLink,
      liveLink,
      featuredProject,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(getDraftKey(activeCollection), JSON.stringify(draftPayload));
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 1500);
  };

  const loadLocalDraft = () => {
    const draftKey = getDraftKey(activeCollection);
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormTitle(parsed.title || '');
        setFormSlug(parsed.slug || '');
        setFormCategory(parsed.category || '');
        setFormDate(parsed.date || '');
        setFormCoverImage(parsed.coverImage || '');
        setGalleryImages(parsed.galleryImages || []);
        setFormExcerpt(parsed.excerpt || '');
        setFormBody(parsed.body || '');
        setTechStack(parsed.techStack || []);
        setGithubLink(parsed.githubLink || '');
        setLiveLink(parsed.liveLink || '');
        setFeaturedProject(!!parsed.featuredProject);
        setDraftAlert(false);
      } catch (e) {
        console.error('Error loading draft data', e);
      }
    }
  };

  const clearLocalDraft = () => {
    localStorage.removeItem(getDraftKey(activeCollection));
    setDraftAlert(false);
  };

  // Save changes directly back into filesystem using live backend
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const serialData: Record<string, any> = {
        title: formTitle,
        category: formCategory,
        date: formDate || new Date().toISOString().split('T')[0],
        excerpt: formExcerpt || ''
      };

      // Add collection-specific fields
      if (activeCollection === 'portfolio') {
        serialData.projectImage = formCoverImage;
        serialData.techStack = techStack;
        serialData.githubLink = githubLink;
        serialData.liveLink = liveLink;
        serialData.featured = featuredProject;
        serialData.description = formExcerpt;
      } else if (activeCollection === 'photography') {
        serialData.coverImage = formCoverImage;
        serialData.galleryImages = galleryImages;
        serialData.description = formExcerpt;
      } else {
        serialData.coverImage = formCoverImage;
      }

      const payload = {
        collection: activeCollection,
        slug: isEditing ? originalSlug : formSlug,
        newSlug: formSlug,
        data: serialData,
        body: formBody
      };

      const endpoint = isEditing ? '/api/content' : '/api/content';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSaveStatus('success');
        clearLocalDraft();
        await loadContent();
        
        // Return back to lists cleanly
        setTimeout(() => {
          setViewState('list');
          setSaveStatus('idle');
          resetFormFields();
        }, 1200);
      } else {
        setSaveStatus('error');
        setErrorMessage(result.error || 'Check error logs in terminal.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err.message || 'Express API is offline.');
    }
  };

  // Reset inputs
  const resetFormFields = () => {
    setFormTitle('');
    setFormSlug('');
    setFormCategory(categoryOptionsMap[activeCollection]?.[0] || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCoverImage('');
    setGalleryImages([]);
    setFormExcerpt('');
    setFormBody('');
    setTechStack([]);
    setTechInput('');
    setGithubLink('');
    setLiveLink('');
    setFeaturedProject(false);
    setIsEditing(false);
    setOriginalSlug('');
    setErrorMessage('');
  };

  // Create workspace trigger
  const handleCreateNew = () => {
    resetFormFields();
    setViewState('editor');
  };

  // Populate editor session
  const handleEditClick = async (item: CMSItem) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/content/${item.collection}/${item.slug}`);
      if (res.ok) {
        const doc = await res.json();
        setActiveCollection(doc.collection);
        setIsEditing(true);
        setOriginalSlug(doc.slug);
        
        setFormTitle(doc.data.title || '');
        setFormSlug(doc.slug || '');
        setFormCategory(doc.data.category || doc.data.category || '');
        setFormDate(doc.data.date || '');
        setFormCoverImage(doc.data.coverImage || doc.data.projectImage || '');
        setFormExcerpt(doc.data.excerpt || doc.data.description || '');
        setFormBody(doc.body || '');

        // Load custom fields
        if (doc.collection === 'portfolio') {
          // Normalize portfolio arrays
          const stack = Array.isArray(doc.data.techStack) 
            ? doc.data.techStack.map((t: any) => typeof t === 'string' ? t : Object.values(t)[0])
            : [];
          setTechStack(stack);
          setGithubLink(doc.data.githubLink || '');
          setLiveLink(doc.data.liveLink || '');
          setFeaturedProject(!!doc.data.featured);
        } else if (doc.collection === 'photography') {
          const gallery = Array.isArray(doc.data.galleryImages)
            ? doc.data.galleryImages.map((g: any) => typeof g === 'string' ? g : Object.values(g)[0])
            : [];
          setGalleryImages(gallery);
        }

        setViewState('editor');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove elements from the system
  const handleDeleteClick = async (item: CMSItem) => {
    if (!confirm(`Are you sure you want to delete the file "${item.title}"?\nThis cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch('/api/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: item.collection, slug: item.slug })
      });

      if (res.ok) {
        await loadContent();
      } else {
        alert('Could not delete the file. Refer to Express terminal logs.');
      }
    } catch (e) {
      alert('Local API server is disconnected.');
    }
  };

  // Transition content state
  const handleStateTransition = async (item: CMSItem, newState: string) => {
    try {
      const res = await fetch(`/api/content/${item.collection}/${item.slug}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });

      if (res.ok) {
        await loadContent();
      } else {
        const err = await res.json();
        alert(err.error || 'State transition failed');
      }
    } catch (e) {
      alert('Local API server is disconnected.');
    }
  };

  // Full publish: save + trigger publishing pipeline
  const handleFullPublish = async () => {
    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const serialData: Record<string, any> = {
        title: formTitle,
        category: formCategory,
        date: formDate || new Date().toISOString().split('T')[0],
        excerpt: formExcerpt || ''
      };

      if (activeCollection === 'portfolio') {
        serialData.projectImage = formCoverImage;
        serialData.techStack = techStack;
        serialData.githubLink = githubLink;
        serialData.liveLink = liveLink;
        serialData.featured = featuredProject;
        serialData.description = formExcerpt;
      } else if (activeCollection === 'photography') {
        serialData.coverImage = formCoverImage;
        serialData.galleryImages = galleryImages;
        serialData.description = formExcerpt;
      } else {
        serialData.coverImage = formCoverImage;
      }

      // Step 1: Save content
      const payload = {
        collection: activeCollection,
        slug: isEditing ? originalSlug : formSlug,
        newSlug: formSlug,
        data: serialData,
        body: formBody
      };

      const method = isEditing ? 'PUT' : 'POST';
      const saveRes = await fetch('/api/content', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || 'Failed to save content');
      }

      // Step 2: Trigger publishing pipeline
      const publishRes = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: activeCollection,
          slug: formSlug,
          title: formTitle,
          body: formBody,
          frontmatter: serialData,
        })
      });

      const publishData = await publishRes.json();
      if (!publishRes.ok || !publishData.success) {
        throw new Error(publishData.error || 'Publishing failed');
      }

      setPublishJobId(publishData.jobId);
      setPublishModalOpen(true);
      setSaveStatus('success');
      clearLocalDraft();
      await loadContent();
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err.message || 'Publish failed');
    }
  };

  // Drag-and-drop file ingestion logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleImageFile = async (file: File, isGallery: boolean = false) => {
    if (!file) return;
    setIsUploading(true);
    setErrorMessage('');
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('collection', activeCollection);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const parsed = await res.json();
        if (isGallery) {
          setGalleryImages(prev => [...prev, parsed.url]);
        } else {
          setFormCoverImage(parsed.url);
        }
      } else {
        const parsedErr = await res.json();
        setErrorMessage(parsedErr.error || 'Image compression/filesystem error.');
      }
    } catch (e: any) {
      setErrorMessage('Could not execute image uploads (API server is offline).');
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent, isGallery: boolean = false) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // If photo album gallery, support uploading multiple drops
      if (isGallery) {
        Array.from(e.dataTransfer.files).forEach(file => handleImageFile(file, true));
      } else {
        handleImageFile(e.dataTransfer.files[0], false);
      }
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      if (isGallery) {
        Array.from(e.target.files).forEach(file => handleImageFile(file, true));
      } else {
        handleImageFile(e.target.files[0], false);
      }
    }
  };

  // Handling Portfolio Technology stacks
  const handleAddTechBadge = () => {
    const trimmed = techInput.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack(prev => [...prev, trimmed]);
      setTechInput('');
    }
  };

  const handleRemoveTechBadge = (val: string) => {
    setTechStack(prev => prev.filter(t => t !== val));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex-grow flex flex-col relative overflow-hidden bg-[#0d0d0c] h-full"
    >
      {/* Editorial Studio Header */}
      <div className="z-20 border-b border-zinc-900 bg-zinc-950/80 px-6 md:px-12 py-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Terminal className="w-5 h-5 text-orange-500" />
          <div>
            <span className="block font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500 font-medium">Publishing Engine</span>
            <h1 className="font-serif text-2xl text-zinc-200 font-medium tracking-tight">Editorial Hub</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {viewState === 'editor' && (
            <button 
              onClick={saveLocalDraft}
              className="px-4 py-2 border border-zinc-800 bg-zinc-900/60 font-sans text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all rounded-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </button>
          )}
          {viewState === 'list' && (
            <button
              onClick={() => setViewState('deployment')}
              className="px-4 py-2 border border-zinc-800 bg-zinc-900/60 font-sans text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all rounded-sm flex items-center gap-2 cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              Deployment Center
            </button>
          )}
          {viewState === 'deployment' && (
            <button
              onClick={() => setViewState('list')}
              className="px-4 py-2 border border-zinc-900 bg-zinc-950/40 text-xs font-sans text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all rounded-sm flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          )}
          <button
            onClick={() => {
              if (viewState === 'editor') {
                if (confirm('Discard edits and return to listing?')) {
                  setViewState('list');
                  resetFormFields();
                }
              } else if (viewState === 'deployment') {
                setViewState('list');
              } else {
                setView('home');
              }
            }}
            className="px-4 py-2 border border-zinc-900 bg-zinc-950/40 text-xs font-sans text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all rounded-sm flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {viewState === 'editor' ? 'Back' : viewState === 'deployment' ? 'Back to Dashboard' : 'Back to Website'}
          </button>
        </div>
      </div>

      {/* Primary Workspace Scroll Area */}
      <div className="flex-grow overflow-hidden relative flex flex-col">
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Indexing Content Collections...</span>
            </div>
          </div>
        ) : viewState === 'list' ? (
          /* ========================================================== */
          /* 1. DASHBOARD LISTING PAGE */
          /* ========================================================== */
          <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
            
            {/* Editorial State Stats */}
            <div className="mb-12">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-4">Editorial Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Drafts', state: 'draft', color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/10' },
                  { label: 'In Review', state: 'review', color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10' },
                  { label: 'Published', state: 'published', color: 'text-green-400', bg: 'bg-green-500/5 border-green-500/10' },
                  { label: 'Archived', state: 'archived', color: 'text-zinc-400', bg: 'bg-zinc-500/5 border-zinc-500/10' },
                ].map(({ label, state, color, bg }) => {
                  const count = allContent.filter(v => v.state === state). length;
                  return (
                    <button
                      key={state}
                      onClick={() => setFilterState(state)}
                      className={`border ${bg} p-5 rounded-sm text-left transition-all hover:border-opacity-50 cursor-pointer`}
                    >
                      <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-2">{label}</span>
                      <span className={`font-serif text-3xl font-medium ${color}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collection Counters widget */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
              {['journal', 'tech', 'photography', 'collection', 'portfolio'].map(col => {
                const count = allContent.filter(v => v.collection === col).length;
                return (
                  <div key={col} className="border border-zinc-900 bg-zinc-950/50 p-5 rounded-sm">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-2">{col}</span>
                    <span className="font-serif text-3xl font-medium text-zinc-100">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Quick Views */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Recent Drafts */}
              <div className="border border-zinc-900 bg-zinc-950/30 rounded-sm p-5">
                <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Recent Drafts
                </h3>
                <div className="space-y-3">
                  {allContent.filter(i => i.state === 'draft').slice(0, 5).map(item => (
                    <div
                      key={item.slug}
                      onClick={() => handleEditClick(item)}
                      className="flex items-center gap-3 p-2.5 rounded-sm bg-zinc-950/40 hover:bg-zinc-900/40 cursor-pointer transition-colors border border-transparent hover:border-zinc-800/50"
                    >
                      <div className="w-8 h-8 bg-amber-500/10 rounded flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-xs text-zinc-300 truncate">{item.title}</p>
                        <p className="font-mono text-[9px] text-zinc-600">{item.collection}</p>
                      </div>
                    </div>
                  ))}
                  {allContent.filter(i => i.state === 'draft').length === 0 && (
                    <p className="font-sans text-xs text-zinc-600 italic">No drafts</p>
                  )}
                </div>
              </div>

              {/* Pending Publications (In Review) */}
              <div className="border border-zinc-900 bg-zinc-950/30 rounded-sm p-5">
                <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Pending Publications
                </h3>
                <div className="space-y-3">
                  {allContent.filter(i => i.state === 'review').slice(0, 5).map(item => (
                    <div
                      key={item.slug}
                      onClick={() => handleEditClick(item)}
                      className="flex items-center gap-3 p-2.5 rounded-sm bg-zinc-950/40 hover:bg-zinc-900/40 cursor-pointer transition-colors border border-transparent hover:border-zinc-800/50"
                    >
                      <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center shrink-0">
                        <Activity className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-xs text-zinc-300 truncate">{item.title}</p>
                        <p className="font-mono text-[9px] text-zinc-600">{item.collection}</p>
                      </div>
                    </div>
                  ))}
                  {allContent.filter(i => i.state === 'review').length === 0 && (
                    <p className="font-sans text-xs text-zinc-600 italic">Nothing pending review</p>
                  )}
                </div>
              </div>

              {/* Recently Published */}
              <div className="border border-zinc-900 bg-zinc-950/30 rounded-sm p-5">
                <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  Recently Published
                </h3>
                <div className="space-y-3">
                  {allContent.filter(i => i.state === 'published').slice(0, 5).map(item => (
                    <div
                      key={item.slug}
                      onClick={() => handleEditClick(item)}
                      className="flex items-center gap-3 p-2.5 rounded-sm bg-zinc-950/40 hover:bg-zinc-900/40 cursor-pointer transition-colors border border-transparent hover:border-zinc-800/50"
                    >
                      <div className="w-8 h-8 bg-green-500/10 rounded flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-xs text-zinc-300 truncate">{item.title}</p>
                        <p className="font-mono text-[9px] text-zinc-600">{item.date || item.collection}</p>
                      </div>
                    </div>
                  ))}
                  {allContent.filter(i => i.state === 'published').length === 0 && (
                    <p className="font-sans text-xs text-zinc-600 italic">No published content</p>
                  )}
                </div>
              </div>
            </div>

            {/* Catalog Toolbar filters */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles, categories, summaries..."
                    className="pl-10 pr-4 py-2 bg-zinc-955 border border-zinc-900 font-sans text-xs text-zinc-200 rounded-sm focus:outline-none focus:border-orange-500/40 w-64 md:w-80 transition-all font-light"
                  />
                </div>
                
                <div className="flex gap-1.5 p-1 bg-zinc-950/60 border border-zinc-900 rounded-sm">
                  <button
                    onClick={() => setFilterCollection('all')}
                    className={`px-3 py-1 font-sans text-[10px] uppercase tracking-wider rounded-sm transition-all cursor-pointer ${filterCollection === 'all' ? 'bg-orange-500/10 text-orange-400' : 'text-zinc-500 hover:text-zinc-200'}`}
                  >
                    All
                  </button>
                  {collectionOptions.map(col => (
                    <button
                      key={col.value}
                      onClick={() => setFilterCollection(col.value)}
                      className={`px-3 py-1 font-sans text-[10px] uppercase tracking-wider rounded-sm transition-all cursor-pointer ${filterCollection === col.value ? 'bg-orange-500/10 text-orange-400' : 'text-zinc-500 hover:text-zinc-200'}`}
                    >
                      {col.value}
                    </button>
                  ))}
                </div>

                {/* State filter */}
                <div className="flex gap-1.5 p-1 bg-zinc-950/60 border border-zinc-900 rounded-sm">
                  {['all', 'draft', 'review', 'published', 'archived'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterState(s)}
                      className={`px-3 py-1 font-sans text-[10px] uppercase tracking-wider rounded-sm transition-all cursor-pointer ${filterState === s ? 'bg-orange-500/10 text-orange-400' : 'text-zinc-500 hover:text-zinc-200'}`}
                    >
                      {s === 'all' ? 'State: All' : s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateNew}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-sans text-xs uppercase tracking-[0.15em] font-medium transition-colors rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-950/20"
              >
                <Plus className="w-4 h-4" />
                New Publication
              </button>
            </div>

            {/* Table layout of Content items */}
            {processedContent.length === 0 ? (
              <div className="border border-zinc-900 bg-zinc-950/20 p-16 text-center rounded-sm">
                <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1} />
                <h3 className="font-serif text-lg text-zinc-400 mb-2">No matching resources found</h3>
                <p className="font-sans text-xs text-zinc-500 font-light max-w-sm mx-auto">Create a new piece of content under the appropriate collection files to start publishing.</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-zinc-900 rounded-sm">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-900 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                      <th className="py-4 px-6">Collection</th>
                      <th className="py-4 px-6">Title / Cover</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">State</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-950">
                    {processedContent.map((item, idx) => (
                      <tr 
                        key={idx} 
                        className="bg-zinc-950/20 hover:bg-zinc-900/10 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="font-mono text-[9px] bg-zinc-900 border border-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wider">
                            {item.collection}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            {normalizeImagePath(item.coverImage) ? (
                              <SafeImage 
                                src={item.coverImage} 
                                alt={item.title} 
                                className="w-9 h-12 object-cover border border-zinc-800 bg-zinc-900 rounded-sm"
                                referrerPolicy="no-referrer"
                                fallback={
                                  <div className="w-9 h-12 bg-zinc-900 rounded-sm border border-zinc-800 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-zinc-600" />
                                  </div>
                                }
                              />
                            ) : (
                              <div className="w-9 h-12 bg-zinc-900 rounded-sm border border-zinc-800 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-zinc-600" />
                              </div>
                            )}
                            <div>
                              <span className="block font-serif text-base text-zinc-200 font-medium group-hover:text-white transition-all">
                                {item.title}
                              </span>
                              <span className="block font-sans text-[10px] text-zinc-500 font-light truncate max-w-xs mt-1">
                                {item.excerpt || 'No summary text added.'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-sans text-xs text-zinc-400">{item.category}</span>
                        </td>
                        <td className="py-4 px-6">
                          {item.state && (
                            <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                              item.state === 'published'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : item.state === 'draft'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : item.state === 'review'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                            }`}>
                              {item.state}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-sans text-xs text-zinc-500">{item.date || 'Static Asset'}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {item.state === 'draft' && (
                              <button
                                onClick={() => handleStateTransition(item, 'review')}
                                title="Send to Review"
                                className="p-2 border border-blue-900/40 bg-blue-950/20 text-blue-400 hover:text-white hover:bg-blue-600 transition-all rounded-sm cursor-pointer"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            )}
                            {item.state === 'review' && (
                              <>
                                <button
                                  onClick={() => handleStateTransition(item, 'published')}
                                  title="Publish"
                                  className="p-2 border border-green-900/40 bg-green-950/20 text-green-400 hover:text-white hover:bg-green-600 transition-all rounded-sm cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStateTransition(item, 'draft')}
                                  title="Reject to Draft"
                                  className="p-2 border border-amber-900/40 bg-amber-950/20 text-amber-400 hover:text-white hover:bg-amber-600 transition-all rounded-sm cursor-pointer"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {item.state === 'published' && (
                              <button
                                onClick={() => handleStateTransition(item, 'archived')}
                                title="Archive"
                                className="p-2 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all rounded-sm cursor-pointer"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}
                            {item.state === 'archived' && (
                              <button
                                onClick={() => handleStateTransition(item, 'draft')}
                                title="Restore to Draft"
                                className="p-2 border border-amber-900/40 bg-amber-950/20 text-amber-400 hover:text-white hover:bg-amber-600 transition-all rounded-sm cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(item)}
                              title="Edit Item"
                              className="p-2 border border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all rounded-sm cursor-pointer outline-none"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              title="Delete Item"
                              className="p-2 border border-zinc-900/30 bg-zinc-950/20 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-sm cursor-pointer outline-none"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================== */
          /* 2. DYN-RESPONSIVE SIDE-BY-SIDE EDITOR & VISUAL PREVIEW */
          /* ========================================================== */
          <div className="flex-grow flex overflow-hidden">
            
            {/* LEFT INPUT FORM EDIT AREA */}
            <div className="w-full lg:w-1/2 h-full overflow-y-auto border-r border-zinc-900 custom-scrollbar p-6 md:p-12 relative bg-[#0a0a09]">
              
              {/* Draft restore warning banner */}
              {draftAlert && (
                <div className="border border-amber-500/40 bg-amber-500/5 p-4 mb-8 rounded-sm rounded flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-grow">
                    <h5 className="font-serif text-sm text-zinc-200">Unsaved Session Progress Detected</h5>
                    <p className="font-sans text-xs text-zinc-400 font-light mt-1">
                      A local draft for this "{activeCollection}" structure exists from {lastDraftTime}.
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <button 
                        onClick={loadLocalDraft}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-sans text-[10px] uppercase font-bold tracking-widest rounded-sm cursor-pointer"
                      >
                        Restore Progress
                      </button>
                      <button 
                        onClick={clearLocalDraft}
                        className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-sans text-[10px] uppercase tracking-widest rounded-sm cursor-pointer"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Server/Save responses feedback */}
              {saveStatus === 'success' && (
                <div className="border border-green-500/30 bg-green-500/5 px-5 py-4 mb-8 flex items-center gap-3">
                  <Check className="w-4.5 h-4.5 text-green-400 animate-bounce" />
                  <span className="font-sans text-xs text-zinc-350">Content saved and synchronized to local filesystem.</span>
                </div>
              )}

              {saveStatus === 'error' && (
                <div className="border border-red-500/30 bg-red-500/5 px-5 py-4 mb-8 flex flex-col gap-2">
                  <span className="font-sans text-xs text-red-400 font-medium">Failed to write content:</span>
                  <p className="font-mono text-[10px] text-zinc-400">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handlePublish} className="space-y-8">
                
                {/* Meta Configuration block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-zinc-900">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Collection Storage Target</label>
                    <select
                      disabled={isEditing}
                      value={activeCollection}
                      onChange={(e) => handleCollectionChange(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 font-sans text-xs text-zinc-200 py-2.5 px-3 rounded-sm focus:outline-none focus:border-orange-500/50 cursor-pointer disabled:opacity-50"
                    >
                      {collectionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Logical Category Tag</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 font-sans text-xs text-zinc-200 py-2.5 px-3 rounded-sm focus:outline-none focus:border-orange-500/50 cursor-pointer"
                    >
                      {(categoryOptionsMap[activeCollection] || []).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form Core Input fields */}
                <div className="space-y-6">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      {activeCollection === 'photography' ? 'Album Display Title' : activeCollection === 'portfolio' ? 'Project Display Name' : 'Article Display Title'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => {
                        setFormTitle(e.target.value);
                        if (!isEditing) {
                          // Dynamic slug suggestions
                          const derived = e.target.value.toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]/g, '')
                            .slice(0, 40);
                          setFormSlug(derived);
                        }
                      }}
                      placeholder="Title of creative content"
                      className="w-full bg-zinc-950 border border-zinc-900 font-serif text-lg text-zinc-200 py-3 px-4 rounded-sm focus:outline-none focus:border-orange-500/50 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2">URL Slug Name</label>
                      <input
                        type="text"
                        required
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''))}
                        placeholder="e.g. customized-url-slug"
                        className="w-full bg-zinc-950 border border-zinc-900 font-mono text-xs text-zinc-300 py-2.5 px-4 rounded-sm focus:outline-none focus:border-orange-500/50"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-light">Publication Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 font-mono text-xs text-zinc-300 py-2.5 px-4 rounded-sm focus:outline-none focus:border-orange-500/50 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Portfolio exclusive details */}
                  {activeCollection === 'portfolio' && (
                    <div className="space-y-6 p-6 border border-zinc-900 bg-zinc-950/40 rounded-sm">
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2">
                        <Award className="w-3.5 h-3.5" />
                        Portfolio Metadata Fields
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2">GitHub Repository URL</label>
                          <input
                            type="url"
                            value={githubLink}
                            onChange={(e) => setGithubLink(e.target.value)}
                            placeholder="https://github.com/..."
                            className="w-full bg-zinc-950 border border-zinc-900 font-sans text-xs text-zinc-300 py-2.5 px-3 rounded-sm focus:outline-none focus:border-orange-500/50"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Live Production Site URL</label>
                          <input
                            type="url"
                            value={liveLink}
                            onChange={(e) => setLiveLink(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-zinc-950 border border-zinc-900 font-sans text-xs text-zinc-300 py-2.5 px-3 rounded-sm focus:outline-none focus:border-orange-500/50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="featured-proj"
                          checked={featuredProject}
                          onChange={(e) => setFeaturedProject(e.target.checked)}
                          className="bg-zinc-950 border border-zinc-900 text-orange-500 focus:outline-none h-4 w-4 rounded cursor-pointer"
                        />
                        <label htmlFor="featured-proj" className="font-sans text-xs text-zinc-400 select-none cursor-pointer">
                          Highlight as Featured Project on Portfolio homepage
                        </label>
                      </div>

                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Tech Stack Tags</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={techInput}
                            onChange={(e) => setTechInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechBadge())}
                            placeholder="Enter individual technology (e.g. Rust)"
                            className="flex-grow bg-zinc-955 border border-zinc-900 font-sans text-xs text-zinc-350 py-2 px-3 focus:outline-none focus:border-orange-500/30"
                          />
                          <button
                            type="button"
                            onClick={handleAddTechBadge}
                            className="px-3 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs hover:bg-zinc-800 rounded cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        {techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {techStack.map(badge => (
                              <span key={badge} className="font-mono text-[10px] text-zinc-300 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded flex items-center gap-1.5">
                                {badge}
                                <button type="button" onClick={() => handleRemoveTechBadge(badge)} className="text-zinc-500 hover:text-red-400 font-sans font-semibold">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Visual Drop Area for Cover / Primary Image */}
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Cover Banner Image Assets</label>
                    <div className="flex gap-4">
                      <div className="flex-grow">
                        <input
                          type="text"
                          value={formCoverImage}
                          onChange={(e) => setFormCoverImage(e.target.value)}
                          placeholder="e.g. /uploads/collection/cover.png OR enter external image citation link"
                          className="w-full bg-zinc-950 border border-zinc-900 font-sans text-xs text-zinc-350 py-2.5 px-3 rounded-sm focus:outline-none focus:border-orange-500/50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 border border-zinc-805 bg-zinc-950 hover:bg-zinc-900 text-xs text-zinc-400 hover:text-white transition-all rounded cursor-pointer"
                      >
                        Upload Local
                      </button>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleManualUpload(e, false)}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                      />
                    </div>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, false)}
                      className={`mt-3 py-8 px-4 border-2 border-dashed rounded flex flex-col items-center justify-center transition-all ${isDragging ? 'border-orange-500/80 bg-orange-500/5' : 'border-zinc-900 bg-zinc-950/20'}`}
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4.5 h-4.5 text-orange-500 animate-spin" />
                          <span className="font-sans text-xs text-zinc-500">Writing image payload...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-500 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <UploadCloud className="w-7 h-7 text-zinc-650" />
                          <span className="font-sans text-xs font-light">Drag & drop cover file here or click to choose device files</span>
                          <span className="block text-[10px] text-zinc-600 font-mono">SUPPORTS: PNG, JPG, JPEG, WEBP</span>
                        </div>
                      )}
                    </div>

                    {normalizeImagePath(formCoverImage) && (
                      <div className="mt-4 flex items-center justify-between p-3 border border-zinc-900 bg-zinc-950/50 rounded-sm">
                        <div className="flex items-center gap-3">
                          <SafeImage src={formCoverImage} alt="Cover Preview" className="w-12 h-12 object-cover border border-zinc-800 bg-zinc-950" referrerPolicy="no-referrer" />
                          <span className="font-mono text-[10px] text-zinc-400 text-ellipsis overflow-hidden max-w-sm">{formCoverImage}</span>
                        </div>
                        <button type="button" onClick={() => setFormCoverImage('')} className="font-sans text-xs text-zinc-500 hover:text-red-400 cursor-pointer">Remove image</button>
                      </div>
                    )}
                  </div>

                  {/* Photography exclusive multiple images gallery widget */}
                  {activeCollection === 'photography' && (
                    <div className="space-y-6 p-6 border border-zinc-900 bg-zinc-950/40 rounded-sm">
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Album Gallery Images Assets
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="w-full py-4 border-2 border-dashed border-zinc-905 bg-zinc-950/50 hover:bg-zinc-900/30 text-xs text-zinc-500 hover:text-zinc-200 transition-all rounded cursor-pointer flex flex-col items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5 text-orange-500" />
                          <span>Select Device Files to Append into Gallery</span>
                        </button>
                        <input
                          type="file"
                          multiple
                          ref={galleryInputRef}
                          onChange={(e) => handleManualUpload(e, true)}
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          className="hidden"
                        />
                      </div>

                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, true)}
                        className={`py-8 px-4 border-2 border-dashed rounded flex flex-col items-center justify-center transition-all ${isDragging ? 'border-orange-500/85 bg-orange-500/10' : 'border-zinc-900/40 bg-zinc-950/10'}`}
                      >
                        <UploadCloud className="w-6 h-6 text-zinc-600 mb-2" />
                        <span className="font-sans text-xs text-zinc-500 text-center">Or drag & drop multiple files directly in this box to add</span>
                      </div>

                      {galleryImages.length > 0 && (
                        <div>
                          <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-3">Loaded Project Images ({galleryImages.length})</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {galleryImages.map((src, pIdx) => (
                              <div key={pIdx} className="relative aspect-square border border-zinc-850 bg-zinc-950 group/gal">
                                <SafeImage src={src} alt="Gallery slide" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/gal:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== pIdx))}
                                    className="p-1.5 bg-red-600 text-white rounded hover:bg-red-500 text-[10px] font-sans font-medium uppercase tracking-wider cursor-pointer transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                                <span className="absolute bottom-1 left-1 font-mono text-[9px] text-zinc-400 bg-black/85 px-1 py-0.5 rounded">#{pIdx+1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary excerpts */}
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Creative Summary / Excerpt</label>
                    <textarea
                      required
                      rows={3}
                      value={formExcerpt}
                      onChange={(e) => setFormExcerpt(e.target.value)}
                      placeholder="Short editorial summary of published content, displayed on listing sections"
                      className="w-full bg-zinc-950 border border-zinc-900 font-sans text-xs text-zinc-350 py-2.5 px-4 rounded-sm focus:outline-none focus:border-orange-500/50 leading-relaxed"
                    />
                  </div>

                  {/* Body Text Editor */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">Document Body Content (MARKDOWN)</label>
                      <span className="font-sans text-[10px] text-zinc-600 select-none">Supports rich markdown annotations</span>
                    </div>
                    <textarea
                      required
                      rows={18}
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      placeholder="# Entering Headers&#10;&#10;Late nights turn into early mornings, accompanied by glowing screens and the quiet hum of a compiler..."
                      className="w-full bg-zinc-951 border border-zinc-900 font-mono text-xs text-zinc-300 p-4 rounded-sm focus:outline-none focus:border-orange-500/40 leading-relaxed resize-y"
                    />
                  </div>

                </div>

                {/* Confirmations toolbar */}
                <div className="flex items-center gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="submit"
                    disabled={saveStatus === 'saving'}
                    className="px-6 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white font-sans text-xs uppercase tracking-[0.16em] font-medium transition-colors rounded-sm flex items-center justify-center gap-3 cursor-pointer"
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Content
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleFullPublish}
                    disabled={saveStatus === 'saving'}
                    className="flex-grow px-6 py-3 bg-orange-600 hover:bg-orange-500 text-black font-sans text-xs uppercase tracking-[0.16em] font-medium transition-colors rounded-sm flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-orange-950/10"
                  >
                    <Sparkles className="w-4 h-4" />
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Discard your changes?')) {
                        setViewState('list');
                        resetFormFields();
                      }
                    }}
                    className="px-6 py-3 border border-zinc-900 hover:bg-zinc-900 text-zinc-500 hover:text-white text-xs font-sans uppercase tracking-[0.15em] transition-all rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>

            {/* PREVIEW FRAME */}
            <div className="hidden lg:block lg:w-1/2 h-full overflow-hidden bg-[#0d0d0c]">
              <PreviewFrame
                collection={activeCollection}
                slug={isEditing && formSlug ? formSlug : 'new-draft'}
                liveContent={{
                  body: formBody,
                  frontmatter: {
                    title: formTitle,
                    category: formCategory,
                    date: formDate,
                    coverImage: formCoverImage,
                    excerpt: formExcerpt,
                    techStack,
                    githubLink,
                    liveLink,
                  }
                }}
              />
            </div>

          </div>
        )}
        {viewState === 'deployment' && <DeploymentCenter />}
      </div>

      {/* Publishing Modal */}
      <PublishingModal
        isOpen={publishModalOpen}
        onClose={() => {
          setPublishModalOpen(false);
          setPublishJobId(null);
        }}
        jobId={publishJobId}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </motion.div>
  );
}
