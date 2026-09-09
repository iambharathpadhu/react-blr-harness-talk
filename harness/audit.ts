// The audit trail. Console output is for whoever's watching live — but the
// entire point of step 6 is that nobody is. This is the file you'd actually
// pull up after an unattended run to answer "what did it do while I was
// away": one JSON object per line, so it's greppable/scriptable rather than
// something a human has to eyeball, the same shape real harnesses log their
// own session transcripts in.

import fs from "node:fs";

const AUDIT_FILE = "audit.jsonl";

export interface AuditEvent {
  tool?: string;
  tier?: string;
  outcome: "run" | "blocked" | "skipped" | "denied" | "refused" | "budget-exceeded";
  detail?: string;
}

export function logAudit(event: AuditEvent): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event });
  fs.appendFileSync(AUDIT_FILE, line + "\n", "utf-8");
}
