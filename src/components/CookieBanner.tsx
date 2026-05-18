import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mfa-cookie-ack-v1";

const CookieBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
  }, []);

  const acknowledge = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-lg p-4"
    >
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">
            We use only essential cookies to keep you signed in and remember your theme.
            No tracking, no ads.{" "}
            <Link to="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={acknowledge}>
              Got it
            </Button>
            <Link to="/privacy">
              <Button size="sm" variant="outline">
                Learn more
              </Button>
            </Link>
          </div>
        </div>
        <button
          onClick={acknowledge}
          aria-label="Dismiss cookie notice"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
