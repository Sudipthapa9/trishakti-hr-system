import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Person } from "@/components/shared/data-display/person";
import type { PipelineApplication } from "@/data/candidate-pipeline-api";
import { useState } from "react";
import { NativeSelect } from "@/components/ui/native-select";

const fixedStages = [
  { value: "Review", label: "Applied" },
  { value: "Screening", label: "Screening" },
  { value: "Shortlisted", label: "Shortlisted" },
];

const otherStages = [
  { value: "Interview", label: "Interview" },
  { value: "Offer", label: "Offer" },
  { value: "Hired", label: "Hired" },
  { value: "Rejected", label: "Rejected" },
  { value: "Withdrawn", label: "Withdrawn" },
];

const appliedDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
});

export function CandidatePipelineBoard({
  applications,
}: {
  applications: PipelineApplication[];
}) {
  const [otherStage, setOtherStage] = useState("Interview");

  const stages = [
    ...fixedStages,
    {
      value: otherStage,
      label: otherStage,
    },
  ];
  return (
    <div className="candidate-pipeline-board">
      {stages.map((stage, index) => {
        const records = applications.filter(
          (application) => application.stage === stage.value,
        );

        return (
          <section
            className="pipeline-column"
            key={index < fixedStages.length ? stage.value : "other-stages"}
            aria-label={`${stage.label} applications`}
          >
            <header className="pipeline-column-heading">
              {index < fixedStages.length ? (
                <h2>{stage.label}</h2>
              ) : (
                <NativeSelect
                  className="pipeline-stage-select"
                  aria-label="Stage shown in the fourth column"
                  value={otherStage}
                  onChange={(event) => setOtherStage(event.target.value)}
                >
                  {otherStages.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </NativeSelect>
              )}
              <span title="Applications currently loaded">
                {records.length}
              </span>
            </header>

            <div className="pipeline-column-cards">
              {records.map((application) => (
                <Card key={application.id} className="pipeline-candidate-card">
                  <CardContent>
                    <Link to={`/candidates/${application.candidateId}`}>
                      <Person
                        name={application.fullName}
                        detail={application.jobTitle}
                      />
                    </Link>

                    <div className="pipeline-candidate-footer">
                      <time dateTime={application.createdAt}>
                        {appliedDate.format(new Date(application.createdAt))}
                      </time>
                      <span>Not screened</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
