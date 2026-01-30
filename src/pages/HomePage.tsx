import { useState, useRef } from "react";
import { OttNavBar } from "@/components/OttNavBar";
import { HeroSection } from "@/components/home/HeroSection";
import { StorySection } from "@/components/home/StorySection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { TvModeGallery } from "@/components/home/TvModeGallery";
import { FooterSection } from "@/components/home/FooterSection";
import { RequestAccessModal } from "@/components/RequestAccessModal";

export default function HomePage() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const tvModeRef = useRef<HTMLDivElement>(null);

  const scrollToStory = () => {
    storyRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTvMode = () => {
    tvModeRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <OttNavBar 
        onStoryClick={scrollToStory} 
        onFeaturesClick={scrollToFeatures}
        onTvModeClick={scrollToTvMode}
      />
      
      <main>
        <HeroSection 
          onRequestAccess={() => setIsRequestModalOpen(true)} 
          onLearnMore={scrollToStory}
        />
        
        <div ref={storyRef}>
          <StorySection id="story" />
        </div>
        
        <div ref={featuresRef}>
          <FeaturesSection id="features" />
        </div>
        
        <div ref={tvModeRef}>
          <TvModeGallery id="tv-mode" />
        </div>
        
        <FooterSection />
      </main>

      <RequestAccessModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </div>
  );
}
