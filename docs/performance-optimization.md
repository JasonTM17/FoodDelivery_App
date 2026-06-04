# Performance Optimization Guide

## Database

- Enable query logging in development: `prisma.$on('query', console.log)`
- Add missing indexes identified by `EXPLAIN ANALYZE`
- Use `SELECT ... FOR UPDATE` for concurrent operations
- Batch INSERTs for driver location history (15s batches)

## Redis

- Monitor memory usage: `redis-cli INFO memory`
- Eviction policy: `allkeys-lru`
- Pipeline commands for batch operations
- GEO queries with radius limits to prevent O(n) scans

## WebSocket

- Server-side throttle: max 1 broadcast per 2s per room
- Location updates: skip if position changed < 5 meters
- Clean up stale room subscriptions (TTL on heartbeat)

## NestJS

- Enable compression middleware for large responses
- Use `@nestjs/cache-manager` for query result caching
- Offload CPU work to BullMQ workers
- Set proper connection pool sizes for PostgreSQL and Redis

## Flutter

- CachedNetworkImage for food photos
- ListView.builder for long scrollable lists
- Dispose controllers in `dispose()` to prevent memory leaks
- Use `const` constructors where possible
