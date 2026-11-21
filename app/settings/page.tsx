"use client";

import { SettingsView } from "@/components/SettingsView";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";

export default function SettingsPage() {
  return (
    <WorkspaceLayout>
      <SettingsView />
    </WorkspaceLayout>
  );
}
