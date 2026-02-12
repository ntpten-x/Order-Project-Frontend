# คู่มือการรันด้วย Docker (Frontend)

## 0. คำสั่งรันแบบด่วน (สำหรับเริ่มงานปกติ)
```bash
docker-compose up -d
```

---

## 1. การอัปเดตและรันใหม่ (เมื่อแก้ไขโค้ดเสร็จ)
เนื่องจาก Next.js ต้องมีการ Compile โค้ดใหม่ทุกครั้งที่มีการเปลี่ยนแปลง คุณ **ต้องรันคำสั่ง Build ใหม่เสมอ** ดังนี้:

```bash
docker-compose up -d --build
```

---

## 2. กรณีแก้ไขไฟล์ .env หรือพอร์ต
หากคุณมีการแก้ไขไฟล์ `.env` หรือแก้ไขพอร์ตใน `docker-compose.yml` ให้รันคำสั่งนี้เพื่อให้แน่ใจว่า Docker นำค่าใหม่ไปใช้:

```bash
docker-compose up -d --build --force-recreate
```

---

## 3. คำสั่งที่จำเป็นอื่นๆ

### ดู Log การทำงาน (เพื่อเช็ค Error ฝั่งหน้าบ้าน)
```bash
docker-compose logs -f web
```

### ตรวจสอบว่า Container รันอยู่หรือไม่
```bash
docker status
```

### หยุดการทำงาน
```bash
docker-compose down
```

---

## ข้อควรระวัง (Tips)
*   **Next.js Build Time**: การ Build ฝั่ง Frontend อาจใช้เวลาสักครู่ (2-5 นาที) ขึ้นอยู่กับขนาดของโปรเจกต์
*   **Browser Cache**: หากอัปเดตโค้ดแล้วหน้าเว็บไม่เปลี่ยน ให้ลองกด `Ctrl + F5` ใน Browser เพื่อล้าง Cache ครับ
