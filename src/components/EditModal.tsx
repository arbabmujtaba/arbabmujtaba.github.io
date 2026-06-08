import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

export default function EditModal() {
  const { editingItem, setEditingItem, isSaving, setIsSaving, saveMessage, setSaveMessage } = useAdmin();
  const [frontmatterText, setFrontmatterText] = useState('');
  const [contentText, setContentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string } | null>(null);

  if (!editingItem) return null;

  // Parse repo from environment
  useEffect(() => {
    const githubRepo = (import.meta as any).env.VITE_GITHUB_REPO || '';
    if (githubRepo) {
      const [owner, repo] = githubRepo.split('/');
      setRepoInfo({ owner, repo });
    }
  }, []);

  const handleOpen = () => {
    const yamlLines = Object.entries(editingItem.frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          const items = value.map(v => `  - ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n');
          return `${key}:\n${items}`;
        }
        if (typeof value === 'string') {
          return `${key}: "${value}"`;
        }
        if (typeof value === 'boolean') {
          return `${key}: ${value}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join('\n');

    setFrontmatterText(yamlLines);
    setContentText(editingItem.content);
    setError(null);
  };

  if (frontmatterText === '') {
    handleOpen();
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      if (!repoInfo) {
        throw new Error('GitHub repo not configured. Set VITE_GITHUB_REPO in .env.local');
      }

      const token = sessionStorage.getItem('github-token');
      if (!token) {
        throw new Error('No GitHub token. Please authenticate first.');
      }

      const markdown = `---\n${frontmatterText}\n---\n\n${contentText}`;
      const base64Content = btoa(unescape(encodeURIComponent(markdown)));
      const pathWithoutSlash = editingItem.filePath.replace(/^\//, '');
      
      // Get current file SHA
      const getResponse = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${pathWithoutSlash}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      let sha: string | undefined;
      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }

      // Save to GitHub
      const saveResponse = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${pathWithoutSlash}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Edit: ${editingItem.slug}`,
            content: base64Content,
            sha: sha,
          }),
        }
      );

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || 'Failed to save');
      }

      setSaveMessage('✓ Saved to GitHub!');
      setTimeout(() => setSaveMessage(null), 3000);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setEditingItem(null);
    setFrontmatterText('');
    setContentText('');
    setError(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Edit Content</h2>
              <p className="text-xs text-zinc-500 mt-1">{editingItem.slug}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto flex gap-6 p-6">
            {/* Frontmatter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Frontmatter (YAML)</label>
              <textarea
                value={frontmatterText}
                onChange={(e) => setFrontmatterText(e.target.value)}
                className="w-full h-[300px] bg-zinc-950 border border-zinc-700 rounded p-3 font-mono text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                placeholder="title: ..."
              />
            </div>

            {/* Markdown Content */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Content (Markdown)</label>
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="w-full h-[300px] bg-zinc-950 border border-zinc-700 rounded p-3 font-mono text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                placeholder="Your markdown content..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-800 p-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              {saveMessage && (
                <div className="text-green-400 text-sm">{saveMessage}</div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 bg-zinc-800 text-zinc-100 rounded hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save to GitHub'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
