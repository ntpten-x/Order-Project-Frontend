# Deploy Update Guide (Frontend Pull Mode)

เอกสารนี้เป็นวิธี deploy frontend แบบ `pull image` บน EC2  
แนวทางนี้เหมาะกับเครื่อง AWS ที่ RAM น้อย และต้องการหลีกเลี่ยงการ build บนเซิร์ฟเวอร์

---

## ภาพรวม Flow
1. Build image บนเครื่อง local
2. Push image ไป GHCR
3. SSH เข้า EC2
4. Pull image tag ที่ต้องการ
5. Restart container `order-frontend`
6. Verify

---

## 1) Build + Push จากเครื่อง local (Windows/MINGW)

ไปที่โปรเจกต์ frontend:
```bash
cd /e/Project/Order-Project-Frontend
```

Login GHCR:
```bash
docker login ghcr.io -u ntpten-x
```

กำหนด tag (ใช้รูปแบบวันที่+ชื่องาน):
```bash
TAG=20260217-frontend-release
```

Build และ push (บังคับ `linux/amd64` ให้ตรง EC2):
```bash
docker buildx build \
  --platform linux/amd64 \
  -t ghcr.io/ntpten-x/order-project-frontend:$TAG \
  -t ghcr.io/ntpten-x/order-project-frontend:latest \
  --push .
```

---

## 2) Deploy บน EC2 ด้วยวิธี Pull

SSH เข้า EC2:
```bash
ssh -i "e:/Project/pos-key.pem" ec2-user@13.239.29.168
```

ไปที่โฟลเดอร์ frontend:
```bash
cd /srv/order-project/frontend
```

Login GHCR บน EC2:
```bash
docker login ghcr.io -u ntpten-x
```

ตั้ง tag เดียวกับที่ build จาก local:
```bash
TAG=20260217-frontend-release
```

Pull image:
```bash
docker pull ghcr.io/ntpten-x/order-project-frontend:$TAG
```

---

## 3) ตั้งค่า `.env.production`

ถ้ายังไม่มีไฟล์:
```bash
cp .env.example .env.production
```

ตั้งค่าให้ชี้ backend production:
```bash
sed -i 's|^NEXT_PUBLIC_BACKEND_API=.*|NEXT_PUBLIC_BACKEND_API=http://13.239.29.168:3000|' .env.production
sed -i 's|^NODE_ENV=.*|NODE_ENV=production|' .env.production
```

ตรวจค่าที่สำคัญ:
```bash
grep -E '^(NEXT_PUBLIC_BACKEND_API|NODE_ENV)=' .env.production
```

---

## 4) Restart Frontend Container

```bash
docker rm -f order-frontend 2>/dev/null || true
docker run -d \
  --name order-frontend \
  --restart unless-stopped \
  --env-file .env.production \
  -p 3001:3001 \
  ghcr.io/ntpten-x/order-project-frontend:$TAG
```

---

## 5) Verify หลัง Deploy

```bash
docker ps --filter "name=order-frontend"
docker logs --tail=120 order-frontend
curl -I http://127.0.0.1:3001
curl -I http://13.239.29.168:3001
```

คาดหวัง:
- container อยู่สถานะ `Up`
- log มี `next start` และ `Ready`
- `curl` ได้ `HTTP/1.1 200 OK`

---

## 6) ทดสอบจาก Browser
1. เปิด `http://13.239.29.168:3001`
2. Hard refresh (`Ctrl+F5`)
3. ลบ cookie ของโดเมน `13.239.29.168` แล้ว login ใหม่
4. ทดสอบ flow สำคัญ:
   - login/logout
   - switch branch
   - create/update/delete
   - หน้า Audit/หน้า POS

---

## 7) Rollback แบบเร็ว (Frontend)

ดู image tags ที่มี:
```bash
docker images | grep order-project-frontend
```

รันย้อนกลับไป tag เก่า:
```bash
OLD_TAG=<old_tag_here>
docker rm -f order-frontend
docker run -d \
  --name order-frontend \
  --restart unless-stopped \
  --env-file .env.production \
  -p 3001:3001 \
  ghcr.io/ntpten-x/order-project-frontend:$OLD_TAG
```

