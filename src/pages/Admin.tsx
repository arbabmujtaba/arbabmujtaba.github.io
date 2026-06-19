/**
 * Admin
 *
 * Thin wrapper that renders the modular AdminLayout.
 */

import AdminLayout from './admin/AdminLayout';

export default function Admin({ setView }: { setView: (v: string) => void }) {
  return <AdminLayout setView={setView} />;
}
