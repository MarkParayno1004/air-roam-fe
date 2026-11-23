import type { Page, StaffUser } from "@air-roam/api";
import { Card, Pill, formatDate } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { FilterInput, Pager, useFilters } from "../../components/Filters";

const PAGE = 20;

export function UsersList() {
  const { client } = useStaff();
  const f = useFilters();
  const page = Number(f.get("page") || 1);
  const qs = new URLSearchParams([...(f.get("search") ? [["search", f.get("search")]] : []), ["page", String(page)], ["page_size", String(PAGE)]]).toString();
  const { data, isLoading } = useQuery({ queryKey: ["staff-users", qs], queryFn: () => client.request<Page<StaffUser>>(`staff/users?${qs}`) });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link to="/users/new" className="inline-flex h-10 items-center rounded-button bg-primary px-5 text-sm font-semibold text-on-primary">New user</Link>
      </div>
      <Card className="p-4 sm:max-w-sm">
        <FilterInput label="Search" value={f.get("search")} onChange={(v) => f.set("search", v)} placeholder="Name or email" />
      </Card>
      <Card className="overflow-x-auto p-2">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Roles</th>
              <th className="p-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-6 text-center text-muted">Loading…</td></tr>}
            {data?.results.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-background">
                <td className="p-3 font-medium"><Link to={`/users/${u.id}`}>{u.first_name} {u.last_name}</Link></td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <div className="flex gap-1.5">
                    {(u.permissions as string[]).length ? (u.permissions as string[]).map((p) => <Pill key={p} tone="teal">{p}</Pill>) : <Pill tone="grey">traveler</Pill>}
                  </div>
                </td>
                <td className="p-3">{u.created_at ? formatDate(u.created_at) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {data && <Pager count={data.count} page={page} pageSize={PAGE} onPage={(p) => f.set("page", String(p))} />}
    </div>
  );
}
