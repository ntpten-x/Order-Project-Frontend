# Deploy Update Guide (Frontend Pull Mode)

เอกสารนี้เป็นวิธี deploy frontend แบบ `pull image` บน EC2  
แนวทางนี้เหมาะกับเครื่อง AWS ที่ RAM น้อย และต้องการหลีกเลี่ยงการ build บนเซิร์ฟเวอร์

---

## ภาพรวม Flow
1. Build image บนเครื่อง local
2. Push image ไป GHCR
3. SSH เข้า EC2
4. Pull image tag ที่ต้องการ
5. Restart เฉพาะ service `frontend` ผ่าน compose
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

Build และ push (บังคับ `linux/amd64` ให้ตรง EC2)

หมายเหตุสำคัญ:
- ค่า `NEXT_PUBLIC_*` จะถูก "ฝัง" ลงใน bundle ตอน build
- ถ้าต้องการเปลี่ยน URL backend/frontend ต้อง rebuild แล้ว push image ใหม่เท่านั้น

ตั้งค่า production URLs:
```bash
EC2_IP=54.255.216.29
NEXT_PUBLIC_BACKEND_API=http://$EC2_IP:3000
NEXT_PUBLIC_API_URL=http://$EC2_IP:3001
NEXT_PUBLIC_SOCKET_URL=http://$EC2_IP:3000
NEXT_PUBLIC_SOCKET_PATH=/socket.io
```

Build + push:
```bash
docker buildx build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API=$NEXT_PUBLIC_BACKEND_API \
  --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
  --build-arg NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
  --build-arg NEXT_PUBLIC_SOCKET_PATH=$NEXT_PUBLIC_SOCKET_PATH \
  -t ghcr.io/ntpten-x/order-project-frontend:$TAG \
  -t ghcr.io/ntpten-x/order-project-frontend:latest \
  --push .
```

---

## 2) Deploy บน EC2 ด้วยวิธี Pull

SSH เข้า EC2:
```bash
ssh -i "e:/Project/pos.pem" ec2-user@54.255.216.29
```

Login GHCR บน EC2:
```bash
docker login ghcr.io -u ntpten-x
```

Pull image และ restart เฉพาะ frontend ผ่าน compose:
```bash
docker compose -f ~/docker-compose.prod.yml pull frontend
docker compose -f ~/docker-compose.prod.yml up -d frontend
```

ถ้าเปลี่ยนค่า env runtime (`~/frontend.env`) ให้ใช้:
```bash
docker compose -f ~/docker-compose.prod.yml up -d --force-recreate frontend
```

---

## 3) Verify หลัง Deploy

```bash
docker ps
docker logs pos-frontend --tail=120
curl -I http://127.0.0.1:3001
curl -I http://54.255.216.29:3001
```

คาดหวัง:
- container อยู่สถานะ `Up`
- log มี `next start` และ `Ready`
- `curl` ได้ `HTTP/1.1 200 OK`

---

## 4) ทดสอบจาก Browser
1. เปิด `http://54.255.216.29:3001`
2. Hard refresh (`Ctrl+F5`)
3. ลบ cookie ของโดเมน `54.255.216.29` แล้ว login ใหม่
4. ทดสอบ flow สำคัญ:
   - login/logout
   - switch branch
   - create/update/delete
   - หน้า Audit/หน้า POS

---

## 5) Rollback แบบเร็ว (Frontend)

ถ้าต้อง rollback แนะนำให้แก้ `image:` ใน `~/docker-compose.prod.yml` ไปใช้ tag เก่า แล้ว:

```bash
docker compose -f ~/docker-compose.prod.yml pull frontend
docker compose -f ~/docker-compose.prod.yml up -d frontend
```
