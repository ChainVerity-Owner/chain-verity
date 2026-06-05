"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Supplier, ContractContact } from "@/types";

interface ContactCardProps {
  supplier: Supplier;
}

const EMPTY: ContractContact = { name: "", title: "", email: "", phone: "" };

export function ContactCard({ supplier }: ContactCardProps) {
  const { contractContacts, setContractContact, clearContractContact } = useApp();
  const contact = contractContacts[supplier.id];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ContractContact>(EMPTY);

  function startEdit() {
    setDraft(contact ?? EMPTY);
    setEditing(true);
  }

  function handleSave() {
    if (draft.name.trim()) {
      setContractContact(supplier.id, { ...draft, name: draft.name.trim() });
    } else {
      clearContractContact(supplier.id);
    }
    setEditing(false);
  }

  function field(key: keyof ContractContact, placeholder: string, type = "text") {
    return (
      <input
        className="tb-input"
        type={type}
        placeholder={placeholder}
        value={draft[key] ?? ""}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        style={{ fontSize: 13 }}
      />
    );
  }

  const websiteClean = supplier.website?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 12, alignItems: "flex-start" }}>
        <h2 style={{ margin: 0 }}>Company Information</h2>
        {!editing && (
          <button className="btn" style={{ fontSize: 12 }} onClick={startEdit}>
            {contact ? "Edit contact" : "Add contact"}
          </button>
        )}
      </div>

      {/* General info row */}
      <div className="kv" style={{ marginBottom: 12 }}>
        {/* Website */}
        <div className="box">
          <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Website</div>
          {supplier.website ? (
            <a
              href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}
            >
              {websiteClean}
            </a>
          ) : (
            <span className="muted" style={{ fontSize: 13 }}>—</span>
          )}
        </div>

        {/* Stock symbol */}
        <div className="box">
          <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Stock Symbol</div>
          {supplier.ticker && supplier.ticker !== "null" ? (
            <a
              href={`https://finance.yahoo.com/quote/${supplier.ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "var(--accent)", textDecoration: "none" }}
            >
              {supplier.ticker}
            </a>
          ) : (
            <span className="muted" style={{ fontSize: 13 }}>Private</span>
          )}
        </div>

        {/* DUNS */}
        {supplier.duns && (
          <div className="box">
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>DUNS</div>
            <span className="mono" style={{ fontSize: 13 }}>{supplier.duns}</span>
          </div>
        )}
      </div>

      {/* Contract contact */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Contract Contact</div>

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="grid-2" style={{ gap: 8 }}>
              {field("name", "Full name *")}
              {field("title", "Job title")}
            </div>
            <div className="grid-2" style={{ gap: 8 }}>
              {field("email", "Email address", "email")}
              {field("phone", "Phone number", "tel")}
            </div>
            <div className="inline" style={{ marginTop: 4 }}>
              <button className="btn primary" style={{ fontSize: 13 }} onClick={handleSave}>Save</button>
              <button className="btn" style={{ fontSize: 13 }} onClick={() => setEditing(false)}>Cancel</button>
              {contact && (
                <button
                  className="btn"
                  style={{ fontSize: 13, color: "var(--risk)", marginLeft: "auto" }}
                  onClick={() => { clearContractContact(supplier.id); setEditing(false); }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : contact ? (
          <div className="kv">
            <div className="box">
              <div className="muted" style={{ fontSize: 11 }}>Name</div>
              <b style={{ fontSize: 13 }}>{contact.name}</b>
            </div>
            {contact.title && (
              <div className="box">
                <div className="muted" style={{ fontSize: 11 }}>Title</div>
                <b style={{ fontSize: 13 }}>{contact.title}</b>
              </div>
            )}
            {contact.email && (
              <div className="box">
                <div className="muted" style={{ fontSize: 11 }}>Email</div>
                <a href={`mailto:${contact.email}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>{contact.email}</a>
              </div>
            )}
            {contact.phone && (
              <div className="box">
                <div className="muted" style={{ fontSize: 11 }}>Phone</div>
                <a href={`tel:${contact.phone}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>{contact.phone}</a>
              </div>
            )}
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 13 }}>
            No contract contact added. Click <b>Add contact</b> to store your internal contact for this supplier.
          </div>
        )}
      </div>
    </div>
  );
}
