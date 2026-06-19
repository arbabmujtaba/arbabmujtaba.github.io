/**
 * AdminLayout
 *
 * Main shell component for the new admin interface.
 * Renders sidebar + top bar + main panel.
 * Fetches sections from /api/sections and manages active section state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import AdminDashboard from './AdminDashboard';
import SectionPanel from './SectionPanel';
import DeploymentCenter from '../../components/DeploymentCenter';
import type { SectionDef } from '../../lib/sections';

type AdminView = 'dashboard' | 'section' | 'deployment';

interface AdminLayoutProps {
  setView: (v: string) => void;
}

export default function AdminLayout({ setView }: AdminLayoutProps) {
  const [sections, setSections] = useState<SectionDef[]>([]);
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sections from API
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections');
        if (res.ok) {
          const data = await res.json();
          setSections(data);
        }
      } catch {
        // Sections might not be available if server isn't running
      } finally {
        setIsLoading(false);
      }
    };
    fetchSections();
  }, []);

  const activeSection = useMemo(() => {
    if (!activeSectionId) return null;
    return sections.find((s) => s.id === activeSectionId) || null;
  }, [sections, activeSectionId]);

  const handleSelectSection = useCallback((id: string) => {
    setActiveSectionId(id);
    setActiveView('section');
  }, []);

  const handleNavigateDashboard = useCallback(() => {
    setActiveSectionId(null);
    setActiveView('dashboard');
  }, []);

  const handleOpenDeployment = useCallback(() => {
    setActiveView('deployment');
    setActiveSectionId(null);
  }, []);

  const handleExitAdmin = useCallback(() => {
    setView('home');
  }, [setView]);

  const handleGlobalSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        // If clearing search and in section view, stay there
        return;
      }
      // For now, global search just filters sidebar
      // Future: open command palette or search results panel
    },
    []
  );

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a09]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-zinc-600 text-sm font-mono"
        >
          Loading admin...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#0a0a09] overflow-hidden">
      {/* Top Bar */}
      <AdminTopBar onExitAdmin={handleExitAdmin} onSearch={handleGlobalSearch} />

      {/* Main Area: Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <AdminSidebar
          sections={sections}
          activeSection={activeSectionId}
          onSelectSection={handleSelectSection}
          onNavigateDashboard={handleNavigateDashboard}
          onOpenDeployment={handleOpenDeployment}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <motion.div
                key="dashboard"
                className="flex-1 overflow-hidden flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AdminDashboard
                  sections={sections}
                  onSelectSection={handleSelectSection}
                />
              </motion.div>
            )}

            {activeView === 'section' && activeSection && (
              <motion.div
                key={`section-${activeSectionId}`}
                className="flex-1 overflow-hidden flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SectionPanel section={activeSection} />
              </motion.div>
            )}

            {activeView === 'deployment' && (
              <motion.div
                key="deployment"
                className="flex-1 overflow-hidden flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  <DeploymentCenter />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
