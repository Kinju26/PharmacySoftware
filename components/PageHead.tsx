import type { ReactNode } from "react";

type PageHeadProps = {
  title: string;
  desc: string;
  children?: ReactNode;
};

export function PageHead({ title, desc, children }: PageHeadProps) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      <div className="head-actions">{children}</div>
    </div>
  );
}
