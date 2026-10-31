/**
 * Renders the standalone public 404 design and navigation back to the app.
 */
import { Link } from "react-router-dom";
import "./not-found-page.css";
// Renders the standalone public 404 design and navigation back to the app.
export function PublicNotFoundPage() {
  return (
    <div className="page-public-not-found-page">
      {/* Page or panel heading and contextual actions. */}
      <header>
        <Link to="/careers">● Trishakti-hr</Link>
        {/* Related navigation destinations or workflow steps. */}
        <nav>
          <a href="mailto:careers@trishakti.example">Help Center</a>
          <span>System Status</span>
        </nav>
      </header>
      {/* Main screen content; shared navigation is composed separately. */}
      <main>
        <div className="not-found-orb" aria-hidden="true" />
        <h1>404</h1>
        <h2>Lost in the quiet</h2>
        <p>
          The page you are looking for has drifted away, or perhaps it never
          existed at all. Let's
          <br className="hidden sm:block" /> guide you back to steady ground.
        </p>
        <Link className="not-found-home" to="/">
          Go Back Home
        </Link>
      </main>
      {/* Supporting links, pagination, or secondary screen actions. */}
      <footer>
        <small>© 2025 Oasis Technologies Inc.</small>
        <div>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}
