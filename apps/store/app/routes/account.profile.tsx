import { ProfileForm } from "../account/ProfileForm";

export default function Profile() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">Profile & address</h1>
      <ProfileForm />
    </div>
  );
}
