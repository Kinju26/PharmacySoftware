"use client";

import { CrudPage } from "@/components/CrudPage";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";

export default function LocationsPage() {
  return (
    <WorkspaceLayout>
      <CrudPage type="locations" />
    </WorkspaceLayout>
  );
}
