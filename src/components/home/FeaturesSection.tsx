import { motion } from "framer-motion";
import { User, Users, Clock, Tv } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Party Mode",
    subtitle: "Host up to 9 friends",
    description: "Create a watch party, share your code, and compete on a real-time leaderboard. Random number draws keep things fair so newbies can beat the experts.",
    screenshot: "/tv-screenshots/leaderboard.png",
    screenshotAlt: "Live leaderboard showing player scores during a party",
  },
  {
    icon: User,
    title: "Solo Mode",
    subtitle: "Play on your own terms",
    description: "No group? No problem. Make your picks, score each match yourself, and see how your predictions stack up against the actual results.",
    screenshot: "/tv-screenshots/make-picks.png",
    screenshotAlt: "Pick interface for selecting Rumble winner predictions",
  },
  {
    icon: Tv,
    title: "TV Display Mode",
    subtitle: "The big screen experience",
    description: "Cast to your TV so everyone can follow the action. Track entries, eliminations, and scores with a broadcast-quality display designed for groups.",
    screenshot: "/tv-screenshots/mens-entry-grid.png",
    screenshotAlt: "TV display showing the 30-wrestler entry grid",
  },
  {
    icon: Clock,
    title: "Real-Time Scoring",
    subtitle: "Host controls the pace",
    description: "Whether you're watching live or slightly behind, the host marks entries and eliminations as they happen. Everyone's screens update instantly.",
    screenshot: "/tv-screenshots/numbers-reveal.png",
    screenshotAlt: "Numbers reveal animation showing assigned entries",
  },
];

interface FeaturesSectionProps {
  id?: string;
}

export function FeaturesSection({ id }: FeaturesSectionProps) {
  return (
    <section id={id} className="py-20 lg:py-32 bg-ott-surface border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-16 lg:mb-24"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-ott-accent">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold max-w-2xl mx-auto leading-tight">
            Everything you need for Rumble night
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From picks to scoring to the big reveal, we've got every moment covered.
          </p>
        </motion.div>

        {/* Alternating Feature Rows */}
        <div className="space-y-20 lg:space-y-32">
          {features.map(({ icon: Icon, title, subtitle, description, screenshot, screenshotAlt }, index) => {
            const isReversed = index % 2 === 1;
            
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                  isReversed ? "lg:grid-flow-dense" : ""
                }`}
              >
                {/* Text Content */}
                <div className={`space-y-4 ${isReversed ? "lg:col-start-2" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ott-accent/10 border border-ott-accent/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-ott-accent" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-ott-accent">
                      {subtitle}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                    {title}
                  </h3>
                  
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                    {description}
                  </p>
                </div>

                {/* Screenshot */}
                <div className={`${isReversed ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                  <motion.div
                    className="relative group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Glow effect */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-ott-accent/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Screenshot container */}
                    <div className="relative rounded-xl overflow-hidden border border-border bg-ott-surface-elevated shadow-2xl">
                      <img
                        src={screenshot}
                        alt={screenshotAlt}
                        loading="lazy"
                        className="w-full h-auto"
                      />
                      
                      {/* Subtle overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}