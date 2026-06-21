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
      await dbRun(
        `INSERT INTO reports (id, citizenName, aiCategory, aiPriorityScore, status, date, originalComplaint, preview, expiresAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [report.id, report.citizenName, report.aiCategory, report.aiPriorityScore, report.status, report.date, report.originalComplaint, report.preview, report.expiresAt || null]
      );
      
      // Broadcast full state update to all connected clients
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

      // Handle Status Updates/Closure logic (sama seperti di frontend AppContext, tapi dipindah ke Backend)
      const closureRegex = /(terima kasih|makasih|thank you|tengkyu|selesai|itu aja|itu saja|cukup|sudah dibantu|sudah sampaikan|sudah dilaporkan|kami tutup)/i;
      const isClosure = closureRegex.test(message.text);
      const report = await dbGet('SELECT * FROM reports WHERE id = ?', [reportId]);
      
      if (report) {
        let newStatus = report.status;
        let newExpiresAt = report.expiresAt;

        if (isClosure && report.status !== 'Selesai') {
          newStatus = 'Selesai';
          newExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
        } else if (report.status === 'Selesai' && message.sender === 'citizen' && !isClosure) {
          newStatus = 'Menunggu';
          newExpiresAt = null;
        }

        if (newStatus !== report.status || newExpiresAt !== report.expiresAt) {
          await dbRun('UPDATE reports SET status = ?, expiresAt = ? WHERE id = ?', [newStatus, newExpiresAt, reportId]);
        }
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

      await dbRun('UPDATE reports SET status = ?, expiresAt = ? WHERE id = ?', [status, newExpiresAt, reportId]);
      
      const fullData = await getAllReports();
      io.emit('stateUpdate', fullData);
    } catch (e) {
      console.error(e);
    }
  });

  // Update Citizen Name
  socket.on('updateCitizenName', async ({ reportId, name }) => {
    try {
      await dbRun('UPDATE reports SET citizenName = ? WHERE id = ?', [name, reportId]);
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
    // Delete expired reports (cascade will handle messages & attachments if schema is correct)
    await dbRun('DELETE FROM reports WHERE expiresAt IS NOT NULL AND expiresAt <= ?', [now]);
    const fullData = await getAllReports();
    io.emit('stateUpdate', fullData);
  } catch (e) {
    console.error('Error during cleanup:', e);
  }
}, 60000);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
