# Stock Go-Live Checklist (Phase 9)

## 1) Functional E2E

- [ ] Login user A and user B successfully (`/api/auth/login`, `/api/auth/me`)
- [ ] Create stock order and confirm purchase case `ครบ` (ordered=3, actual=3)
- [ ] Create stock order and confirm purchase case `ขาด` (ordered=3, actual=2)
- [ ] Create stock order and confirm purchase case `เกิน` (ordered=3, actual=5)
- [ ] Create stock order and confirm purchase case `ไม่ซื้อบางรายการ` (item A purchased, item B not purchased)
- [ ] Multi-user concurrency on same order:
  - [ ] concurrent update from A/B on pending order
  - [ ] concurrent purchase confirm from A/B
  - [ ] exactly one request succeeds after status changes to completed

## 2) Performance (production-like)

- [ ] Seed large pending list (default 120 orders)
- [ ] Verify list+paging endpoint under load (`/api/stock/orders?status=pending&page&limit`)
- [ ] Verify concurrent update workload (`PUT /api/stock/orders/:id`)
- [ ] Verify concurrent purchase workload (`POST /api/stock/orders/:id/purchase`)
- [ ] Validate thresholds:
  - [ ] `default` profile: list p95 <= 900ms, update p95 <= 2200ms, purchase p95 <= 2200ms
  - [ ] `strict` profile: list p95 <= 450ms, update p95 <= 650ms, purchase p95 <= 800ms

## 3) Data Integrity / Safety

- [ ] update order allowed only when status = pending
- [ ] confirm purchase allowed only when status = pending
- [ ] confirm purchase rejects payload ingredient not in order
- [ ] confirm purchase handles missing items by persisting `actual_quantity=0`, `is_purchased=false`

## 4) Release Gate

- [ ] `npm run build` passes
- [ ] `npm run test:go-live:phase9` passes
- [ ] `npm run test:go-live:phase9:signoff` passes
- [ ] No unresolved P0/P1 findings in stock flow

## Commands

```bash
npm run test:go-live:phase9
npm run perf:stock:phase9
npm run test:go-live:phase9:signoff
```

## Optional tuning env

```bash
PERF_STOCK_ORDERS=200
PERF_PROFILE=strict
SIGNOFF_SCOPE=full
```
