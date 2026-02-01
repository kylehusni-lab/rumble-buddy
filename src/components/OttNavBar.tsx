import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, LogIn, Users } from "lucide-react";
import { OttLogoImage } from "./logo";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useAuth } from "@/hooks/useAuth";

interface OttNavBarProps {
  onStoryClick?: () => void;
  onFeaturesClick?: () => void;
}

export function OttNavBar({ onStoryClick, onFeaturesClick }: OttNavBarProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const handleNavClick = (action?: () => void) => {
    setIsOpen(false);
    action?.();
  };

  const handleRouteClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/90 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <OttLogoImage size="xs" />
          <span className="font-bold text-lg tracking-tight hidden sm:inline text-foreground">Over The Top</span>
        </Link>

        {/* Nav Links - Desktop */}
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
            onClick={() => navigate("/demo")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Demo
          </button>
        </div>

        {/* Right side - CTA + Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Desktop CTAs */}
          {!isLoading && (
            isAuthenticated ? (
              <Button 
                onClick={() => navigate("/my-parties")}
                className="hidden sm:inline-flex"
                variant="outline"
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                My Parties
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => navigate("/sign-in")}
                  className="hidden sm:inline-flex"
                  variant="ghost"
                  size="sm"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/join")}
                  className="hidden sm:inline-flex bg-ott-accent text-background hover:bg-ott-accent/90 font-semibold"
                  size="sm"
                >
                  Join Party
                </Button>
              </>
            )
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-border p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <OttLogoImage size="xs" />
                    <span className="font-bold text-foreground">Over The Top</span>
                  </div>
                </div>

                {/* Nav Links */}
                <div className="flex-1 py-4">
                  <div className="flex flex-col gap-1 px-2">
                    <button
                      onClick={() => handleNavClick(onStoryClick)}
                      className="flex items-center px-3 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      Our Story
                    </button>
                    <button
                      onClick={() => handleNavClick(onFeaturesClick)}
                      className="flex items-center px-3 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      Features
                    </button>
                    <button
                      onClick={() => handleRouteClick("/demo")}
                      className="flex items-center px-3 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      Demo
                    </button>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="p-4 border-t border-border space-y-2">
                  {!isLoading && (
                    isAuthenticated ? (
                      <Button 
                        onClick={() => handleRouteClick("/my-parties")}
                        className="w-full"
                        variant="outline"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        My Parties
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={() => handleRouteClick("/sign-in")}
                          className="w-full"
                          variant="ghost"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                        <Button 
                          onClick={() => handleRouteClick("/join")}
                          className="w-full bg-ott-accent text-background hover:bg-ott-accent/90 font-semibold"
                        >
                          Join Party
                        </Button>
                      </>
                    )
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
