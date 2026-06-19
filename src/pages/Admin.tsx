/**
 * Admin
 *
 * Thin wrapper that renders the new modular AdminLayout.
 * The legacy admin component is preserved in AdminLegacy.tsx for reference.
 */

import AdminLayout from './admin/AdminLayout';

export default function Admin({ setView }: { setView: (v: string) => void }) {
  return <AdminLayout setView={setView} />;
}
