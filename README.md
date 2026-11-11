# Baekhawhom

หน้าเว็บขายไอดีเกมธีม Creamy Gothic พร้อมหน้าจัดการรายการไอดี

## Routes
- `/` — หน้าร้านและช่องทางติดต่อ
- `/accounts` — แคตตาล็อกไอดี แยกหมวดและสถานะ
- `/admin/accounts` — หลังบ้านสำหรับผู้ดูแล

## Account categories and status
- หมวดหมู่: `chicken_skin` (ไอดีไก่สกิน), `normal` (ไอดีปกติ)
- สถานะ: `available` (พร้อมขาย), `sold` (ขายแล้ว)

## Run locally
```bash
npm install
npm run dev
```
จากนั้นเปิด http://localhost:3000

## Supabase setup
1. สร้าง Supabase project
2. รัน SQL ใน `supabase/migrations/20261111_account_categories.sql` ผ่าน SQL Editor
3. ใส่ Project URL และ anon/publishable key ใน `public/assets/js/config.js`
4. สร้างผู้ใช้ผ่าน Supabase Authentication
5. กำหนด `app_metadata.role = admin` ให้บัญชีผู้ดูแลผ่านช่องทางที่ปลอดภัย (เช่น Supabase Dashboard หรือ server-side Admin API) เพื่อให้ผ่าน RLS policy
6. เปิด `/admin/accounts` แล้วเข้าสู่ระบบ

**ห้ามใส่ service_role key ลงใน frontend หรือ commit ลง GitHub**

## Notes
- รายการที่เพิ่มหรือแก้ไขในหลังบ้านจะอ่านจาก Supabase และแสดงใน `/accounts`
- ผู้เข้าชมอ่านรายการได้เท่านั้น การเพิ่ม/แก้ไข/ลบ และอัปโหลดรูปถูกจำกัดด้วย Supabase RLS
- อัปเดตชื่อร้านเป็น Baekhawhom แล้ว โปรดแก้ไขข้อมูลติดต่อใน `public/index.html` ก่อนเผยแพร่
- ระบบนี้ยังเป็น MVP สำหรับจัดการสินค้า ไม่ได้รวมระบบชำระเงินหรือการส่งมอบบัญชีอัตโนมัติ
