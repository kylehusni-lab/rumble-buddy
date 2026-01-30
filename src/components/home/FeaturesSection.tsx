import { motion } from "framer-motion";
import { User, Users, Clock, Tv } from "lucide-react";

const features = [
  {
    icon: User,
    title: "Solo Mode",
    description: "Play by yourself - make picks and score your own match without a group.",
  },
  {
    icon: Users,
    title: "Party Mode",
    description: "Host a watch party with up to 9 friends and compete on a live leaderboard.",
  },
  {
    icon: Clock,
    title: "Watch at Your Pace",
    description: "Host controls scoring, so it works whether you're live or slightly behind.",
  },
  {
    icon: Tv,
    title: "TV Display Mode",
    description: "Cast to your big screen so everyone can follow along.",
  },
];

interface FeaturesSectionProps {
  id?: string;
}

export function FeaturesSection({ id }: FeaturesSectionProps) {
  return (
    <section id={id} className="py-20 lg:py-24 bg-ott-surface border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ott-accent">
              Features
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Built for the big night
            </h2>
          </div>

          {/* Feature Grid - 2 columns centered */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
            {features.map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-ott-surface-elevated border border-border flex items-center justify-center">
                  <Icon className="w-6 h-6 text-ott-accent" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
