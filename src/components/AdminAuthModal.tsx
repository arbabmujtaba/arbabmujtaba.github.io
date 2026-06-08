import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export default function AdminAuthModal() {
  const { isAdminMode, isAuthenticated, setIsAdminMode, setIsAuthenticated } = useAdmin();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAdminMode && isAuthenticated) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verify token by making a test request to GitHub API
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid GitHub token');
      }

      // Store token in sessionStorage (not localStorage for security)
      sessionStorage.setItem('github-token', token);
      setIsAuthenticated(true);
      setToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = () => {
    if (!isAdminMode) {
      setIsAdminMode(true);
    } else {
      setIsAuthenticated(false);
      setIsAdminMode(false);
      sessionStorage.removeItem('github-token');
      setToken('');
    }
  };

  return (
    <motion.button
      onClick={handleToggleAdmin}
      className="fixed bottom-6 right-6 z-[150] bg-orange-500/10 border border-orange-500/30 text-orange-500 p-3 rounded-full hover:bg-orange-500/20 transition-all duration-300 flex items-center justify-center hover:scale-110"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={isAdminMode && isAuthenticated ? 'Exit admin mode' : 'Enter admin mode'}
    >
      <Lock size={20} />

      {/* Admin Login Modal */}
      {isAdminMode && !isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full mb-4 right-0 bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-80 shadow-2xl z-[151]"
        >
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">GitHub Token</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="github_pat_..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Create at <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">github.com/settings/tokens</a>
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Unlock Admin'}
            </button>
          </form>
        </motion.div>
      )}
    </motion.button>
  );
}

