"use client";

import { useApp } from "@/context/AppContext";
import { useEffect } from "react";

export function Modal() {
  const { modal, closeModal } = useApp();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modal.open) closeModal();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [modal.open, closeModal]);

  if (!modal.open) return null;

  return (
    <div
      id="modal"
      style={{ display: "flex" }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div id="modal-card">
        <div className="row" style={{ marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{modal.title}</div>
            <div className="muted" style={{ fontSize: 12 }}>{modal.sub}</div>
          </div>
          <button className="btn" onClick={closeModal}>Close</button>
        </div>
        <div className="divider" />
        <div>{modal.body}</div>
      </div>
    </div>
  );
}
