/**
 * Offers recovery links when no authenticated workspace route matches the requested path.
 */
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Offers recovery links when no authenticated workspace route matches the requested path.
export function WorkspaceNotFoundPage() {
  return (
    <section className="page-stack">
      <h1>Page not found</h1>
      <p className="demo-note">
        The page you are looking for is not available.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/dashboard">Back to overview</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/careers">View careers site</Link>
        </Button>
      </div>
    </section>
  );
}
