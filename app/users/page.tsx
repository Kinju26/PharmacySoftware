"use client";

import { CrudPage } from "@/components/CrudPage";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";

export default function UsersPage() {
  return (
    <WorkspaceLayout>
      <CrudPage type="users" />
    </WorkspaceLayout>
  );
}
