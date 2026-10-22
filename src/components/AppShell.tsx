"use client";

import dynamic from "next/dynamic";

/**
 * Client-only entry point for the application.
 *
 * Chain Verity is a strict SPA: the route comes from `window.location.hash`,
 * the client mode from the query string, and theme, role, notes, archives and
 * risk appetite from `localStorage`. None of that exists during prerender, so
 * AppProvider's initial state could never match on both sides — every page load
 * threw a hydration error and briefly painted the wrong dataset (the server
 * resolved client mode to "wb" and rendered the Worcester Bosch universe before
 * the client corrected it to Meridian).
 *
 * Per the Next.js SPA guide ("Rendering components only in the browser"), the
 * fix is to disable prerendering for the app tree rather than patch each
 * browser read individually. `ssr: false` is only valid inside a Client
 * Component, which is why this wrapper exists — `app/page.tsx` is a Server
 * Component and cannot pass that option itself.
 */
const ChainVerityApp = dynamic(
  () => import("./ChainVerityApp").then((m) => m.ChainVerityApp),
  { ssr: false, loading: () => <AppSplash /> }
);

/** Prerendered placeholder. Uses theme tokens so it inherits light/dark. */
function AppSplash() {
  return (
    <div
      role="status"
      aria-label="Loading Chain Verity"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          border: "2.5px solid var(--text)",
          borderRadius: 5,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          fontSize: 11,
          letterSpacing: ".24em",
          fontWeight: 600,
          color: "var(--muted)",
        }}
      >
        CHAIN VERITY
      </div>
    </div>
  );
}

export function AppShell() {
  return <ChainVerityApp />;
}
