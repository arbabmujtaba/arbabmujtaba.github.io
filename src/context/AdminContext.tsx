import React, { createContext, useContext, useState } from 'react';

interface AdminContextType {
  isAdminMode: boolean;
  isAuthenticated: boolean;
  setIsAdminMode: (mode: boolean) => void;
  setIsAuthenticated: (auth: boolean) => void;
  editingItem: EditingItem | null;
  setEditingItem: (item: EditingItem | null) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  saveMessage: string | null;
  setSaveMessage: (msg: string | null) => void;
}

export interface EditingItem {
  type: 'portfolio' | 'journal' | 'tech' | 'photography' | 'collection';
  slug: string;
  filePath: string;
  frontmatter: Record<string, any>;
  content: string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  return (
    <AdminContext.Provider
      value={{
        isAdminMode,
        isAuthenticated,
        setIsAdminMode,
        setIsAuthenticated,
        editingItem,
        setEditingItem,
        isSaving,
        setIsSaving,
        saveMessage,
        setSaveMessage,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
