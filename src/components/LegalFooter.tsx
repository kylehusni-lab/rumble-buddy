import { Link } from "react-router-dom";

export function LegalFooter() {
  return (
    <footer className="text-center text-xs text-muted-foreground py-4">
      © WWE. All Rights Reserved. This is an unofficial fan application not affiliated with WWE.{" "}
      <Link to="/legal" className="underline hover:text-foreground transition-colors">
        Legal
      </Link>
    </footer>
  );
}
