import { LoginForm } from "../auth/LoginForm";

export const meta = () => [{ title: "Log in · Air Roam" }, { name: "robots", content: "noindex" }];

export default function Login() {
  return (
    <div className="px-5 py-14">
      <LoginForm />
    </div>
  );
}
