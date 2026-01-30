import { Link } from "react-router-dom";
import { RingIcon } from "@/components/logo";

export function FooterSection() {
  return (
    <footer className="py-8 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {/* Top row: Logo and Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <RingIcon size={24} />
              <span className="font-semibold text-sm text-gold">Over The Top</span>
            </div>

            {/* Links */}
            <Link 
              to="/legal" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Legal
            </Link>
          </div>

          {/* Legal Disclaimer */}
          <p className="text-xs text-muted-foreground/70 text-center max-w-2xl mx-auto leading-relaxed">
            Over The Top (OTT) is an unofficial companion app and is not affiliated, associated, 
            authorized, endorsed by, or in any way officially connected with World Wrestling 
            Entertainment (WWE). The name 'Royal Rumble' as well as related names, marks, emblems, 
            and images are registered trademarks of their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
