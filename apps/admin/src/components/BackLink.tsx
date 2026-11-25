import { Link, useNavigate } from "react-router";

/** Back arrow for detail pages: returns to where staff came from (filters kept), or to the list if opened directly. */
export function BackLink({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <Link
      to={to}
      onClick={(e) => {
        // React Router keeps its position in history.state.idx; 0 means there is no app page behind this one.
        const plainClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
        if (plainClick && window.history.state?.idx > 0) {
          e.preventDefault();
          navigate(-1);
        }
      }}
      className="-ml-2 inline-flex h-11 items-center gap-2 self-start rounded-button px-2 text-sm font-semibold text-muted hover:bg-primary-soft hover:text-primary"
    >
      <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
      Back
    </Link>
  );
}
