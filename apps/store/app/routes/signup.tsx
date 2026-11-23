import { SignupForm } from "../auth/SignupForm";

export const meta = () => [{ title: "Create an account · Air Roam" }, { name: "robots", content: "noindex" }];

export default function Signup() {
  return (
    <div className="px-5 py-14">
      <SignupForm />
    </div>
  );
}
