# AduanAI (TeksAduan)

AduanAI adalah platform layanan pengaduan masyarakat berbasis antarmuka chat. Aplikasi ini dibangun untuk mempermudah komunikasi dua arah antara warga dan admin instansi terkait, dengan memanfaatkan integrasi AI untuk klasifikasi awal.

## Daftar Fitur

Sistem ini terbagi menjadi dua bagian utama:

1. Warga (Citizen View)
- Tampilan web dibuat spesifik untuk resolusi mobile dengan bottom navigation bar agar terasa seperti aplikasi native.
- Form pengaduan yang menerima input teks (wajib) dan lampiran foto/video.
- Obrolan (chat) secara realtime dengan admin untuk setiap laporan yang dibuat.
- Sistem secara otomatis mengklasifikasikan kategori dan menghitung skor prioritas dari deskripsi masalah yang dikirimkan menggunakan AI.
- Halaman inbox untuk melacak status laporan beserta riwayat percakapan.

2. Admin (Dashboard View)
- Halaman panel admin untuk melihat semua laporan masuk secara terpusat.
- Dapat melihat laporan mana yang memiliki prioritas tinggi berdasarkan hasil analisis AI.
- Admin bisa mengubah status tiket (misalnya menjadi Ditinjau atau Diproses) dan membalas pesan warga.

## Stack Teknologi

- Frontend: React (Vite), TypeScript, TailwindCSS
- Backend: Node.js, Express
- Realtime Engine: Socket.io

## Cara Menjalankan Project (Lokal)

Pastikan Node.js versi 16+ sudah terinstall. Karena menggunakan arsitektur client-server dan websocket, Anda perlu menjalankan backend dan frontend di dua terminal yang berbeda.

### 1. Menjalankan Backend Server
Masuk ke folder server dan jalankan:

```bash
cd server
npm install
node index.js
```
Backend akan berjalan di port 3001.

### 2. Menjalankan Frontend
Buka terminal baru pada root direktori project:

```bash
npm install
npm run dev
```
Akses frontend melalui browser di localhost:3000.
