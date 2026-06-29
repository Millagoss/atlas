import { createFileRoute } from "@tanstack/react-router";
import { SandboxProvider } from "../stores/sandbox";
import { SandboxLayout } from "../components/sandbox/SandboxLayout";

export const Route = createFileRoute("/sandbox")({
  component: SandboxPage,
});

function SandboxPage() {
  return (
    <SandboxProvider>
      <SandboxLayout />
    </SandboxProvider>
  );
}
