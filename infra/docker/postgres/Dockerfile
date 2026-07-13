FROM postgis/postgis:16-3.4-alpine@sha256:681931a625df344215e9b8998bf34daf146b6a395ceacee4439eb9c85869239f

# The RAG knowledge base stores 1536-dimension embeddings in pgvector while
# core FoodFlow tables use PostGIS geography types. The PostGIS Alpine image
# ships PostgreSQL under /usr/local, whereas Alpine packages pgvector under
# /usr/lib/postgresql16. Install the supported package, then place its stable
# PostgreSQL-16 extension artifacts where the PostGIS server discovers them.
RUN apk add --no-cache postgresql-pgvector=0.6.2-r0 \
    && cp /usr/lib/postgresql16/vector.so /usr/local/lib/postgresql/vector.so \
    && cp /usr/share/postgresql16/extension/vector* /usr/local/share/postgresql/extension/
