"use client";

import { CrudPage } from "@/components/CrudPage";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";

export default function PrescriptionsPage() {
  return (
    <WorkspaceLayout>
      <CrudPage type="prescriptions" />
    </WorkspaceLayout>
  );
}
