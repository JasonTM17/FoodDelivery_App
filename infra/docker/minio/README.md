# Local/CI MinIO source build

The removed Docker Hub image is replaced by a local build of official release
`RELEASE.2025-10-15T17-29-55Z`, commit
`9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a`. The Dockerfile verifies the archive
SHA-256 and Go module checksums, disables automatic Go toolchain downloads and
pins builder/runtime image digests. MinIO's upstream license is included in the
runtime image. No image is published to another registry by this change.

The executable is labelled as a development build from that exact release source,
with fixed version/commit metadata. Base image digests and source/module inputs
are pinned; Debian packages installed by apt still follow its repository. This
does not claim byte-identical output across rebuild dates.

The upstream community repository is archived. This build restores the isolated
development/CI S3 compatibility profile; it is not a maintained production storage
recommendation. Managed hosting still uses Supabase Storage. Keep ports9000/9001,
credentials, `/data`, command and health endpoint compatible with Compose.

Build: `docker compose build minio`.
Check: start a disposable container, verify `/minio/health/live`, then use the
backend MinIO SDK to create a bucket and upload/read/delete a synthetic object.
Do not reuse or reset an existing development volume for this check.

Sources: [official release](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z),
[source-only distribution](https://github.com/minio/minio#source-only-distribution).
