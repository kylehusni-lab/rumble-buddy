import { Link } from "react-router-dom";
import { OttLogoMark } from "@/components/OttLogo";

export function FooterSection() {
  return (
    <footer className="py-8 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <OttLogoMark size={24} />
            <span className="font-semibold text-sm">Over The Top</span>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            This is an unofficial fan application not affiliated with WWE.
          </p>

          {/* Links */}
          <Link 
            to="/legal" 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Legal
          </Link>
        </div>
      </div>
    </footer>
  );
}
