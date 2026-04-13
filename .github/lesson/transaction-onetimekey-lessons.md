# Lessons Learned: One-Time Key Callback Flow

Date: 2026-04-11

## What Worked Well

1. Dedicated response model
- Using a specific `TransactionViewResponse` avoided mixing admin DTO structure with public callback data.

2. Explicit success completion endpoint
- Calling `/api/payments/complete/{transactionId}` on success callback made one-time key behavior explicit and easier to reason about.

3. Fallback UX states
- Designing for three states (first view, already viewed, not found) reduced confusion and prevented empty or misleading key UI.

4. Non-cached request strategy
- `cache: 'no-store'` helps keep one-time key visibility aligned with backend state transitions.

## Pitfalls To Avoid

1. Reusing admin-only transaction fetch for public callbacks
- This leads to authorization failures for real users coming from payment redirects.

2. Auto-refetch on callback page
- Any unintended refetch can consume one-time reveal windows and cause accidental key loss in UI.

3. Rendering key placeholders when null
- Showing empty key boxes suggests a bug. Use guidance text instead when key is no longer viewable.

## Recommended Follow-Ups

1. Add integration tests
- Add Playwright flow for:
  - first success load shows key
  - refresh hides key when viewed
  - failed route never shows key

2. Audit callback deep links
- Confirm payment provider redirect always sends stable transaction IDs and no client-only dependence.

3. Add analytics for support triage
- Track callback outcomes (success-key-shown, success-key-already-viewed, not-found) to reduce support turnaround.
