import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Tv, Trophy, Sparkles } from "lucide-react";

const tabs = [
  { id: "picks", label: "Make Picks", icon: Check },
  { id: "tv", label: "TV Mode", icon: Tv },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "props", label: "Props", icon: Sparkles },
];

export function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState("picks");

  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-10"
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ott-accent">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Everything you need for Rumble night
            </h2>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-lg mx-auto bg-ott-surface border border-border">
              {tabs.map(({ id, label, icon: Icon }) => (
                <TabsTrigger 
                  key={id} 
                  value={id}
                  className="data-[state=active]:bg-ott-accent data-[state=active]:text-background text-xs sm:text-sm"
                >
                  <Icon className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Preview Window */}
            <div className="mt-8 bg-ott-surface border border-border rounded-2xl p-4 sm:p-6 lg:p-8 min-h-[300px]">
              <TabsContent value="picks" className="mt-0">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Make Your Predictions</h3>
                  <p className="text-muted-foreground">
                    Pick match winners, rumble participants, and chaos props before the show starts.
                  </p>
                  {/* Mobile-optimized wrestler list preview */}
                  <div className="space-y-2 max-w-sm">
                    {["Roman Reigns", "Cody Rhodes", "John Cena"].map((name) => (
                      <div 
                        key={name}
                        className="flex items-center gap-3 p-3 bg-ott-surface-elevated rounded-lg border border-border"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                          {name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">WWE</div>
                        </div>
                        <Check className="w-5 h-5 text-ott-accent" />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tv" className="mt-0">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Cast to Your TV</h3>
                  <p className="text-muted-foreground">
                    Display live scores, entries, and eliminations on a second screen for everyone to see.
                  </p>
                  <div className="bg-ott-surface-elevated rounded-lg p-4 border border-border aspect-video flex items-center justify-center">
                    <Tv className="w-16 h-16 text-muted-foreground" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-0">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Real-Time Leaderboard</h3>
                  <p className="text-muted-foreground">
                    Watch scores update live as matches finish and eliminations happen.
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: "Kyle", score: 145, rank: 1 },
                      { name: "Sarah", score: 120, rank: 2 },
                      { name: "Mike", score: 95, rank: 3 },
                    ].map(({ name, score, rank }) => (
                      <div 
                        key={name}
                        className="flex items-center justify-between p-3 bg-ott-surface-elevated rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank === 1 ? 'bg-ott-accent text-background' : 'bg-muted'}`}>
                            {rank}
                          </span>
                          <span className="font-medium">{name}</span>
                        </div>
                        <span className="font-bold text-ott-accent">{score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="props" className="mt-0">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Chaos Props</h3>
                  <p className="text-muted-foreground">
                    Bet on the unpredictable. Will there be a surprise return? First blood? Tag team betrayal?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Mystery Entrant",
                      "First Blood",
                      "Kofi Save",
                      "Tag Betrayal",
                    ].map((prop) => (
                      <div 
                        key={prop}
                        className="p-4 bg-ott-surface-elevated rounded-lg border border-border text-center"
                      >
                        <Sparkles className="w-6 h-6 text-ott-accent mx-auto mb-2" />
                        <span className="text-sm font-medium">{prop}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}
