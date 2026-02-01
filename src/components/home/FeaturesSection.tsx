import { motion } from "framer-motion";
import { User, Users, Clock, Tv } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Party Mode",
    subtitle: "Host up to 9 friends",
    description: "Create a watch party, share your code, and compete on a real-time leaderboard. Random number draws keep things fair so newbies can beat the experts.",
  },
  {
    icon: User,
    title: "Solo Mode",
    subtitle: "Play on your own terms",
    description: "No group? No problem. Make your picks, score each match yourself, and see how your predictions stack up against the actual results.",
  },
  {
    icon: Tv,
    title: "TV Display Mode",
    subtitle: "The big screen experience",
    description: "Cast to your TV so everyone can follow the action. Track entries, eliminations, and scores with a broadcast-quality display designed for groups.",
  },
  {
    icon: Clock,
    title: "Real-Time Scoring",
    subtitle: "Host controls the pace",
    description: "Whether you're watching live or slightly behind, the host marks entries and eliminations as they happen. Everyone's screens update instantly.",
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
            Everything you need for watch party night
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From picks to scoring to the big reveal, we've got every moment covered.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map(({ icon: Icon, title, subtitle, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-6 lg:p-8 rounded-xl border border-border bg-ott-surface-elevated hover:border-ott-accent/30 transition-colors"
            >
              {/* Icon */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-ott-accent/10 border border-ott-accent/20 flex items-center justify-center group-hover:bg-ott-accent/20 transition-colors">
                  <Icon className="w-6 h-6 text-ott-accent" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-ott-accent">
                  {subtitle}
                </span>
              </div>
              
              {/* Content */}
              <h3 className="text-xl sm:text-2xl font-bold mb-3">
                {title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
