console.log("Starting index.js...");
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { dbRun, dbAll, dbGet } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 5e7, // 50MB limit to allow base64 file uploads
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Helper to fetch full populated reports
async function getAllReports() {
  const reports = await dbAll('SELECT * FROM reports ORDER BY rowid DESC');
  for (let r of reports) {
    r.messages = await dbAll('SELECT * FROM messages WHERE reportId = ?', [r.id]);
    r.attachments = await dbAll('SELECT * FROM attachments WHERE reportId = ?', [r.id]);
    
    // Also inject attachments inside messages for frontend format compatibility
    for (let m of r.messages) {
      const msgAtts = await dbAll('SELECT * FROM attachments WHERE messageId = ?', [m.id]);
      if (msgAtts.length > 0) m.attachments = msgAtts;
    }
  }
  return reports;
}

// REST Endpoint to fetch all data on load
app.get('/api/reports', async (req, res) => {
  try {
    const data = await getAllReports();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Tambah Report Baru
  socket.on('addReport', async (report) => {
    try {
      const now = Date.now();
      await dbRun(
        `INSERT INTO reports (id, citizenName, aiCategory, aiPriorityScore, status, date, originalComplaint, preview, expiresAt, lastActivityAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [report.id, report.citizenName, report.aiCategory, report.aiPriorityScore, report.status, report.date, report.originalComplaint, report.preview, report.expiresAt || null, now]
      );
      
      const fullData = await getAllReports();
      io.emit('stateUpdate', fullData);
    } catch (e) {
      console.error(e);
    }
  });

  // Tambah Pesan Baru
  socket.on('addMessage', async ({ reportId, message }) => {
    try {
      await dbRun(
        `INSERT INTO messages (id, reportId, sender, text, timestamp, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [message.id, reportId, message.sender, message.text, message.timestamp, 'sent']
      );

      if (message.attachments && message.attachments.length > 0) {
        for (let att of message.attachments) {
          await dbRun(
            `INSERT INTO attachments (id, messageId, reportId, name, url, type, size)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [att.id, message.id, reportId, att.name, att.url, att.type, att.size]
          );
        }
      }

      // Handle Status Updates/Closure logic
      let isClosure = false;
      const lowerText = message.text.toLowerCase();
      
      if (message.sender === 'citizen') {
        // Deteksi secara lebih detail (tidak hanya ada katanya, tapi dari konteks)
        // Warga mengucapkan terima kasih / selesai / cukup
        isClosure = /(terima kasih|makasih|thank you|tengkyu|udah beres|udah selesai|cukup|sudah dibantu|case closed|laporan selesai)/i.test(lowerText) && 
                    !/(belum|tidak|bukan|kenapa|tolong|tapi|namun)/i.test(lowerText);
      } else if (message.sender === 'admin') {
        // Admin menutup manual dengan chat
        isClosure = /(kasus ini ditutup|laporan ini ditutup|kami tutup|laporan selesai)/i.test(lowerText);
      }

      const report = await dbGet('SELECT * FROM reports WHERE id = ?', [reportId]);
      const now = Date.now();
      
      if (report) {
        let newStatus = report.status;
        let newExpiresAt = report.expiresAt;

        if (isClosure && report.status !== 'Selesai') {
          newStatus = 'Selesai';
          newExpiresAt = now + 24 * 60 * 60 * 1000;
        } else if (report.status === 'Selesai' && message.sender === 'citizen' && !isClosure) {
          newStatus = 'Menunggu';
          newExpiresAt = null;
        }

        // Update status, expiresAt, and reset lastActivityAt
        await dbRun('UPDATE reports SET status = ?, expiresAt = ?, lastActivityAt = ? WHERE id = ?', [newStatus, newExpiresAt, now, reportId]);
      }

      const fullData = await getAllReports();
      io.emit('stateUpdate', fullData);
    } catch (e) {
      console.error(e);
    }
  });

  // Update Status Report
  socket.on('updateReportStatus', async ({ reportId, status }) => {
    try {
      const report = await dbGet('SELECT * FROM reports WHERE id = ?', [reportId]);
      let newExpiresAt = report.expiresAt;

      if (status === 'Selesai' && report.status !== 'Selesai') {
        newExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
      } else if (status !== 'Selesai') {
        newExpiresAt = null;
      }

      await dbRun('UPDATE reports SET status = ?, expiresAt = ?, lastActivityAt = ? WHERE id = ?', [status, newExpiresAt, Date.now(), reportId]);
      
      const fullData = await getAllReports();
      io.emit('stateUpdate', fullData);
    } catch (e) {
      console.error(e);
    }
  });

  // Update Citizen Name
  socket.on('updateCitizenName', async ({ reportId, name }) => {
    try {
      await dbRun('UPDATE reports SET citizenName = ?, lastActivityAt = ? WHERE id = ?', [name, Date.now(), reportId]);
      const fullData = await getAllReports();
      io.emit('stateUpdate', fullData);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Auto Cleanup Routine (Runs every 1 minute)
setInterval(async () => {
  const now = Date.now();
  try {
    // 1. Delete expired reports
    const deleteRes = await dbRun('DELETE FROM reports WHERE expiresAt IS NOT NULL AND expiresAt <= ?', [now]);
    
    // 2. Check for Inactive reports (Timeout: 3 hari = 3 * 24 * 60 * 60 * 1000 ms)
    const TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000;
    
    const inactiveReports = await dbAll(
      'SELECT * FROM reports WHERE status != "Selesai" AND lastActivityAt IS NOT NULL AND (? - lastActivityAt) > ?',
      [now, TIMEOUT_MS]
    );

    let updated = false;
    for (const r of inactiveReports) {
      const newExpiresAt = now + 24 * 60 * 60 * 1000; // hapus dalam 24 jam
      
      // Update status to Selesai
      await dbRun('UPDATE reports SET status = "Selesai", expiresAt = ? WHERE id = ?', [newExpiresAt, r.id]);
      
      // Insert automated system message telling the user it was closed
      const msgId = `msg-autoclose-${now}-${r.id}`;
      await dbRun(
        `INSERT INTO messages (id, reportId, sender, text, timestamp, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [msgId, r.id, 'admin', 'Sesi ini ditutup otomatis oleh sistem karena tidak ada respons atau aktivitas selama 3 hari terakhir. Jika masalah belum teratasi, silakan buat laporan baru. Terima kasih.', new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), 'sent']
      );
      
      updated = true;
    }

    if (deleteRes.changes > 0 || updated) {
      const fullData = await getAllReports();
      io.emit('stateUpdate', fullData);
    }
  } catch (e) {
    console.error('Error during cleanup:', e);
  }
}, 60000);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
