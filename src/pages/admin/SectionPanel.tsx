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
}

export default function SectionPanel({ section }: SectionPanelProps) {
  if (section.kind === 'singleton') {
    return <SingletonSectionEditor section={section} />;
  }

  return <CollectionSectionEditor section={section} />;
}
