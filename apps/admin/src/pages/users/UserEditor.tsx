import type { StaffUser } from "@air-roam/api";
import { Button, Card } from "@air-roam/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useStaff } from "../../auth/StaffProvider";
import { BackLink } from "../../components/BackLink";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { errorMessage, toFieldErrors } from "../../lib/errors";
import { UserForm, type UserPayload } from "./UserForm";

export function UserEditor() {
  const { id } = useParams();
  const { client, user: me } = useStaff();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({ queryKey: ["staff-user", id], queryFn: () => client.request<StaffUser>(`staff/users/${id}`), enabled: !!id });
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(p: UserPayload) {
    try {
      if (id) await client.request(`staff/users/${id}`, { method: "PATCH", json: p });
      else await client.request("staff/users", { method: "POST", json: p });
    } catch (err) {
      throw toFieldErrors(err);
    }
    await qc.invalidateQueries({ queryKey: ["staff-users"] });
    navigate("/users");
  }

  async function remove() {
    try {
      await client.request(`staff/users/${id}`, { method: "DELETE" });
      await qc.invalidateQueries({ queryKey: ["staff-users"] });
      navigate("/users");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (id && isLoading) return <p className="text-muted">Loading…</p>;
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <BackLink to="/users" />
      <h1 className="text-2xl font-bold">{id ? "Edit user" : "New user"}</h1>
      <Card className="p-6">
        <UserForm initial={user ?? null} onSave={save} onCancel={() => navigate("/users")} />
      </Card>
      {id && user && user.id !== me?.id && (
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="font-semibold">Remove user</h2>
          <p className="text-sm text-muted">They can no longer sign in. Their orders stay on record.</p>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          {confirm ? (
            <ConfirmDialog title={`Remove ${user.email}?`} message="This is a soft delete; the email stays reserved." confirmLabel="Remove" onConfirm={remove} onCancel={() => setConfirm(false)} />
          ) : (
            <Button variant="secondary" className="self-start text-danger" onClick={() => setConfirm(true)}>Remove user</Button>
          )}
        </Card>
      )}
    </div>
  );
}
