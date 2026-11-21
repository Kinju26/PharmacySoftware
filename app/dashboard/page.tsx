"use client";

import { DashboardView } from "@/components/DashboardView";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";

export default function DashboardPage() {
  return (
    <WorkspaceLayout>
      <DashboardView />
    </WorkspaceLayout>
  );
}
