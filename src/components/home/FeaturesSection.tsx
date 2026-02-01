import { motion } from "framer-motion";
import { User, Users, Clock, Tv } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Party Mode",
    subtitle: "Same couch or miles apart",
    description: "Create a lobby for your friends. Whether you're in the same room or streaming together remotely, you're competing in the same ring.",
  },
  {
    icon: Tv,
    title: "TV Display",
    subtitle: "The command center",
    description: "Cast the leaderboard to your big screen. A broadcast-quality display that keeps the score visible while you watch the hits.",
  },
  {
    icon: User,
    title: "Solo Global Rank",
    subtitle: "Test your wrestling IQ",
    description: "No crew? No problem. Test your predictions against the entire OTT community and see where you rank globally.",
  },
  {
    icon: Clock,
    title: "Live Host Controls",
    subtitle: "You run the show",
    description: "Start the matches, trigger alerts, and settle the scores in real-time. As the ref's hand hits the mat, the leaderboard shifts instantly.",
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
            Pick Your Way to the Top
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold max-w-2xl mx-auto leading-tight">
            Every PLE. Every Match. Every Moment.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Predict winners, method of victory, and match of the night. Real-time scoring keeps the competition fierce.
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
