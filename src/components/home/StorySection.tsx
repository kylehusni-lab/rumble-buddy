import { motion } from "framer-motion";

interface StorySectionProps {
  id?: string;
}

export function StorySection({ id }: StorySectionProps) {
  return (
    <>
      {/* Section A: The Origin Story - Warm, personal feel */}
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
            {/* Badge */}
            <span className="text-xs font-bold uppercase tracking-wider text-ott-accent">
              Our Story
            </span>

            {/* The Experiment */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
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
            </div>

            {/* The Spark */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                The Spark
              </h3>
              <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>
                  It worked. Suddenly people who had never watched a match were screaming at the TV 
                  because their wrestler just got eliminated. The energy in the room was electric. 
                  We realized that when you give people a reason to care about every entrant, the 
                  magic clicks instantly.
                </p>
              </div>
            </div>

            {/* Conclusion */}
            <div className="border-l-4 border-ott-accent bg-ott-accent/5 p-6 rounded-r-lg">
              <p className="text-foreground text-lg leading-relaxed">
                Over The Top (OTT) is the digital evolution of that poster board. We built it to be 
                the definitive Rumble app—replacing the bad handwriting and manual tracking with a 
                premium experience that goes hand-in-hand with the match itself. We wanted to share 
                that thrill with our friends. Now we want to help you share it with yours.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section B: The Philosophy - Bold, manifesto feel */}
      <section className="bg-background border-t border-border py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-8"
          >
            {/* Main Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Why we're obsessed with this stuff
            </h2>

            {/* Why Wrestling */}
            <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>
                People always ask: "Why wrestling?"
              </p>
              <p>
                It's simple. It's the only place you get the high-stakes action of an intense movie, 
                the laugh-out-loud humor of a great comedy, and the awe-inspiring athleticism of 
                world-class sports stars. It is all in one ring. It's a spectacle, and there's 
                nothing else like it.
              </p>
            </div>

            {/* The Gateway */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                The Gateway
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                But if you don't watch every week, it can be hard to keep up. That's why the 
                Royal Rumble is perfect. 30 superstars, constant action, one winner. It is the 
                ultimate gateway event, and OTT is the key to unlocking it.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
