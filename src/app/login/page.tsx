"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, from }),
      });
      if (res.ok) {
        const { redirect } = await res.json();
        window.location.href = redirect;
      } else {
        setError("Incorrect password. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 4px 24px rgba(0,0,0,.08)",
        border: "1px solid #e2e8f0",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/logo-light.png"
            alt="Chain Verity"
            style={{ height: 48, margin: "0 auto", display: "block" }}
          />
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
            Demo Access
          </div>
          <div style={{ fontSize: 14, color: "#64748b" }}>
            Enter the access password to continue
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 15,
                border: error ? "1px solid #dc2626" : "1px solid #cbd5e1",
                borderRadius: 8,
                outline: "none",
                boxSizing: "border-box",
                background: "#fff",
                color: "#0f172a",
                transition: "border-color .15s",
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 13,
              color: "#dc2626",
              marginBottom: 14,
              padding: "8px 12px",
              background: "#fef2f2",
              borderRadius: 6,
              border: "1px solid #fecaca",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: 15,
              fontWeight: 600,
              background: loading || !password ? "#94a3b8" : "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "background .15s",
            }}
          >
            {loading ? "Verifying…" : "Access Demo →"}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: 28,
          fontSize: 12,
          color: "#94a3b8",
        }}>
          Chain Verity · Supply Chain Risk Intelligence
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
