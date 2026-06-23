const { dbRun } = require('./db');

async function deleteReport() {
  // Mengambil argumen dari terminal (contoh: node delete-report.js REP-12345)
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("⚠️  Cara penggunaan:");
    console.log("Untuk hapus 1 laporan: node delete-report.js <ID_LAPORAN>");
    console.log("Untuk hapus SEMUA laporan: node delete-report.js ALL");
    process.exit(1);
  }

  const targetId = args[0];

  try {
    if (targetId === 'ALL') {
      // Menghapus semua laporan (karena ada ON DELETE CASCADE di db.js, pesan & lampiran otomatis ikut terhapus)
      await dbRun('DELETE FROM reports');
      console.log('✅ Berhasil! SEMUA laporan, pesan, dan lampiran telah dihapus dari database.');
    } else {
      // Menghapus laporan spesifik
      const res = await dbRun('DELETE FROM reports WHERE id = ?', [targetId]);
      
      if (res.changes > 0) {
         console.log(`✅ Berhasil! Laporan "${targetId}" beserta seluruh pesan & lampirannya telah dihapus.`);
      } else {
         console.log(`❌ Gagal: Laporan dengan ID "${targetId}" tidak ditemukan di database.`);
      }
    }
  } catch (err) {
    console.error('Terjadi kesalahan database:', err.message);
  } finally {
    process.exit(0); // Tutup koneksi script
  }
}

deleteReport();
