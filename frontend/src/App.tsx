/**
 * Declares public and authenticated routes. Layout and authentication behavior live in their own modules.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthSessionGate } from "@/auth/AuthSessionGate";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { initialJobs } from "@/data/demo-data";
import { WorkspaceNotFoundPage } from "@/pages/WorkspaceNotFoundPage";
import {
  DashboardRoute,
  JobsRoute,
  NewJobRoute,
  CandidatesRoute,
  ScreeningRankingRoute,
  CommunicationRoute,
  OfferGenerationRoute,
} from "@/routes/workspace-pages";
import { CandidateAnalysisPage } from "@/pages/screening/candidate-analysis-page";
import { InterviewsPage } from "@/pages/interviews/interviews-page";
import { OnboardingPage } from "@/pages/onboarding/onboarding-page";
import { EmployeeRecordPage } from "@/pages/employees/employee-record-page";
import { ApplicationConfirmationPage } from "@/pages/public/application-confirmation-page";
import { JobDetailsPage } from "@/pages/public/job-details-page";
import { CareersPage } from "@/pages/public/careers-page";
import { PublicNotFoundPage } from "@/pages/public/not-found-page";

// Declares public and authenticated routes. Layout and authentication behavior live in their own modules.
export default function App() {
  return (
    <Routes>
      {/* Declare this URL match or nested layout boundary. */}
      <Route element={<AuthSessionGate />}>
        {/* Declare this URL match or nested layout boundary. */}
        <Route path="/404" element={<PublicNotFoundPage />} />
        {/* Declare this URL match or nested layout boundary. */}
        <Route path="/careers" element={<CareersPage jobs={initialJobs} />} />
        {/* Declare this URL match or nested layout boundary. */}
        <Route
          path="/careers/:jobId"
          element={<JobDetailsPage jobs={initialJobs} />}
        />
        {/* Declare this URL match or nested layout boundary. */}
        <Route
          path="/careers/:jobId/application"
          element={<JobDetailsPage jobs={initialJobs} />}
        />
        {/* Declare this URL match or nested layout boundary. */}
        <Route
          path="/careers/:jobId/application/confirmation"
          element={<ApplicationConfirmationPage />}
        />
        {/* Declare this URL match or nested layout boundary. */}
        <Route path="/careers/*" element={<PublicNotFoundPage />} />
        {/* Declare this URL match or nested layout boundary. */}
        <Route element={<ProtectedRoute />}>
          {/* Declare this URL match or nested layout boundary. */}
          <Route element={<WorkspaceLayout />}>
            {/* Declare this URL match or nested layout boundary. */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            {/* Declare this URL match or nested layout boundary. */}
            <Route path="/dashboard" element={<DashboardRoute />} />
            {/* Declare this URL match or nested layout boundary. */}
            <Route path="/jobs" element={<JobsRoute />} />
            {/* Declare this URL match or nested layout boundary. */}
            <Route path="/jobs/new" element={<NewJobRoute />} />
            {/* Declare this URL match or nested layout boundary. */}
            <Route path="/candidates" element={<CandidatesRoute />} />
            {/* Declare this URL match or nested layout boundary. */}
            <Route path="/screening" element={<ScreeningRankingRoute />} />
            {/* Declare this URL match or nested layout boundary. */}
            <Route
              path="/screening/:candidateId"
              element={<CandidateAnalysisPage />}
            />
            {/* Declare this URL match or nested layout boundary. */}
            <Route path="/interviews" element={<InterviewsPage />} />
            {/* Declare this URL match or nested layout boundary. */}
            <Route path="/communication" element={<CommunicationRoute />} />
            {/* Declare this URL match or nested layout boundary. */}
            <Route path="/offers/new" element={<OfferGenerationRoute />} />
            {/* Declare this URL match or nested layout boundary. */}
            <Route
              path="/onboarding"
              element={<Navigate to="/onboarding/eleanor-shellstrop" replace />}
            />
            {/* Declare this URL match or nested layout boundary. */}
            <Route
              path="/onboarding/:candidateId"
              element={<OnboardingPage />}
            />
            {/* Declare this URL match or nested layout boundary. */}
            <Route
              path="/employees"
              element={<Navigate to="/employees/eleanor-shellstrop" replace />}
            />
            {/* Declare this URL match or nested layout boundary. */}
            <Route
              path="/employees/:employeeId"
              element={<EmployeeRecordPage />}
            />
            {/* Declare this URL match or nested layout boundary. */}
            <Route path="*" element={<WorkspaceNotFoundPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
