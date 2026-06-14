import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="glow-bg flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold gradient-text">404</p>
      <p className="mt-4 text-lg text-muted-foreground">
        This page doesn't exist.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back home</Button>
      </Link>
    </div>
  );
}
