import { Report } from './types';

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'RPT-001',
    citizenName: 'Warga Anonim',
    aiCategory: 'Infrastruktur',
    aiPriorityScore: 95,
    status: 'Ditinjau',
    date: '10 Jun 2026',
    originalComplaint: 'Halo Pak/Bu, saya mau lapor. Jalan berlubang parah di pertigaan Sudirman depan minimarket itu semakin besar. Kemarin ada pemotor yang jatuh karena tidak lihat lubangnya, apalagi kalau malam kurang penerangan. Mohon segera diperbaiki sebelum makan korban lagi.',
    preview: 'Jalan berlubang, pertigaan Sudirman',
    attachments: [],
    messages: [
      {
        id: 'm1',
        sender: 'citizen',
        text: 'Halo Pak/Bu, saya mau lapor. Jalan berlubang parah di pertigaan Sudirman depan minimarket itu semakin besar. Kemarin ada pemotor yang jatuh karena tidak lihat lubangnya, apalagi kalau malam kurang penerangan. Mohon segera diperbaiki sebelum makan korban lagi.',
        timestamp: '10:30',
        status: 'sent'
      },
      {
        id: 'm2',
        sender: 'admin',
        text: 'Baik, terima kasih atas laporannya. Boleh tolong sebutkan perkiraan diameter lubangnya, atau patokan lebih spesifik agar tim kami bisa langsung mengecek ke lokasi siang ini?',
        timestamp: '10:35',
        status: 'sent'
      }
    ]
  },
  {
    id: 'RPT-002',
    citizenName: 'Bapak Budi',
    aiCategory: 'Keamanan',
    aiPriorityScore: 80,
    status: 'Menunggu',
    date: '09 Jun 2026',
    originalComplaint: 'Lampu jalan di gang sebelah komplek Griya Indah sudah mati hampir 2 minggu. Warga jadi takut lewat malam hari karena gelap total. Sudah ada 2 kasus jambret minggu lalu di area itu.',
    preview: 'Lampu jalan mati, rawan jambret',
    attachments: [],
    messages: [
      {
        id: 'm3',
        sender: 'citizen',
        text: 'Lampu jalan di gang sebelah komplek Griya Indah sudah mati hampir 2 minggu. Warga jadi takut lewat malam hari karena gelap total. Sudah ada 2 kasus jambret minggu lalu di area itu.',
        timestamp: '08:15',
        status: 'sent'
      }
    ]
  },
  {
    id: 'RPT-003',
    citizenName: 'Ibu Siti',
    aiCategory: 'Kebersihan',
    aiPriorityScore: 40,
    status: 'Menunggu',
    date: '08 Jun 2026',
    originalComplaint: 'Tumpukan sampah di TPS dekat pasar Kembang sudah menggunung dan baunya sangat menyengat. Sudah seminggu tidak diangkut. Warga sekitar mulai khawatir jadi sarang nyamuk demam berdarah.',
    preview: 'Sampah menumpuk di TPS pasar',
    attachments: [],
    messages: [
      {
        id: 'm4',
        sender: 'citizen',
        text: 'Tumpukan sampah di TPS dekat pasar Kembang sudah menggunung dan baunya sangat menyengat. Sudah seminggu tidak diangkut. Warga sekitar mulai khawatir jadi sarang nyamuk demam berdarah.',
        timestamp: '14:20',
        status: 'sent'
      }
    ]
  },
  {
    id: 'RPT-004',
    citizenName: 'Pak Hendra',
    aiCategory: 'Pelayanan Publik',
    aiPriorityScore: 55,
    status: 'Diproses',
    date: '07 Jun 2026',
    originalComplaint: 'Sudah 3 kali saya datang ke kantor kelurahan untuk mengurus surat keterangan domisili tapi selalu diminta datang lagi besok karena petugasnya tidak ada. Tolong pelayanannya diperbaiki.',
    preview: 'Petugas kelurahan sering tidak ada',
    attachments: [],
    messages: [
      {
        id: 'm5',
        sender: 'citizen',
        text: 'Sudah 3 kali saya datang ke kantor kelurahan untuk mengurus surat keterangan domisili tapi selalu diminta datang lagi besok karena petugasnya tidak ada. Tolong pelayanannya diperbaiki.',
        timestamp: '09:00',
        status: 'sent'
      },
      {
        id: 'm6',
        sender: 'admin',
        text: 'Terima kasih laporannya Pak Hendra. Kami sudah koordinasi dengan Lurah terkait jadwal piket petugas. Bisa kami tahu kapan terakhir Bapak datang ke kelurahan?',
        timestamp: '09:45',
        status: 'sent'
      },
      {
        id: 'm7',
        sender: 'citizen',
        text: 'Terakhir hari Rabu kemarin tanggal 4 Juni, jam 10 pagi. Petugasnya bilang harus datang lagi hari Jumat.',
        timestamp: '10:10',
        status: 'sent'
      }
    ]
  },
  {
    id: 'RPT-005',
    citizenName: 'Mbak Dewi',
    aiCategory: 'Infrastruktur',
    aiPriorityScore: 70,
    status: 'Selesai',
    date: '05 Jun 2026',
    originalComplaint: 'Saluran air di Jl. Merpati RT 03 tersumbat dan menyebabkan banjir setiap hujan. Air masuk ke rumah-rumah warga sampai setinggi betis. Mohon segera ditangani.',
    preview: 'Saluran air tersumbat, banjir',
    attachments: [],
    messages: [
      {
        id: 'm8',
        sender: 'citizen',
        text: 'Saluran air di Jl. Merpati RT 03 tersumbat dan menyebabkan banjir setiap hujan. Air masuk ke rumah-rumah warga sampai setinggi betis. Mohon segera ditangani.',
        timestamp: '16:00',
        status: 'sent'
      },
      {
        id: 'm9',
        sender: 'admin',
        text: 'Laporan diterima. Tim Dinas PU akan turun ke lokasi besok pagi untuk inspeksi saluran. Terima kasih sudah melapor.',
        timestamp: '16:30',
        status: 'sent'
      }
    ]
  }
];
