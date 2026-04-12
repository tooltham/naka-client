# NAKA Client

> VS Code Extension สำหรับดึงข้อมูลคุณภาพอากาศจาก [NAKA-AQI](https://naka-env.org) — ระบบตรวจวัดฝุ่น PM2.5 ของมหาวิทยาลัยนครพนม (FF69 Research Project)

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.107.0-007ACC)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Quick Endpoints** — เรียก NAKA-AQI API ด้วยคลิกเดียว พร้อมคำนวณและเติม `start/end` (เวลาแบบ ISO 8601) ให้อัตโนมัติ
- **Secure API Key Management** — บันทึก API Key ปลอดภัยระดับสูงสุดผ่าน `VS Code SecretStorage` (OS Keychain) และแนบ Header `X-API-Key` ทุก request อัตโนมัติ
- **NPU Theme** — UI ออกแบบตาม design system ของมหาวิทยาลัยนครพนม สื่อถึงความเป็น Enterprise 
- **CORS Bypass** — ตัว Extension ยิง API ผ่าน Native Node.js ทำให้ไม่มีปัญหาเรื่อง CORS ปิดกั้นเมื่อดึงข้อมูล
- **Station Cards** — แสดงผลสถานีทุกจุดพร้อม PM2.5 color-coded ตามมาตรฐาน AQI ไทย
- **JSON Syntax Highlight** — แสดงผล Response แบบ pretty-print พร้อม copy ได้ทันที

## 🚀 Getting Started

### 1. เปิด Extension

กด `Cmd+Shift+P` (macOS) หรือ `Ctrl+Shift+P` (Windows/Linux) แล้วพิมพ์:

```
Open NAKA Client
```

### 2. ตั้งค่า API Key

1. ไปที่ [https://naka-env.org](https://naka-env.org) เพื่อขอ API Key
2. วาง API Key ในช่อง **🔑 API KEY** แล้วกด **Save**
3. Key จะถูกเก็บใน VS Code และใช้อัตโนมัติทุกครั้ง

### 3. เรียกข้อมูล

- คลิก **Quick Endpoint** ที่ต้องการ หรือพิมพ์ URL เอง
- กด **Shoot!** หรือ `Enter`
- Response จะแสดงพร้อม syntax highlight และ station cards

## 📡 API Endpoints ที่รองรับ

| Endpoint | Description |
|----------|-------------|
| `GET /api/stations` | รายชื่อสถานีทั้งหมด + ค่าล่าสุด |
| `GET /api/stations/{id}/current` | ค่าปัจจุบันของสถานีนั้น |
| `GET /api/stations/{id}/history?start={ISO}&end={ISO}` | ข้อมูลย้อนหลัง (เช่น 24 ชม. หรือ 7 วัน) |
| `GET /api/stations/{id}/monthly?year={YYYY}&month={M}` | ข้อมูลรายเดือน |
| `GET /api/keys/me` | ดู API Key ของตัวเอง |

## 🎨 PM2.5 AQI Color Scale

| ระดับ | PM2.5 (µg/m³) | สี |
|-------|---------------|-----|
| ดีมาก | 0 - 15 | 🔵 Very Good |
| ดี | 15.1 - 25 | 🟢 Good |
| ปานกลาง | 25.1 - 37.5 | 🟡 Moderate |
| เริ่มมีผลต่อสุขภาพ | 37.6 - 75 | 🟠 Unhealthy for Sensitive Groups |
| มีผลต่อสุขภาพ | 75.1 - 100 | 🔴 Unhealthy |
| อันตราย | > 100 | 🟣 Hazardous |

## 🛠️ Development

```bash
# Clone
git clone https://github.com/tooltham/naka-client.git
cd naka-client

# Install dependencies
npm install

# Watch & compile
npm run watch

# Open in VS Code and press F5 to launch Extension Development Host
```

## 📋 Requirements

- VS Code `^1.107.0`
- API Key จาก [naka-env.org](https://naka-env.org) (rate limit: 100 req/day)

## 🔗 Links

- **NAKA-AQI Website**: [https://naka-env.org](https://naka-env.org)
- **API Docs**: [https://naka-env.org/api-docs](https://naka-env.org/api-docs)
- **Source on GitHub**: [https://github.com/tooltham/naka-aqi](https://github.com/tooltham/naka-aqi)
- **Research Unit**: Internet of Things and Embedded System (IoTES) · Nakhon Phanom University

---

*Developed by Internet of Things and Embedded System Research Unit (IoTES), Nakhon Phanom University*
