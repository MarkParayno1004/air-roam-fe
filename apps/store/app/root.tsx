import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, Link } from "react-router";
import "./app.css";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Providers } from "./components/Providers";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0B6E6A" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" type="image/png" href="/favicon.png" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true } } }));
  return (
    <QueryClientProvider client={client}>
      <Providers>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </Providers>
    </QueryClientProvider>
  );
}

export function HydrateFallback() {
  return <p className="p-10 text-center text-muted">Loading Air Roam…</p>;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-3xl font-bold">{notFound ? "Page not found" : "Something went wrong"}</h1>
      <p className="mt-3 text-muted">{notFound ? "This page doesn't exist." : "Please try again in a moment."}</p>      <Link to="/" className="mt-6 inline-block font-semibold text-primary">Back to home</Link>
    </div>
  );
}
