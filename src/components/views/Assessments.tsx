"use client";

import { useState } from "react";
import { KpiCardV2 } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useApp, useSuppliers } from "@/context/AppContext";
import { Assessment, AssessmentStatus } from "@/types";

function statusVariant(s: AssessmentStatus) {
  if (s === "Completed") return "ok" as const;
  if (s === "In Progress") return "info" as const;
  if (s === "Overdue") return "risk" as const;
  if (s === "Sent") return "warn" as const;
  return "muted-b" as const;
}

const TEMPLATES = [
  { id: "ESG-001", name: "ESG & Sustainability Questionnaire", questions: 42 },
  { id: "FIN-001", name: "Financial Health Self-Assessment", questions: 28 },
  { id: "OPS-001", name: "Operational Resilience Assessment", questions: 35 },
  { id: "CYB-001", name: "Cybersecurity Posture Questionnaire", questions: 31 },
];

export function Assessments() {
  const { setRoute, platformAssessments } = useApp();
  const suppliers = useSuppliers();
  const [assessments, setAssessments] = useState<Assessment[]>(platformAssessments);
  const [sentId, setSentId] = useState<string | null>(null);

  const completed = assessments.filter((a) => a.status === "Completed").length;
  const overdue = assessments.filter((a) => a.status === "Overdue").length;
  const inProgress = assessments.filter((a) => a.status === "In Progress").length;
  const totalFlags = assessments.reduce((a, b) => a + b.riskFlags, 0);
  const avgCompletion = Math.round(
    assessments
      .filter((a) => a.status !== "Not Sent")
      .reduce((a, b) => a + b.completionPct, 0) /
      Math.max(assessments.filter((a) => a.status !== "Not Sent").length, 1)
  );

  function handleSend(supplierId: string) {
    setSentId(supplierId);
    setAssessments((prev) =>
      prev.map((a) =>
        a.supplierId === supplierId && a.status === "Not Sent"
          ? {
              ...a,
              status: "Sent" as AssessmentStatus,
              sentDate: new Date().toISOString().split("T")[0],
              dueDate: new Date(Date.now() + 14 * 86400000)
                .toISOString()
                .split("T")[0],
            }
          : a
      )
    );
    setTimeout(() => setSentId(null), 2000);
  }

  function handleRemind(supplierId: string) {
    setSentId(supplierId + "-remind");
    setTimeout(() => setSentId(null), 1500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPIs */}
      <div className="grid-4">
        <KpiCardV2
          label="Completed"
          value={`${completed}/${assessments.length}`}
          sub="Supplier assessments"
          accent="var(--ok)"
          icon="✅"
        />
        <KpiCardV2
          label="Avg Completion"
          value={`${avgCompletion}%`}
          sub="Across active assessments"
          accent="var(--accent)"
          icon="📋"
        />
        <KpiCardV2
          label="Overdue"
          value={String(overdue)}
          sub="Past due date"
          accent="var(--risk)"
          icon="⏰"
        />
        <KpiCardV2
          label="Risk Flags Raised"
          value={String(totalFlags)}
          sub="Across all responses"
          accent="var(--warn)"
          icon="🚩"
        />
      </div>

      {/* Overdue banner */}
      {overdue > 0 && (
        <div
          style={{
            background: "rgba(220,38,38,.07)",
            border: "1px solid rgba(220,38,38,.2)",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18 }}>⏰</span>
          <div>
            <div
              style={{ fontWeight: 700, color: "var(--risk)", fontSize: 13 }}
            >
              {overdue} assessment{overdue > 1 ? "s" : ""} overdue
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Send reminders to suppliers who have not completed their
              questionnaire by the due date.
            </div>
          </div>
        </div>
      )}

      {/* Assessment table */}
      <div className="card">
        <h2>Supplier Assessment Register</h2>
        <div className="card-sub">
          Self-assessment questionnaires · ESG · Financial health · Operational resilience
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Template</th>
                <th>Sent</th>
                <th>Due</th>
                <th>Status</th>
                <th>Completion</th>
                <th>Risk Flags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => {
                const supplier = suppliers.find(
                  (s) => s.id === a.supplierId
                );
                const isSending = sentId === a.supplierId;
                const isReminding = sentId === a.supplierId + "-remind";
                return (
                  <tr key={a.supplierId}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{a.supplierName}</div>
                      {supplier && (
                        <div className="muted" style={{ fontSize: 11 }}>
                          Tier {supplier.tier} · {supplier.region}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>{a.templateName}</td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {a.sentDate ?? "—"}
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        color:
                          a.status === "Overdue"
                            ? "var(--risk)"
                            : "inherit",
                        fontWeight: a.status === "Overdue" ? 700 : 400,
                      }}
                    >
                      {a.dueDate ?? "—"}
                    </td>
                    <td>
                      <Badge variant={statusVariant(a.status)}>
                        {a.status}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            borderRadius: 999,
                            background: "var(--line)",
                            overflow: "hidden",
                            minWidth: 60,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${a.completionPct}%`,
                              borderRadius: 999,
                              background:
                                a.completionPct === 100
                                  ? "var(--ok)"
                                  : a.status === "Overdue"
                                  ? "var(--risk)"
                                  : "var(--accent)",
                              transition: "width .5s ease",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            minWidth: 32,
                            color:
                              a.completionPct === 100
                                ? "var(--ok)"
                                : "var(--text)",
                          }}
                        >
                          {a.completionPct}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {a.riskFlags > 0 ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              a.riskFlags >= 3
                                ? "var(--risk)"
                                : "var(--warn)",
                          }}
                        >
                          {a.riskFlags} flag{a.riskFlags > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {a.status === "Not Sent" && (
                          <button
                            className={`btn primary`}
                            style={{ fontSize: 12 }}
                            onClick={() => handleSend(a.supplierId)}
                          >
                            {isSending ? "Sent ✓" : "Send"}
                          </button>
                        )}
                        {(a.status === "Sent" ||
                          a.status === "Overdue" ||
                          a.status === "In Progress") && (
                          <button
                            className="btn"
                            style={{ fontSize: 12 }}
                            onClick={() => handleRemind(a.supplierId)}
                          >
                            {isReminding ? "Sent ✓" : "Remind"}
                          </button>
                        )}
                        {a.status === "Completed" && supplier && (
                          <button
                            className="btn"
                            style={{ fontSize: 12 }}
                            onClick={() =>
                              setRoute("supplier", { id: supplier.id })
                            }
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template library */}
      <div className="card">
        <h2>Assessment Template Library</h2>
        <div className="card-sub">
          Standardised questionnaire templates for supplier due diligence
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            marginTop: 14,
          }}
        >
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: 14,
                background: "var(--surface)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    marginBottom: 4,
                  }}
                >
                  {t.id}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                  {t.questions} questions
                </div>
              </div>
              <button className="btn" style={{ fontSize: 12, flexShrink: 0 }}>
                Preview
              </button>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 12 }}>
          Templates are customisable. Responses are analysed by Chain Verity AI to surface risk flags automatically.
        </div>
      </div>

      {/* In-progress detail */}
      {assessments.filter(
        (a) => a.status === "In Progress" || a.status === "Completed"
      ).length > 0 && (
        <div className="card">
          <h2>Risk Flag Summary</h2>
          <div className="card-sub">
            Automatically flagged responses from supplier assessments
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 14,
            }}
          >
            {assessments
              .filter((a) => a.riskFlags > 0)
              .sort((a, b) => b.riskFlags - a.riskFlags)
              .map((a) => (
                <div key={a.supplierId} className="item" style={{ cursor: "default" }}>
                  <div className="row">
                    <div>
                      <span style={{ fontWeight: 700 }}>{a.supplierName}</span>
                      <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
                        {a.templateName}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                      <span
                        style={{
                          fontWeight: 800,
                          color:
                            a.riskFlags >= 3 ? "var(--risk)" : "var(--warn)",
                          fontSize: 15,
                        }}
                      >
                        {a.riskFlags} risk flag{a.riskFlags > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {a.status === "Completed" && (
                    <div
                      className="muted"
                      style={{ fontSize: 12, marginTop: 4 }}
                    >
                      Completed {a.completedDate} · Flagged items require manual review before supplier approval.
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
