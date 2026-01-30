import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Tv, Monitor } from "lucide-react";

interface TvModeGalleryProps {
  id?: string;
}

// Placeholder data - will be replaced with actual screenshots
const gallerySlides = [
  {
    id: "entry-grid",
    title: "Entry Grid",
    description: "Track all 30 entrants with live wrestler images and player assignments",
    placeholder: "Men's/Women's Entry Grid",
  },
  {
    id: "props-grid", 
    title: "Props Tracker",
    description: "See everyone's predictions for #1 Entrant, Iron Man, Final Four, and more",
    placeholder: "Rumble Props Grid",
  },
  {
    id: "live-match",
    title: "Live Undercard",
    description: "Display the current match with pick percentages and a color-coded breakdown",
    placeholder: "Undercard Match Display",
  },
  {
    id: "numbers-reveal",
    title: "Number Reveal",
    description: "The big moment - show everyone their randomly assigned Rumble numbers",
    placeholder: "Your Numbers Are In!",
  },
  {
    id: "winner-predictions",
    title: "Winner Predictions",
    description: "Who does everyone think will win? See all the picks at a glance",
    placeholder: "Winner Predictions Panel",
  },
];

export function TvModeGallery({ id }: TvModeGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % gallerySlides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + gallerySlides.length) % gallerySlides.length);
  };

  const currentSlide = gallerySlides[currentIndex];

  return (
    <section id={id} className="bg-zinc-950 py-20 lg:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 text-yellow-500 mb-4">
            <Tv className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              TV Display Mode
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Cast to the Big Screen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everyone follows along on the TV while the action unfolds. Real-time updates, 
            live scoring, and pure chaos.
          </p>
        </motion.div>

        {/* Gallery Carousel */}
        <div className="relative">
          {/* Main Display Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
          >
            {/* TV Frame Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 to-transparent pointer-events-none" />
            
            {/* Placeholder Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8"
              >
                <Monitor className="w-16 h-16 text-zinc-700 mb-4" />
                <span className="text-zinc-500 text-lg font-medium mb-2">
                  {currentSlide.placeholder}
                </span>
                <span className="text-zinc-600 text-sm">
                  Screenshot coming soon
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Slide Indicator Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {gallerySlides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-yellow-500 w-6"
                      : "bg-zinc-600 hover:bg-zinc-500"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-foreground hover:bg-zinc-700 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-foreground hover:bg-zinc-700 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl font-bold text-foreground mb-2">
                {currentSlide.title}
              </h3>
              <p className="text-muted-foreground">
                {currentSlide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {["Fullscreen Mode", "Auto-Scaling", "Real-Time Updates", "10-Foot UI"].map((feature) => (
            <span
              key={feature}
              className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-sm text-zinc-300"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
