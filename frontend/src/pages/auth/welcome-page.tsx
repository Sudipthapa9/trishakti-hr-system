import { Button } from "@/components/ui/button";
import { BrandMark } from "@/pages/auth/brand-mark";

export function WelcomePage({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] p-6">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-10 text-center shadow-[0_20px_48px_rgba(29,40,38,0.08)]">
        <div className="mb-6 flex justify-center"><BrandMark /></div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">You are signed in</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[var(--color-text-primary)]">Welcome to TSHR</h1>
        <p className="mt-5 text-base leading-7 text-[var(--color-text-secondary)]">Your Trishakti HR workspace is ready. We are building the next set of people operations tools for your team.</p>
        <div className="mt-8 flex justify-center"><Button size="lg" onClick={onContinue}>Continue to workspace</Button></div>
        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">More features are coming soon.</p>
      </div>
    </main>
  );
}
