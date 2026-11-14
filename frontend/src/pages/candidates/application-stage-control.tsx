import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  applicationStages,
  type ApplicationStage,
} from "@/data/application-stages";
import {
  saveApplicationStage,
  StageConflictError,
} from "@/data/application-stage-api";

export function ApplicationStageControl({
  id,
  stage,
  onSaved,
}: {
  id: string;
  stage: ApplicationStage;
  onSaved: (stage: ApplicationStage) => void;
}) {
  const [selected, setSelected] = useState(stage);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);

  async function save() {
    if (busy.current || selected === stage) return;
    busy.current = true;
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await saveApplicationStage(id, selected, stage);
      onSaved(result.application.stage);
      setSaved(true);
    } catch (error) {
      if (error instanceof StageConflictError) onSaved(error.currentStage);
      setError(
        error instanceof Error ? error.message : "Could not save this stage.",
      );
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  }

  return (
    <div className="my-4">
      <Label htmlFor={"stage-" + id}>Application stage</Label>
      <div className="flex flex-wrap items-center gap-3">
        <NativeSelect
          id={"stage-" + id}
          className="form-select"
          value={selected}
          disabled={isSaving}
          onChange={(event) => {
            setSelected(event.target.value as ApplicationStage);
            setError(null);
            setSaved(false);
          }}
        >
          {applicationStages.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </NativeSelect>
        <Button
          disabled={isSaving || selected === stage}
          onClick={() => void save()}
        >
          {isSaving ? "Saving…" : "Save stage"}
        </Button>
      </div>
      {error && <FeedbackMessage role="alert">{error}</FeedbackMessage>}
      {saved && <FeedbackMessage role="status">Stage saved.</FeedbackMessage>}
    </div>
  );
}
