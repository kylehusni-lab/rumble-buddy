import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Legal() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <Logo size="sm" />
        
        <h1 className="text-2xl font-bold text-foreground text-center">
          Legal Disclaimer
        </h1>

        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">
              Copyright & Trademark Notice
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All WWE programming, talent names, images, likenesses, slogans, wrestling moves, 
              trademarks, logos and copyrights are the exclusive property of WWE, Inc. and its 
              subsidiaries. All other trademarks, logos and copyrights are the property of their 
              respective owners.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">
              Unofficial Application
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This application is an unofficial fan-made tracker for entertainment purposes only 
              and is not affiliated with, endorsed by, or connected to WWE, Inc. in any way.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">
              Fair Use Statement
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This application uses WWE talent names and likenesses under Fair Use for the 
              purposes of commentary, criticism, and news reporting related to the Royal Rumble 
              event. No copyright infringement is intended.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">
              Image Credits
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All wrestler images and WWE logos are property of WWE, Inc. and are used here 
              for informational and entertainment purposes only.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">
              No Commercial Use
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This application is provided free of charge for personal entertainment use only. 
              No commercial use or profit is derived from this application.
            </p>
          </section>
        </div>

        <div className="pt-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
