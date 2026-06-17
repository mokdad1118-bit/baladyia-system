import { type ReactNode } from "react";
import { NavigationWaitGate } from "@/components/NavigationWaitGate";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function WorkspaceShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: ReactNode;
  children: ReactNode;
}) {
  return (
    <NavigationWaitGate className="gov-pattern-bg min-h-dvh grid gap-8 lg:grid-cols-[15.5rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-20">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">{title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">{nav}</CardContent>
        </Card>
      </aside>
      <div className="min-w-0">{children}</div>
    </NavigationWaitGate>
  );
}
