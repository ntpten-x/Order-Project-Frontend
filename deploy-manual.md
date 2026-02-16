# Deploy Manual (EC2 + Docker + GHCR)

คู่มือนี้สรุปขั้นตอน deploy โปรเจกต์นี้ขึ้น AWS EC2 โดยใช้ Docker images ที่ push ไปที่ GitHub Container Registry (GHCR)

## ภาพรวม

- เครื่อง Local (Windows/MINGW64): build + push images ไปที่ GHCR ด้วย `./deploy-local.sh`
- EC2 (Amazon Linux): pull images + restart containers ด้วย `~/deploy-ec2.sh`
- เว็บไซต์ใช้งานผ่าน:
  - Frontend: `http://<EC2_PUBLIC_IP>:3001`
  - Backend: `http://<EC2_PUBLIC_IP>:3000`
  - Nginx (ถ้ามี): `http://<EC2_PUBLIC_IP>/health`

## สิ่งที่ต้องมี (Prerequisites)

- Docker Desktop (บนเครื่อง Local)
- เข้าถึง GHCR ได้ (user/pass หรือ token)
- มีไฟล์ key สำหรับเข้า EC2 เช่น `pos-key.pem`
- Security Group ของ EC2 เปิดพอร์ตที่ต้องใช้:
  - `22` (SSH)
  - `80` (ถ้ามี nginx reverse proxy)
  - `3000` (backend)
  - `3001` (frontend)

## ตัวแปรที่ต้องรู้

- `EC2_PUBLIC_IP` เช่น `13.239.29.168`
- `PEM_PATH` เช่น `/e/Project/pos-key.pem`

ตัวอย่างในคู่มือนี้จะใช้:

- `EC2_PUBLIC_IP=13.239.29.168`
- `PEM_PATH=/e/Project/pos-key.pem`

## 1) Build + Push Images (ทำบนเครื่อง Local)

จากโฟลเดอร์โปรเจกต์:

```bash
cd /e/Project
./deploy-local.sh
```

สิ่งที่สคริปต์ทำ (โดยย่อ):

- `docker login ghcr.io`
- build backend image แล้ว push ไป `ghcr.io/<user>/order-project-backend:latest`
- build frontend image แล้ว push ไป `ghcr.io/<user>/order-project-frontend:latest`

ถ้าถามรหัสผ่าน GHCR ให้ใส่รหัสผ่านหรือ Token ของ GHCR

## 2) อัปโหลดสคริปต์ deploy ไป EC2 (ทำบนเครื่อง Local)

อัปโหลด `deploy-ec2.sh` ไปไว้ใน home ของ `ec2-user`:

```bash
cd /e/Project
scp -i "/e/Project/pos-key.pem" ./deploy-ec2.sh ec2-user@13.239.29.168:~/deploy-ec2.sh
```

หมายเหตุ:

- ถ้าเจอคำถาม `Are you sure you want to continue connecting (yes/no/[fingerprint])?` ให้พิมพ์ `yes`

## 3) เข้า EC2 (ทำบนเครื่อง Local)

```bash
ssh -i "/e/Project/pos-key.pem" -t ec2-user@13.239.29.168
```

## 4) Pull + Restart Containers (ทำบน EC2)

เมื่ออยู่บน EC2 แล้ว:

```bash
chmod +x ~/deploy-ec2.sh
~/deploy-ec2.sh
```

สคริปต์จะ:

- `docker login ghcr.io`
- `docker-compose -f ~/docker-compose.prod.yml pull`
- `docker-compose -f ~/docker-compose.prod.yml up -d`
- healthcheck ที่ `http://13.239.29.168/health` (ถ้าตั้งค่าไว้)

### ข้อห้ามสำคัญ: อย่า SSH ซ้อนจากใน EC2

อย่ารันคำสั่งแบบนี้ “บน EC2”:

```bash
ssh -i "/e/Project/pos-key.pem" ec2-user@13.239.29.168
```

เพราะ path `/e/Project/pos-key.pem` มีอยู่แค่ในเครื่อง Local (Windows) ไม่ได้อยู่บน EC2

อาการที่เจอจะเป็น:

- `Identity file ... not accessible`
- `Permission denied (publickey, ...)`

วิธีที่ถูกต้องคือ: เข้า EC2 แล้วรัน `~/deploy-ec2.sh` ตรง ๆ

## 5) ตรวจสอบหลัง Deploy

### เช็คจากเครื่อง Local

```bash
curl -i http://13.239.29.168/health
curl -I http://13.239.29.168:3001
curl -i http://13.239.29.168:3000/health
```

### เช็คจากบน EC2

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
curl -i http://127.0.0.1:3000/health | head -n 30
curl -I http://127.0.0.1:3001 | head -n 30
curl -i http://127.0.0.1/health | head -n 30
```

## Troubleshooting

### A) เจอ 502 ตอนเช็ค `/health`

ส่วนใหญ่เกิดช่วง nginx/upstream ยังไม่พร้อมหลัง restart ให้รอ 5-20 วินาทีแล้วลองใหม่:

```bash
curl -i http://13.239.29.168/health
```

ถ้ายัง 502:

- เช็คว่า backend ตอบได้ไหม:
  - `curl -i http://127.0.0.1:3000/health`
- เช็ค nginx logs (ถ้ามีสิทธิ์):
  - `sudo tail -n 200 /var/log/nginx/error.log`

### B) ดู log ของ containers

```bash
docker logs pos-backend --tail=200
docker logs pos-frontend --tail=200
```

### C) เช็คพอร์ตที่เปิดอยู่

```bash
sudo ss -lntp | egrep ":80|:3000|:3001" || true
```

## คำสั่งที่ใช้บ่อย (Cheat Sheet)

### อัปเดตใหม่ทั้งระบบ (ทำจากเครื่อง Local)

```bash
cd /e/Project
./deploy-local.sh
scp -i "/e/Project/pos-key.pem" ./deploy-ec2.sh ec2-user@13.239.29.168:~/deploy-ec2.sh
ssh -i "/e/Project/pos-key.pem" -t ec2-user@13.239.29.168
```

จากนั้นบน EC2:

```bash
chmod +x ~/deploy-ec2.sh
~/deploy-ec2.sh
```

