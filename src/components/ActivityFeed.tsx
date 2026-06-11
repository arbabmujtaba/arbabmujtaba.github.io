import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Loader2, Rocket, GitCommit, Clock } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'publish' | 'error' | 'draft' | 'review';
  title: string;
  message: string;
  timestamp: string;
}

export default function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/deploy/status');
        if (res.ok) {
          const status = await res.json();
          const items: ActivityEvent[] = [];
          if (status.lastPublished) {
            items.push({
              id: 'last-published',
              type: 'publish',
              title: status.lastPublished.title,
              message: 'Published',
              timestamp: status.lastPublished.timestamp,
            });
          }
          if (status.lastDeployment?.status === 'error') {
            items.push({
              id: 'last-error',
              type: 'error',
              title: 'Deployment Failed',
              message: status.lastDeployment.message || 'Unknown error',
              timestamp: status.lastDeployment.timestamp,
            });
          }
          setEvents(items);
        }
      } catch {
        // ignore
      }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  if (events.length === 0) {
    return (
      <div className="border border-zinc-900 bg-zinc-950/30 rounded-sm p-5">
        <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Activity Feed</h3>
        <p className="font-sans text-xs text-zinc-600 italic">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-900 bg-zinc-950/30 rounded-sm p-5">
      <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5" />
        Activity Feed
      </h3>
      <div className="space-y-3">
        <AnimatePresence>
          {events.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-3 rounded-sm bg-zinc-950/40 border border-zinc-900"
            >
              {e.type === 'publish' && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />}
              {e.type === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
              {e.type === 'draft' && <Rocket className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {e.type === 'review' && <GitCommit className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="font-sans text-xs text-zinc-300">{e.title}</p>
                <p className="font-mono text-[9px] text-zinc-500">{e.message} • {new Date(e.timestamp).toLocaleTimeString()}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
