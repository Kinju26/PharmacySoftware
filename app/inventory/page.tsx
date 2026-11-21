"use client";

import { CrudPage } from "@/components/CrudPage";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";

export default function InventoryPage() {
  return (
    <WorkspaceLayout>
      <CrudPage type="inventory" />
    </WorkspaceLayout>
  );
}
