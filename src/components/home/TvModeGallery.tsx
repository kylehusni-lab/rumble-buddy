import { motion } from "framer-motion";
import { Tv } from "lucide-react";

interface TvModeGalleryProps {
  id?: string;
}

export function TvModeGallery({ id }: TvModeGalleryProps) {
  return (
    <section id={id} className="bg-zinc-950 py-20 lg:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 text-yellow-500 mb-4">
            <Tv className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              TV Display Mode
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Cast to the Big Screen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everyone follows along on the TV while the action unfolds. Real-time updates, 
            live scoring, and pure chaos.
          </p>
        </motion.div>

        {/* Static TV Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative aspect-video bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl"
        >
          {/* TV Frame Effect - top reflection */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10" />
          
          {/* Screenshot Display */}
          <img
            src="/tv-screenshots/mens-entry-grid.png"
            alt="TV Mode - Men's Entry Grid with live wrestler tracking and player assignments"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <h3 className="text-xl font-bold text-foreground mb-2">
            Live Entry Grid
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Track all 30 entrants with live wrestler images, color-coded player assignments, 
            and real-time elimination status. Winner predictions displayed at the bottom.
          </p>
        </motion.div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {["Fullscreen Mode", "Auto-Scaling", "Real-Time Updates", "10-Foot UI"].map((feature) => (
            <span
              key={feature}
              className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-sm text-zinc-300"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
