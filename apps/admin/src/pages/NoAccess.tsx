import { Card } from "@air-roam/ui";

export function NoAccess() {
  return (
    <Card className="mx-auto mt-10 max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold">No access</h1>
      <p className="mt-2 text-sm text-muted">This screen is for admin staff. Ask an admin if you need access.</p>
    </Card>
  );
}
