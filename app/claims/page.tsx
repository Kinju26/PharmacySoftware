"use client";

import { CrudPage } from "@/components/CrudPage";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";

export default function ClaimsPage() {
  return (
    <WorkspaceLayout>
      <CrudPage type="claims" />
    </WorkspaceLayout>
  );
}
