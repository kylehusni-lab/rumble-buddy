import { motion } from "framer-motion";

interface StorySectionProps {
  id?: string;
}

export function StorySection({ id }: StorySectionProps) {
  return (
    <section 
      id={id}
      className="bg-ott-surface border-t border-border py-20 lg:py-24"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ott-accent">
              Our Story
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Why we're obsessed with this stuff
            </h2>
          </div>

          {/* Copy */}
          <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
            <p>
              People always ask: "Why wrestling?" It's simple. It's the only place you get the 
              high-stakes action of an intense movie, the laugh-out-loud humor of a great comedy, 
              and the awe-inspiring athleticism of world-class sports stars—all in one ring.
            </p>

            <p>
              But if you don't watch every week, it can be hard to keep up. Who's feuding with who? 
              Why does everyone hate that guy? That's where OTT comes in.
            </p>
          </div>

          {/* Highlight Box */}
          <div className="border-l-4 border-ott-accent bg-ott-accent/5 p-6 rounded-r-lg">
            <p className="text-foreground text-lg leading-relaxed">
              The Royal Rumble is the perfect gateway event. By turning the show into a game where 
              you have "your" wrestlers to root for, it makes the whole thing click. Every watch 
              party is a chance to make a new fan.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
