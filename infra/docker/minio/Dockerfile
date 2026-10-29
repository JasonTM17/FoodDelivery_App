FROM golang:1.26.8-bookworm@sha256:dc9ad6c05acc7a88e5b71bde60a5fe3bd4b9f0db209011711b464107438a8107 AS builder
WORKDIR /src
# Official RELEASE.2025-10-15T17-29-55Z, including the CVE-2025-62506 fix.
ENV GOTOOLCHAIN=local CGO_ENABLED=0 GOFLAGS=-mod=readonly
RUN curl --fail --location --retry 3 \
      https://codeload.github.com/minio/minio/tar.gz/9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a \
      --output source.tar.gz \
    && echo '45521908307306e925c98d629e1c17d78c8b72b6ee242b1bfb1409f7d8ee5841  source.tar.gz' | sha256sum --check \
    && tar -xzf source.tar.gz --strip-components=1 \
    && rm source.tar.gz
RUN go mod download && go mod verify
RUN --mount=type=cache,target=/root/.cache/go-build \
    go build -tags kqueue -trimpath -buildvcs=false \
      -ldflags '-s -w -X github.com/minio/minio/cmd.Version=2025-10-15T17:29:55Z -X github.com/minio/minio/cmd.ReleaseTag=DEVELOPMENT.2025-10-15T17-29-55Z -X github.com/minio/minio/cmd.CommitID=9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a -X github.com/minio/minio/cmd.ShortCommitID=9e49d5e7a648' \
      -o /out/minio .

FROM debian:bookworm-slim@sha256:99c0b25c46d0214d5a2091092e7908907dcaecd6a962cde0ac700acee222b6f3
RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir /data && chown 65532:65532 /data
COPY --from=builder /out/minio /usr/local/bin/minio
COPY --from=builder /src/LICENSE /usr/share/licenses/minio/LICENSE
LABEL org.opencontainers.image.source="https://github.com/minio/minio" \
      org.opencontainers.image.revision="9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a" \
      org.opencontainers.image.licenses="AGPL-3.0-only"
USER 65532:65532
EXPOSE 9000 9001
VOLUME ["/data"]
ENTRYPOINT ["minio"]
CMD ["server", "--console-address", ":9001", "/data"]
