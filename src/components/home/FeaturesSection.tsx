import { motion } from "framer-motion";
import { Zap, Tv, UserX, Smartphone } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Scores update instantly as matches end and eliminations happen.",
  },
  {
    icon: Tv,
    title: "TV Display Mode",
    description: "Cast to your big screen so everyone can follow along.",
  },
  {
    icon: UserX,
    title: "No Signup Required",
    description: "Jump right in. No account needed to join a party.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Designed for phones because that's how you'll use it.",
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

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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
