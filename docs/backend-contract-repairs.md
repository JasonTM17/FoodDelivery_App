# Backend authorization and review rules

Restaurant staff access requires an active restaurant profile. Menu changes,
order transitions, order chat and the restaurant review dashboard enforce this
same rule. Deactivating a staff profile therefore removes access to these paths
without changing the managed/local realtime-provider choice.

The order review endpoint uses the canonical review workflow: the customer owns
the order, delivery is complete, the review is within the existing seven-day
window, and moderation and rating aggregation run together. The order endpoint
retains its existing not-found response for another customer's order and its
duplicate-review error. These rules also apply when a client uses the order
endpoint instead of the dedicated reviews controller.

Customer order pagination normalizes invalid page values to 1 and invalid limits
to 20, with a maximum of 100 items per page.

Verification for these changes included focused authorization/review/pagination
regressions, backend typecheck/build, and the backend Jest suite. Live providers,
deployed browsers and mobile devices require separate verification.
