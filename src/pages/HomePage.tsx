import { useState, useRef } from "react";
import { OttNavBar } from "@/components/OttNavBar";
import { HeroSection } from "@/components/home/HeroSection";
import { StorySection } from "@/components/home/StorySection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FooterSection } from "@/components/home/FooterSection";
import { RequestAccessModal } from "@/components/RequestAccessModal";

export default function HomePage() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const headerOffset = 80;
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const scrollToStory = () => scrollToSection(storyRef);
  const scrollToFeatures = () => scrollToSection(featuresRef);

  return (
    <div className="min-h-screen bg-background">
      <OttNavBar 
        onStoryClick={scrollToStory} 
        onFeaturesClick={scrollToFeatures}
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
        
        <FooterSection />
      </main>

      <RequestAccessModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </div>
  );
}
