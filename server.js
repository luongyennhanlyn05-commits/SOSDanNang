import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'requests.json');
const DIST_DIR = path.join(__dirname, 'dist');

// Middleware
app.use(cors());
app.use(express.json());

// Khởi tạo thư mục và file dữ liệu mẫu nếu chưa có
function initDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const seedData = [
      {
        id: 1700000001,
        name: 'Nguyễn Văn An',
        phone: '0905123456',
        type: 'medical',
        desc: 'Người già khó thở cần oxy khẩn cấp, nước bắt đầu tràn vào nhà.',
        status: 'pending',
        lat: 16.0611,
        lng: 108.2208,
        time: '08:30:15'
      },
      {
        id: 1700000002,
        name: 'Trần Thị Bình',
        phone: '0914987654',
        type: 'food',
        desc: 'Gia đình 4 người (có 2 trẻ nhỏ) hết lương thực và nước ngọt ngày thứ 2.',
        status: 'in_progress',
        lat: 16.0289,
        lng: 108.1972,
        time: '09:15:40'
      },
      {
        id: 1700000003,
        name: 'Lê Hoàng Cường',
        phone: '0935555666',
        type: 'isolated',
        desc: 'Nhà cấp 4 vùng trũng bị ngập sâu hơn 1m, cần ca nô hỗ trợ di dời.',
        status: 'pending',
        lat: 16.0125,
        lng: 108.1450,
        time: '09:45:10'
      },
      {
        id: 1700000004,
        name: 'Phạm Thị Dung',
        phone: '0905999888',
        type: 'medical',
        desc: 'Phụ nữ mang thai tháng thứ 8 có dấu hiệu chuyển dạ, cần cano y tế tiếp cận.',
        status: 'completed',
        lat: 16.0820,
        lng: 108.2435,
        time: '07:10:00'
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
    console.log('✅ Đã tạo dữ liệu mẫu ban đầu tại data/requests.json');
  }
}

function readRequests() {
  try {
    initDataStore();
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Lỗi đọc file dữ liệu:', error);
    return [];
  }
}

function writeRequests(requests) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Lỗi ghi file dữ liệu:', error);
    return false;
  }
}

// =================== CÁC API ENDPOINTS ===================

// 1. Lấy danh sách tin cứu trợ
app.get('/api/sos', (req, res) => {
  const requests = readRequests();
  res.json(requests);
});

// 2. Lấy thống kê
app.get('/api/sos/stats', (req, res) => {
  const requests = readRequests();
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };
  res.json(stats);
});

// 3. Tạo tin cứu trợ mới
app.post('/api/sos', (req, res) => {
  const { name, phone, type, desc, lat, lng } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Họ tên và số điện thoại là bắt buộc' });
  }

  const requests = readRequests();
  const now = new Date();
  const timeString = now.toLocaleTimeString('vi-VN', { hour12: false });

  const newRequest = {
    id: req.body.id || Date.now(),
    name: String(name).trim(),
    phone: String(phone).trim(),
    type: type || 'food',
    desc: desc ? String(desc).trim() : 'Cần hỗ trợ khẩn cấp',
    status: req.body.status || 'pending',
    lat: Number(lat) || 16.0544,
    lng: Number(lng) || 108.2022,
    time: req.body.time || timeString,
    createdAt: now.toISOString()
  };

  requests.unshift(newRequest); // Đưa lên đầu danh sách
  writeRequests(requests);

  console.log(`[SOS MỚI] #${newRequest.id} - ${newRequest.name} (${newRequest.phone}) - Loại: ${newRequest.type}`);
  res.status(201).json(newRequest);
});

// 4. Cập nhật tin cứu trợ (theo URL param hoặc body id)
const handleUpdate = (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID tin báo' });
  }

  const requests = readRequests();
  const index = requests.findIndex(r => String(r.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy tin báo' });
  }

  requests[index] = {
    ...requests[index],
    ...req.body,
    id: requests[index].id
  };

  writeRequests(requests);
  console.log(`[CẬP NHẬT] #${id} - Trạng thái: ${requests[index].status}`);
  res.json(requests[index]);
};

app.put('/api/sos/:id', handleUpdate);
app.put('/api/sos', handleUpdate);

// 5. Xóa tin cứu trợ
const handleDelete = (req, res) => {
  const id = req.params.id || req.query.id || req.body?.id;
  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID tin báo cần xóa' });
  }

  const requests = readRequests();
  const initialLength = requests.length;
  const filtered = requests.filter(r => String(r.id) !== String(id));

  if (filtered.length === initialLength) {
    return res.status(404).json({ error: 'Không tìm thấy tin báo để xóa' });
  }

  writeRequests(filtered);
  console.log(`[ĐÃ XÓA] Tin báo #${id}`);
  res.json({ success: true, message: `Đã xóa tin #${id}` });
};

app.delete('/api/sos/:id', handleDelete);
app.delete('/api/sos', handleDelete);

// 6. API Đăng nhập Admin
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (password === 'admin123' || (username === 'admin' && password === '123456')) {
    res.json({
      success: true,
      user: { username: username || 'admin', role: 'admin' },
      token: 'admin-session-token-' + Date.now()
    });
  } else {
    res.status(401).json({ success: false, error: 'Sai mật khẩu điều hành!' });
  }
});

// 7. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// =================== PHỤC VỤ GIAO DIỆN FRONTEND ===================
// Tự động phục vụ giao diện tĩnh từ thư mục dist/
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // Catch-all route cho SPA (tương thích hoàn toàn Express v5)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

// Khởi chạy server - Lắng nghe trên mọi interface (Dual-stack IPv4 & IPv6)
initDataStore();
app.listen(PORT, () => {
  const localhostUrl = `http://localhost:${PORT}`;
  const ipUrl = `http://127.0.0.1:${PORT}`;
  console.log(`\n============================================================`);
  console.log(`🚀 HỆ THỐNG SOS ĐÀ NẴNG ĐANG CHẠY THÀNH CÔNG!`);
  console.log(`👉 Trình duyệt: ${localhostUrl}`);
  console.log(`👉 Hoặc:       ${ipUrl}`);
  console.log(`👉 API:        ${localhostUrl}/api/sos`);
  console.log(`============================================================`);
  console.log(`⚠️  CHÚ Ý: GIỮ NGUYÊN CỬA SỔ NÀY TRONG KHI SỬ DỤNG WEB`);
  console.log(`   (Nếu đóng cửa sổ này thì web sẽ bị ngắt kết nối)`);
  console.log(`============================================================\n`);

  // Tự động mở trình duyệt nếu trên Windows
  if (process.platform === 'win32' && !process.env.NO_OPEN) {
    exec(`start ${localhostUrl}`);
  }
});
