import { Person } from "@/components/shared/data-display/person";
import { FilterToolbar } from "@/components/shared/forms/filter-toolbar";
import { DataState } from "@/components/shared/feedback/data-state";
import { PageHeader } from "@/components/Layout/page-header";
import { Label } from "@/components/ui/label";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { PaginationControls } from "@/components/shared/navigation/pagination-controls";
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
        const data = await requestCandidates(
          query.search,
          query.page,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setResult(data);
          setLoadError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load candidates.",
          );
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
        <PageHeader
          className="page-heading"
          title={<>Candidates</>}
          description={
            <>People who have submitted applications to your jobs.</>
          }
        />
        <FilterToolbar asChild>
          <form className="candidate-list-search" onSubmit={runSearch}>
            <Label htmlFor="candidate-search" className="sr-only">
              Search candidates
            </Label>
            <Input
              id="candidate-search"
              value={search}
              maxLength={200}
              placeholder="Search by name, email, or phone"
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button type="submit" disabled={isLoading}>
              <Search size={16} /> Search
            </Button>
          </form>
        </FilterToolbar>
        {isLoading ? (
          <FeedbackMessage role="status">Loading candidates…</FeedbackMessage>
        ) : loadError ? (
          <div role="alert">
            <p>{loadError}</p>
            <Button
              variant="outline"
              onClick={() => {
                setIsLoading(true);
                setQuery({ ...query });
              }}
            >
              Try again
            </Button>
          </div>
        ) : result?.candidates.length ? (
          <div className="candidate-list-scroll">
            <Table className="candidate-list-table">
              <TableCaption className="sr-only">
                Saved candidates and application counts
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Candidate</TableHead>
                  <TableHead scope="col">Email</TableHead>
                  <TableHead scope="col">Phone</TableHead>
                  <TableHead scope="col">Applications</TableHead>
                  <TableHead scope="col">Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <Link
                        className="underline"
                        to={"/candidates/" + candidate.id}
                      >
                        <Person name={candidate.fullName} />
                      </Link>
                    </TableCell>
                    <TableCell>{candidate.email}</TableCell>
                    <TableCell>{candidate.phone}</TableCell>
                    <TableCell>{candidate.applicationCount}</TableCell>
                    <TableCell>
                      <time dateTime={candidate.createdAt}>
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </time>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <DataState kind="empty">
            {query.search
              ? "No candidates match your search."
              : "No candidates have applied yet."}
          </DataState>
        )}
        <nav className="candidate-list-pagination" aria-label="Candidate pages">
          <PaginationControls
            previousDisabled={isLoading || query.page === 1}
            nextDisabled={isLoading || loadError !== null || !result?.hasMore}
            onPrevious={() => changePage(query.page - 1)}
            onNext={() => changePage(query.page + 1)}
          >
            <span>Page {query.page}</span>
          </PaginationControls>
        </nav>
      </div>
    </div>
  );
}
