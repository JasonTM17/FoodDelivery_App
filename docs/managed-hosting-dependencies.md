# Managed hosting dependency checkpoint

The hosted-runtime work updates the backend to patched NestJS 11 releases and refreshes its lockfile. Security overrides pin fixes in the HTTP/multipart, proxy address, Socket.IO, YAML, glob expansion, gRPC and Firebase dependency paths. Zod 4 requires an explicit string key schema for promotion targeting records; the accepted JSON object shape remains unchanged. Nodemailer 10 preserves the existing SMTP transport boundary.

The observed production audit after resolution reports 0 critical, 0 high, 5 moderate advisories. The remaining moderate paths involve stream-json, decode-uri-component and js-yaml; this is a bounded dependency checkpoint, not a claim of complete application security. Optional mail, SMS, payment, maps and AI integrations need real provider configuration and separate live evidence.

Package install hooks are explicitly allowed or denied in pnpm-workspace.yaml. The optional Parcel watcher native hook is disabled; the application does not depend on it for production request processing.
