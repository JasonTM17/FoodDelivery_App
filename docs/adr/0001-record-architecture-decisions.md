# 1. Record Architecture Decisions

Date: 2026-06-07

## Status

Accepted

## Context

FoodFlow is a multi-client food delivery platform. Architectural decisions are made across backend (NestJS), mobile (Flutter), and web (Next.js). Without a lightweight record-keeping process these decisions exist only in chat history and get re-litigated.

## Decision

We will use Architecture Decision Records (ADRs) stored in `docs/adr/` to document every significant architectural decision. Each ADR is a separate markdown file numbered sequentially. ADRs are append-only; superseded decisions get a new ADR rather than an edit.

File naming: `NNNN-short-kebab-title.md`. The template lives at `docs/adr/template.md`.

## Consequences

### Positive

- New contributors understand *why* things are built the way they are.
- Decisions are not re-litigated without new evidence.
- Git history shows when decisions changed.

### Negative

- Small overhead per decision to write the ADR.

### Neutral

- ADRs describe intent at the time of writing; they may not reflect current code if superseded.

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| Wiki pages | Editable in place — history gets lost, drift is invisible |
| Comments in code | Code-local only, not queryable as a decision history |
| No records | Default state — re-litigation cost is too high at this scale |

## References

- [Documenting Architecture Decisions — Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
