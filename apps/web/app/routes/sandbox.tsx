import { createFileRoute } from "@tanstack/react-router";
import { SandboxProvider } from "../stores/sandbox";
import { AtlasServicesProvider } from "../stores/atlas";
import { SandboxLayout } from "../components/sandbox/SandboxLayout";

export const Route = createFileRoute("/sandbox")({
  component: SandboxPage,
});

function SandboxPage() {
  return (
    <SandboxProvider>
      <AtlasServicesProvider>
        <SandboxLayout />
      </AtlasServicesProvider>
    </SandboxProvider>
  );
}
