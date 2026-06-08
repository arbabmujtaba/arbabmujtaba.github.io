import { motion } from 'motion/react';
import { Edit2 } from 'lucide-react';
import { useAdmin, EditingItem } from '../context/AdminContext';

interface EditButtonProps {
  item: Omit<EditingItem, 'frontmatter' | 'content'> & {
    title: string;
    data: Record<string, any>;
    body: string;
  };
}

export default function EditButton({ item }: EditButtonProps) {
  const { isAdminMode, isAuthenticated, setEditingItem } = useAdmin();

  if (!isAdminMode || !isAuthenticated) return null;

  const handleEdit = () => {
    setEditingItem({
      type: item.type,
      slug: item.slug,
      filePath: item.filePath,
      frontmatter: item.data,
      content: item.body,
    });
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ opacity: 1, scale: 1.05 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleEdit}
      className="absolute -top-3 -right-3 z-30 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-colors"
      title="Edit this content"
    >
      <Edit2 size={16} />
    </motion.button>
  );
}
