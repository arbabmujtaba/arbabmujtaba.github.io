/**
 * SectionPanel
 *
 * Routes to the appropriate editor based on section kind:
 * - singleton: renders SingletonSectionEditor
 * - collection: renders CollectionSectionEditor
 */

import type { SectionDef } from '../../lib/sections';
import SingletonSectionEditor from '../../components/admin/SingletonSectionEditor';
import CollectionSectionEditor from '../../components/admin/CollectionSectionEditor';

interface SectionPanelProps {
  section: SectionDef;
  initialExpandSlug?: string | null;
  onExpandSlugConsumed?: () => void;
}

export default function SectionPanel({ section, initialExpandSlug, onExpandSlugConsumed }: SectionPanelProps) {
  if (section.kind === 'singleton') {
    return <SingletonSectionEditor section={section} />;
  }

  return (
    <CollectionSectionEditor
      section={section}
      initialExpandSlug={initialExpandSlug}
      onExpandSlugConsumed={onExpandSlugConsumed}
    />
  );
}
