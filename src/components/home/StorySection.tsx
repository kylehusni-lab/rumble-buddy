import { motion } from "framer-motion";
import { Clapperboard, Laugh, Trophy } from "lucide-react";

interface StorySectionProps {
  id?: string;
}

const trifecta = [
  { icon: Clapperboard, label: "Intense Movie Action" },
  { icon: Laugh, label: "Laugh-Out-Loud Comedy" },
  { icon: Trophy, label: "World-Class Athletics" },
];

export function StorySection({ id }: StorySectionProps) {
  return (
    <>
      {/* Section A: The Origin - Timeline Layout */}
      <section id={id} className="bg-background py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold uppercase tracking-wider text-yellow-500 mb-12"
          >
            Our Story
          </motion.span>

          {/* Timeline */}
          <div className="relative border-l-2 border-yellow-500/30 ml-4 pl-8 space-y-12">
            {/* Step 1: The Beginning */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[41px] top-1 w-3 h-3 rounded-full bg-yellow-500" />
              
              <h2 className="text-2xl font-bold text-foreground mb-4">
                The Evolution
              </h2>
              <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>
                  We started with a poster board and a simple question: How do we make the 
                  Royal Rumble even better? The answer was giving everyone a stake in the match.
                </p>
                <p>
                  But we didn't stop at 30-man brawls. Whether it's a high-stakes ladder match 
                  or a main-event title fight, <span className="font-bold text-yellow-500">Over The Top (OTT)</span> is 
                  the digital evolution of the watch party.
                </p>
              </div>
            </motion.div>

            {/* Step 2: The Vision */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[41px] top-8 w-3 h-3 rounded-full bg-yellow-500" />
              
              <div className="bg-zinc-900 border-l-4 border-yellow-500 p-8 rounded-r-lg">
                <p className="text-foreground text-lg leading-relaxed">
                  We've replaced messy spreadsheets and forgotten bets with a premium, real-time 
                  experience that turns every PLE into a game night.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section B: The Manifesto */}
      <section className="bg-zinc-950 py-32 lg:py-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            {/* Massive headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground mb-6">
              Why Wrestling?
            </h2>
            
            {/* Italic gold subhead */}
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
              It's the world's greatest soap opera disguised as a world-class athletic spectacle. 
              But it's always better when you have a horse in the race.
            </p>
          </motion.div>

          {/* Icon Trifecta Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trifecta.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="flex flex-col items-center text-center space-y-3 p-6"
              >
                <item.icon className="w-12 h-12 text-yellow-500" />
                <span className="text-lg font-bold text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>
          
          {/* Additional context */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-lg text-muted-foreground mt-12 max-w-2xl mx-auto"
          >
            <span className="font-bold text-yellow-500">OTT</span> transforms you from a spectator 
            into a strategist. From the "Big Four" to international stadium shows, we provide the 
            context and the competition to make every match matter.
          </motion.p>
        </div>
      </section>

      {/* Section C: The Gateway - Removed since we're no longer Rumble-only */}
    </>
  );
}
