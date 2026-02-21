# Deploy Manual (AWS + Docker) - Backend First

คู่มือนี้ใช้สำหรับ deploy `Order-Project-Backend` ก่อน โดยอ้างอิง repo/branch ตามที่ระบุ:

- Backend: `https://github.com/ntpten-x/Order-Project-Backend.git` (`master`)
- Frontend: `https://github.com/ntpten-x/Order-Project-Frontend.git` (`master`)

เอกสารนี้โฟกัส "backend ก่อน" ให้ครบทั้ง env, database, redis, migration, seed, cronjob และ health check

## 1) ไฟล์ deploy ที่ใช้ (Backend)

อยู่ใน repo backend:

- `deploy/aws/bootstrap-backend-host.sh` : เตรียมเครื่อง EC2 ครั้งแรก
- `deploy/aws/backend.env.example` : template env production
- `deploy/aws/docker-compose.backend.prod.yml` : stack production (api + postgres + redis)
- `deploy/aws/deploy-backend-aws.sh` : deploy หลัก (build + migrate + seed + up + health + cron)
- `scripts/deploy/aws/install-backend-cron.sh` : ติดตั้ง cron retention
- `scripts/deploy/aws/run-retention-job.sh` : runner ที่ cron เรียก

## 2) เตรียม EC2

แนะนำ EC2 Linux (Amazon Linux 2023 หรือ Ubuntu) และเปิด Security Group อย่างน้อย:

- `22` สำหรับ SSH
- `3000` สำหรับ backend API
- `3001` สำหรับ frontend (ใช้ภายหลัง)

> หมายเหตุ: พอร์ต database/redis ไม่ต้องเปิด public

SSH เข้าเครื่อง:

```bash
ssh -i "/path/to/your-key.pem" ec2-user@<EC2_PUBLIC_IP>
```

## 3) Clone Backend (branch master) และ bootstrap host

```bash
sudo mkdir -p /srv/order-project
sudo chown -R $USER:$USER /srv/order-project
cd /srv/order-project
git clone --branch master --single-branch https://github.com/ntpten-x/Order-Project-Backend.git backend
cd backend
bash deploy/aws/bootstrap-backend-host.sh
```

ถ้าสคริปต์เพิ่ม user เข้า group `docker` ให้ logout/login SSH ใหม่ 1 รอบ แล้วกลับเข้ามา

## 4) ตั้งค่า env สำหรับ production

สร้างไฟล์ deploy env จาก `.env.example` ที่คุณตั้งค่าจริงไว้แล้ว:

```bash
cd /srv/order-project/backend
cp .env.example deploy/aws/backend.env
```

แก้ค่าใน `deploy/aws/backend.env` อย่างน้อย:

- `FRONTEND_URL`
- `JWT_SECRET`
- `DATABASE_PASSWORD`
- `BOOTSTRAP_ADMIN_USERNAME`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `METRICS_API_KEY`

หมายเหตุ:

- ถ้า `DATABASE_HOST` เป็น RDS และ `REDIS_URL` เป็น external Redis สคริปต์ deploy จะข้ามการ start local postgres/redis อัตโนมัติ
- `RUN_MIGRATIONS_ON_START=true` และ `RUN_RBAC_BASELINE_ON_START=true` ควรเปิดไว้สำหรับ deploy ครั้งแรก

## 5) Deploy backend แบบครบในคำสั่งเดียว

```bash
cd /srv/order-project/backend
bash deploy/aws/deploy-backend-aws.sh
```

สคริปต์นี้ทำให้ครบอัตโนมัติ:

- pull code ล่าสุดจาก `master`
- build image backend
- ตรวจ env (`npm run env:check`)
- run migration + seed (`npm run db:migrate-seed:prod`)
- start api
- health check `/health`
- install cron retention (ค่า default: `0 3 * * *`)

## 6) ตรวจสอบหลัง deploy

### 6.1 ตรวจ container

```bash
docker compose --env-file deploy/aws/backend.env -f deploy/aws/docker-compose.backend.prod.yml ps
```

### 6.2 ตรวจ API health

```bash
curl -i http://127.0.0.1:3000/health
curl -i http://<EC2_PUBLIC_IP>:3000/health
```

### 6.3 ตรวจ migration/seed ใน database

```bash
docker compose --env-file deploy/aws/backend.env -f deploy/aws/docker-compose.backend.prod.yml exec -T api npm run migration:run
docker compose --env-file deploy/aws/backend.env -f deploy/aws/docker-compose.backend.prod.yml exec -T api npm run security:rbac:bootstrap
```

### 6.4 ตรวจ redis

```bash
docker compose --env-file deploy/aws/backend.env -f deploy/aws/docker-compose.backend.prod.yml exec -T api node -e "require('./dist/src/lib/redisClient').getRedisClient().then(c=>{console.log(c?'redis-ok':'redis-not-configured');process.exit(0);})"
```

## 7) Cronjob retention

สคริปต์ deploy จะติดตั้งให้แล้ว (default `0 3 * * *`) หากต้องตั้งใหม่:

```bash
bash scripts/deploy/aws/install-backend-cron.sh \
  /srv/order-project/backend \
  /srv/order-project/backend/deploy/aws/docker-compose.backend.prod.yml \
  /srv/order-project/backend/deploy/aws/backend.env \
  "0 3 * * *"
```

ดู cron ปัจจุบัน:

```bash
crontab -l
```

รัน retention ทันทีแบบ manual:

```bash
bash scripts/deploy/aws/run-retention-job.sh
```

## 8) คำสั่ง deploy รอบถัดไป (update)

```bash
cd /srv/order-project/backend
bash deploy/aws/deploy-backend-aws.sh
```

ตัวเลือกสำคัญ:

- ไม่ pull git: `SKIP_GIT_PULL=1 bash deploy/aws/deploy-backend-aws.sh`
- ไม่ติดตั้ง cron ใหม่: `INSTALL_CRON=0 bash deploy/aws/deploy-backend-aws.sh`
- เปลี่ยนเวลา cron: `CRON_SCHEDULE="30 2 * * *" bash deploy/aws/deploy-backend-aws.sh`

## 9) Rollback แบบเร็ว

```bash
cd /srv/order-project/backend
git log --oneline -n 5
git checkout <PREVIOUS_COMMIT_OR_TAG>
SKIP_GIT_PULL=1 INSTALL_CRON=0 bash deploy/aws/deploy-backend-aws.sh
```

## 10) ถัดไป: Frontend

หลัง backend พร้อมแล้ว ค่อยทำ frontend (`Order-Project-Frontend` branch `master`) ในขั้นตอนถัดไป โดยชี้ `NEXT_PUBLIC_API_URL` ไปที่ backend (`http://<EC2_PUBLIC_IP>:3000` หรือโดเมนจริง)
