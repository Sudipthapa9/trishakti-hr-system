/**
 * Composes candidate messages from templates and variables; save/send feedback remains local to this prototype.
 */
import { PageHeader } from "@/components/Layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Candidate } from "@/types/hr";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import {
  DemoNotice,
  PanelTitle,
  Person,
} from "../../components/HR/workflow-ui";
import "./communication-page.css";

// Composes candidate messages from templates and variables; save/send feedback remains local to this prototype.
export function CommunicationPage({ candidates }: { candidates: Candidate[] }) {
  // Keep selectedTemplate in component state; updates trigger a render.
  const [selectedTemplate, setSelectedTemplate] = useState(
    "Interview invitation",
  );
  // Keep recipient in component state; updates trigger a render.
  const [recipient, setRecipient] = useState(candidates[0]?.email ?? "");
  // Keep subject in component state; updates trigger a render.
  const [subject, setSubject] = useState(
    "Interview invitation — Trishakti Poly Packs",
  );
  // Keep message in component state; updates trigger a render.
  const [message, setMessage] = useState(
    "Hi {{candidate_name}},\n\nThank you for your interest in {{job_title}} at Trishakti Poly Packs. We would like to invite you to an interview with our team.\n\nPlease reply with a few times that work for you.\n\nBest regards,\nPeople Team",
  );
  // Keep notice in component state; updates trigger a render.
  const [notice, setNotice] = useState("");
  const templates = [
    "Application acknowledgement",
    "Interview invitation",
    "Selection notification",
    "Rejection notice",
    "Offer communication",
  ];
  // Update the selected email-template metadata and clear stale feedback.
  function chooseTemplate(template: string) {
    setSelectedTemplate(template);
    setSubject(`${template} — Trishakti Poly Packs`);
    setNotice("");
  }
  return (
    <div className="page-recruitment-communication-page">
      <div className="page-stack">
        <PageHeader
          eyebrow="Recruitment"
          title="Communication Hub"
          description="Use consistent, thoughtful messages throughout the candidate journey."
          action={
            <Button variant="outline">
              <Mail aria-hidden="true" /> Email templates
            </Button>
          }
        />
        <DemoNotice />
        {notice ? (
          <p
            role="status"
            className="rounded-lg bg-accent p-3 text-sm text-accent-foreground"
          >
            {notice}
          </p>
        ) : null}
        <div className="grid gap-4 communication-layout">
          <div className="space-y-4">
            {/* Compose a reusable surface around this group of content. */}
            <Card>
              {/* Separate the panel heading and actions from its content. */}
              <CardHeader>
                <PanelTitle title="Email templates" />
              </CardHeader>
              {/* Render the panel body using the shared spacing convention. */}
              <CardContent className="space-y-1">
                {templates.map((template) => (
                  <button
                    type="button"
                    key={template}
                    onClick={() => chooseTemplate(template)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm ${selectedTemplate === template ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {template}
                  </button>
                ))}
              </CardContent>
            </Card>
            {/* Compose a reusable surface around this group of content. */}
            <Card>
              {/* Separate the panel heading and actions from its content. */}
              <CardHeader>
                <PanelTitle title="Recent history" />
              </CardHeader>
              {/* Render the panel body using the shared spacing convention. */}
              <CardContent className="space-y-4 text-sm">
                <div>
                  <Person
                    name="Alex Johnson"
                    detail="Interview schedule · 2h ago"
                    initials="AJ"
                  />
                  <Badge className="mt-2" variant="success">
                    Sent
                  </Badge>
                </div>
                <div>
                  <Person
                    name="Sarah Miller"
                    detail="Application received · 1d ago"
                    initials="SM"
                  />
                  <Badge className="mt-2" variant="neutral">
                    Auto reply
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Compose a reusable surface around this group of content. */}
          <Card>
            {/* Separate the panel heading and actions from its content. */}
            <CardHeader>
              <PanelTitle
                title="Compose Message"
                action={
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotice("Draft saved in this demo.")}
                    >
                      Save Draft
                    </Button>
                    <Button size="sm" type="submit" form="communication-form">
                      <Send />
                      Send Email
                    </Button>
                  </div>
                }
              />
            </CardHeader>
            {/* Render the panel body using the shared spacing convention. */}
            <CardContent>
              {/* Collect inputs; the submit handler controls validation and the resulting local action. */}
              <form
                id="communication-form"
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setNotice(
                    `Message prepared for ${recipient}. Sending is not connected in this demo.`,
                  );
                }}
              >
                <div className="form-field">
                  <Label htmlFor="message-to">To</Label>
                  <select
                    id="message-to"
                    className="form-select w-full"
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                  >
                    {candidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.email}>
                        {candidate.name} · {candidate.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <Label htmlFor="message-subject">Subject</Label>
                  <Input
                    id="message-subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-2 border-y py-3">
                  {[
                    "{{candidate_name}}",
                    "{{job_title}}",
                    "{{interview_date}}",
                  ].map((variable) => (
                    <Button
                      key={variable}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setMessage((current) => `${current}\n${variable}`)
                      }
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
                <div className="form-field">
                  <Label htmlFor="message-body">Message</Label>
                  <Textarea
                    id="message-body"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="communication-body min-h-72 leading-6"
                    required
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
