import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCandidateProfile, ProfileConflictError, type CandidateProfile } from "@/data/candidates-api";

export function CandidateProfileEditor({ candidate, onSaved }: {
  candidate: CandidateProfile;
  onSaved: (profile: CandidateProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const values = new FormData(event.currentTarget);
    busy.current = true;
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await saveCandidateProfile(candidate,
        String(values.get("fullName") ?? "").trim(),
        String(values.get("phone") ?? "").trim());
      onSaved(response.candidate);
      setEditing(false);
      setSaved(true);
    } catch (error) {
      if (error instanceof ProfileConflictError) onSaved(error.candidate);
      setError(error instanceof Error ? error.message : "Could not save this profile.");
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  }

  return (
    <section aria-label="Edit candidate profile">
      {editing ? (
        <form onSubmit={submit} aria-busy={isSaving}>
          <fieldset disabled={isSaving} className="grid max-w-lg gap-3">
            <label htmlFor="profile-name">Full name</label>
            <Input id="profile-name" name="fullName" defaultValue={candidate.fullName} required maxLength={200} />
            <label htmlFor="profile-phone">Phone</label>
            <Input id="profile-phone" name="phone" type="tel" defaultValue={candidate.phone} required minLength={5} maxLength={50} />
            <div className="flex gap-3">
              <Button type="submit">{isSaving ? "Saving…" : "Save profile"}</Button>
              <Button type="button" variant="outline" onClick={() => { setEditing(false); setError(null); }}>Cancel</Button>
            </div>
          </fieldset>
        </form>
      ) : (
        <Button variant="outline" onClick={() => { setEditing(true); setSaved(false); }}>Edit profile</Button>
      )}
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">Profile saved.</p>}
    </section>
  );
}
