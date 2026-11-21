"use client";

import { CrudPage } from "@/components/CrudPage";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";

export default function PatientsPage() {
  return (
    <WorkspaceLayout>
      <CrudPage type="patients" />
    </WorkspaceLayout>
  );
}
