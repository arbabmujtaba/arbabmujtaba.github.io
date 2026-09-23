/**
 * Icon names the CMS is allowed to store.
 *
 * `content/favorites/*.md` carries an `icon` field holding a Lucide component
 * name, and the admin writes it — but nothing rendered it, so the field was
 * decoration in the front-matter only.
 *
 * The map is explicit rather than `import * as Icons from 'lucide-react'`
 * because a namespace import defeats tree-shaking and would pull the entire
 * icon set (well over a thousand components) into the bundle. Every name below
 * appears in the content today; an unknown name resolves to null and the
 * surface simply renders without an icon.
 */

import {
  Activity,
  ArrowLeftRight,
  AudioWaveform,
  BookOpen,
  Brain,
  Camera,
  Code2,
  Coffee,
  Command,
  Cpu,
  Database,
  FileEdit,
  Headphones,
  Keyboard,
  Lamp,
  Laptop,
  Layout,
  Mic,
  Monitor,
  Network,
  Palette,
  Radio,
  Search,
  Server,
  Settings,
  Square,
  Terminal,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Activity,
  ArrowLeftRight,
  AudioWaveform,
  BookOpen,
  Brain,
  Camera,
  Code2,
  Coffee,
  Command,
  Cpu,
  Database,
  FileEdit,
  Headphones,
  Keyboard,
  Lamp,
  Laptop,
  Layout,
  Mic,
  Monitor,
  Network,
  Palette,
  Radio,
  Search,
  Server,
  Settings,
  Square,
  Terminal,
};

/** The Lucide component for a stored name, or null when it is not one we ship. */
export function resolveIcon(name: string | undefined | null): LucideIcon | null {
  if (!name) return null;
  return ICONS[name.trim()] ?? null;
}
