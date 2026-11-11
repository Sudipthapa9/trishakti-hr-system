/**
 * Lists saved candidate identities and their application counts for HR.
 */
import "./candidates-page.css";
import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestCandidates, type CandidateList } from "@/data/candidates-api";

export function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ search: "", page: 1 });
  const [result, setResult] = useState<CandidateList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCandidates() {
      try {
        const data = await requestCandidates(query.search, query.page, controller.signal);
        if (!controller.signal.aborted) {
          setResult(data);
          setLoadError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Could not load candidates.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadCandidates();
    return () => controller.abort();
  }, [query]);

  function runSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setQuery({ search: search.trim(), page: 1 });
  }

  function changePage(page: number) {
    setIsLoading(true);
    setQuery({ search: query.search, page });
  }

  return (
    <div className="page-candidates-candidates-page">
      <div className="page-stack">
        <header className="page-heading">
          <div>
            <h1>Candidates</h1>
            <p>People who have submitted applications to your jobs.</p>
          </div>
        </header>
        <form className="candidate-list-search" onSubmit={runSearch}>
          <label htmlFor="candidate-search" className="sr-only">Search candidates</label>
          <Input id="candidate-search" value={search} maxLength={200}
            placeholder="Search by name, email, or phone"
            onChange={(event) => setSearch(event.target.value)} />
          <Button type="submit" disabled={isLoading}>
            <Search size={16} /> Search
          </Button>
        </form>
        {isLoading ? (
          <p role="status">Loading candidates…</p>
        ) : loadError ? (
          <div role="alert">
            <p>{loadError}</p>
            <Button variant="outline" onClick={() => {
              setIsLoading(true);
              setQuery({ ...query });
            }}>Try again</Button>
          </div>
        ) : result?.candidates.length ? (
          <div className="candidate-list-scroll">
            <table className="candidate-list-table">
              <caption className="sr-only">Saved candidates and application counts</caption>
              <thead>
                <tr><th scope="col">Candidate</th><th scope="col">Email</th><th scope="col">Phone</th><th scope="col">Applications</th><th scope="col">Added</th></tr>
              </thead>
              <tbody>
                {result.candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td><Link className="underline" to={"/candidates/" + candidate.id}>{candidate.fullName}</Link></td>
                    <td>{candidate.email}</td>
                    <td>{candidate.phone}</td>
                    <td>{candidate.applicationCount}</td>
                    <td><time dateTime={candidate.createdAt}>{new Date(candidate.createdAt).toLocaleDateString()}</time></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{query.search ? "No candidates match your search." : "No candidates have applied yet."}</p>
        )}
        <nav className="candidate-list-pagination" aria-label="Candidate pages">
          <Button variant="outline" disabled={isLoading || query.page === 1} onClick={() => changePage(query.page - 1)}>Previous</Button>
          <span>Page {query.page}</span>
          <Button variant="outline" disabled={isLoading || loadError !== null || !result?.hasMore} onClick={() => changePage(query.page + 1)}>Next</Button>
        </nav>
      </div>
    </div>
  );
}
