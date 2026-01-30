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
            {/* Step 1: The Experiment */}
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
                The Experiment
              </h2>
              <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>
                  Three years ago, we invited a group of friends over for the Royal Rumble with 
                  a crazy idea. Could we turn total non-fans into wrestling obsessives in one night?
                </p>
                <p>
                  We knew it was a long shot. We needed a way to hold their attention and get them 
                  invested in the action. So we bought a poster board, gave everyone a crash course 
                  on the storylines, and scribbled down a random number draw to even the odds.
                </p>
              </div>
            </motion.div>

            {/* Step 2: The Spark */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[41px] top-1 w-3 h-3 rounded-full bg-yellow-500" />
              
              <h3 className="text-2xl font-bold text-yellow-500 mb-4">
                The Spark
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                It worked. Suddenly people who had never watched a match were screaming at the TV 
                because their wrestler just got eliminated.{" "}
                <span className="text-foreground">The energy in the room was electric.</span>{" "}
                We realized that when you give people a reason to care about every entrant, the 
                magic clicks instantly.
              </p>
            </motion.div>

            {/* Step 3: The Evolution - Feature Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[41px] top-8 w-3 h-3 rounded-full bg-yellow-500" />
              
              <div className="bg-zinc-900 border-l-4 border-yellow-500 p-8 rounded-r-lg">
                <p className="text-foreground text-lg leading-relaxed">
                  <span className="font-bold text-yellow-500">Over The Top (OTT)</span> is the 
                  digital evolution of that poster board. We built it to be the definitive Rumble 
                  app—replacing the bad handwriting and manual tracking with a premium experience 
                  that goes hand-in-hand with the match itself. We wanted to share that thrill with 
                  our friends. Now we want to help you share it with yours.
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
              Why We're Obsessed
            </h2>
            
            {/* Italic gold subhead */}
            <p className="text-xl lg:text-2xl italic text-yellow-500">
              People always ask: "Why wrestling?"
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
        </div>
      </section>

      {/* Section C: The Gateway */}
      <section className="bg-background py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <p className="text-xl lg:text-2xl font-light text-zinc-300 leading-relaxed">
              But if you don't watch every week, it can be hard to keep up. That's why the{" "}
              <span className="font-bold text-yellow-500">Royal Rumble</span> is perfect. 
              30 superstars, constant action, one winner.
            </p>
            <p className="text-xl lg:text-2xl font-light text-zinc-300 leading-relaxed">
              It is the ultimate gateway event, and{" "}
              <span className="font-bold text-yellow-500">OTT</span> is the key to unlocking it.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
