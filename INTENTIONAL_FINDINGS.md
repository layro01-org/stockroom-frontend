# Intentional Security Findings — stockroom-frontend

> **DEMO ENVIRONMENT ONLY.** This document describes security vulnerabilities that have been deliberately introduced into this codebase to demonstrate Veracode Trust Authority Phase 1. This repository is a sandboxed sample application and is never deployed to production.

---

## Purpose

These findings exist to make the Trust Authority demo realistic. When the Veracode GitHub App runs a SAST Policy Scan and SCA scan against `stockroom-frontend`, it should surface one static finding and one SCA vulnerability. The `stockroom-frontend` asset is intentionally configured as **less severe than `stockroom-api`** — its findings do not individually trigger the `Block Deployment` rule — so the Trust Engine can show a *per-service* breakdown: one service blocked, one service passing, with the overall deployment verdict still `Unsafe to Ship`.

---

## Finding 1 — Cross-Site Scripting via dangerouslySetInnerHTML (SAST)

| Attribute | Value |
| --------- | ----- |
| **Type** | Static Analysis (SAST) |
| **CWE** | CWE-79: Improper Neutralization of Input During Web Page Generation (Cross-site Scripting) |
| **Severity** | High |
| **File** | `src/components/ProductSearch.tsx` |
| **Component** | `ProductSearch` |

### What flaw was introduced

A product search component was added to the Products page that fetches results from the backend and renders them using React's `dangerouslySetInnerHTML`. The HTML string is assembled from unsanitised API response fields (`p.name`, `p.description`, `p.sku`):

```tsx
const html = data
  .map(
    (p) =>
      `<div class="result-item">
        <strong>${p.name}</strong>
        <span class="sku">${p.sku}</span>
        <span class="desc">${p.description ?? ''}</span>
      </div>`
  )
  .join('')

setResultsHtml(html)

// ...

<div dangerouslySetInnerHTML={{ __html: resultsHtml }} />
```

### Why the flaw is a finding

Any server-controlled string values (`p.name`, `p.description`) are interpolated directly into an HTML template and injected into the DOM via `dangerouslySetInnerHTML`. If a malicious actor can influence product data in the backend (e.g. via the API or a compromised database), they can store XSS payloads that execute in every user's browser when the search results render.

Veracode SAST traces the taint flow from the network response through the template literal into the `dangerouslySetInnerHTML` prop, classifying this as CWE-79 Cross-Site Scripting at High severity.

### The secure fix for the flaw (not applied — intentional)

Render each result as JSX using structured data instead of raw HTML injection:

```tsx
{data.map((p) => (
  <div key={p.id} className="result-item">
    <strong>{p.name}</strong>
    <span className="sku">{p.sku}</span>
    <span className="desc">{p.description ?? ''}</span>
  </div>
))}
```

React's JSX escapes all values automatically, eliminating the XSS vector.

---

## Finding 2 — Vulnerable Dependency: axios 0.21.1 (SCA)

| Attribute | Value |
| --------- | ----- |
| **Type** | Software Composition Analysis (SCA) |
| **Package** | `axios` |
| **Pinned version** | `0.21.1` |
| **CVE** | CVE-2021-3749 |
| **CVSS** | 7.5 (High) |
| **File** | `package.json` |

### What vulnerability was introduced

`axios` was downgraded from `^1.7.2` (safe) to `0.21.1` (vulnerable) in `package.json`.

### Why the vulnerability is a finding

CVE-2021-3749 is a Regular Expression Denial of Service (ReDoS) vulnerability in axios versions prior to `0.21.2`. The `trimRight` utility function used in axios header normalisation is susceptible to catastrophic backtracking when processing crafted input strings. An attacker who can influence HTTP response headers — e.g. via a compromised upstream service or MITM position — can send a malicious value that causes the frontend build process or server-side rendering step to consume unbounded CPU time and become unresponsive.

Patched in `axios==0.21.2`. All `axios@1.x` versions are also unaffected.

### The secure fix for the vulnerability (not applied — intentional)

Restore the version range to pick up a patched release:

```json
"axios": "^1.7.2"
```

---

## Demo Script Notes

- **Role in the demo:** `stockroom-frontend` is the *passing* service. Its policy evaluation result should be **Policy Passed** because:
  - The "Stockroom Deployment Policy" blocks on *Critical SAST* or *High SCA*. The CWE-79 finding above is High SAST (not Critical), and the `axios` CVE is High SCA — depending on exact policy rule configuration, adjust severity thresholds so this service passes while `stockroom-api` fails.
  - **Recommended policy rule tuning:** Set the SCA rule to block on Critical SCA only (not High), leaving `axios` (High) visible but non-blocking for the frontend. The `stockroom-api` SQL injection (Critical SAST) remains the sole blocker.
- **Which scan type surfaces which finding:**
  - SAST Policy Scan → Finding 1 (XSS)
  - SCA scan → Finding 2 (axios CVE)
- **Expected platform verdict:** Asset Snapshot for `stockroom-frontend` → **Policy Passed** (visible findings, but none crossing the block threshold) → Trust Engine per-service result: `PASS`.
- **Reset path:** No changes needed for `stockroom-frontend` if the policy is tuned as above. The frontend already demonstrates that findings can be present without blocking deployment when they don't breach the configured threshold — a key talking point for the demo.
