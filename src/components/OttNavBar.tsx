import { Link, useNavigate } from "react-router-dom";
import { OttLogoMark } from "./OttLogo";
import { Button } from "./ui/button";

interface OttNavBarProps {
  onStoryClick?: () => void;
  onFeaturesClick?: () => void;
  onTvModeClick?: () => void;
}

export function OttNavBar({ onStoryClick, onFeaturesClick, onTvModeClick }: OttNavBarProps) {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/90 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <OttLogoMark size={32} />
          <span className="font-bold text-lg tracking-tight hidden sm:inline">OTT</span>
        </Link>

        {/* Nav Links - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={onStoryClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Our Story
          </button>
          <button 
            onClick={onFeaturesClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </button>
          <button 
            onClick={onTvModeClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            TV Mode
          </button>
          <button 
            onClick={() => navigate("/demo")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Demo
          </button>
        </div>

        {/* CTA */}
        <Button 
          onClick={() => navigate("/join")}
          className="bg-ott-accent text-background hover:bg-ott-accent/90 font-semibold"
          size="sm"
        >
          Join Party
        </Button>
      </div>
    </nav>
  );
}
