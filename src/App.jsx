import React, { useState, useEffect, useCallback } from 'react';
import AnimationStyles from './components/AnimationStyles';
import RoleSelection from './components/RoleSelection';
import CitizenView from './components/CitizenView';
import OperationsView from './components/OperationsView';

// Dùng đường dẫn tương đối để gọi trực tiếp server hoặc proxy
const API_URL = '/api/sos';
const DIRECT_API_URL = 'http://localhost:5000/api/sos';

// Dữ liệu mẫu dự phòng khi chưa khởi động server
const DEFAULT_REQUESTS = [
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

const App = () => {
  const [view, setView] = useState('landing');
  const [requests, setRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('sos_requests_cache');
      return saved ? JSON.parse(saved) : DEFAULT_REQUESTS;
    } catch {
      return DEFAULT_REQUESTS;
    }
  });
  const [isServerConnected, setIsServerConnected] = useState(false);

  // Helper fetch
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    try {
      const res = await fetch(endpoint, options);
      if (res.ok) return res;
      throw new Error(`HTTP error! status: ${res.status}`);
    } catch (err) {
      if (endpoint === API_URL) {
        return await fetch(DIRECT_API_URL, options);
      }
      throw err;
    }
  }, []);

  // --- HÀM 1: Lấy danh sách tin cứu trợ từ Backend ---
  const fetchRequests = useCallback(async () => {
    try {
      const res = await apiFetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
        localStorage.setItem('sos_requests_cache', JSON.stringify(data));
        setIsServerConnected(true);
      }
    } catch {
      setIsServerConnected(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 2000); // Polling 2s
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // --- HÀM 2: Gửi tin cứu trợ mới ---
  const handleCreateRequest = async (newRequest) => {
    let createdItem = {
      ...newRequest,
      id: newRequest.id || Date.now(),
      status: newRequest.status || 'pending',
      time: newRequest.time || new Date().toLocaleTimeString('vi-VN', { hour12: false })
    };

    try {
      const res = await apiFetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdItem)
      });
      if (res.ok) {
        const data = await res.json();
        createdItem = data;
        setIsServerConnected(true);
      }
    } catch {
      console.warn('Server offline: Lưu tin báo vào bộ nhớ cục bộ');
      setIsServerConnected(false);
    }

    setRequests(prev => {
      const updated = [createdItem, ...prev.filter(r => String(r.id) !== String(createdItem.id))];
      localStorage.setItem('sos_requests_cache', JSON.stringify(updated));
      return updated;
    });

    return createdItem;
  };

  // --- HÀM 3: Cập nhật trạng thái hoặc thông tin ---
  const handleUpdateRequest = async (updatedReq) => {
    setRequests(prev => {
      const updated = prev.map(r => String(r.id) === String(updatedReq.id) ? { ...r, ...updatedReq } : r);
      localStorage.setItem('sos_requests_cache', JSON.stringify(updated));
      return updated;
    });

    try {
      await apiFetch(`${API_URL}/${updatedReq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReq)
      });
      setIsServerConnected(true);
    } catch {
      try {
        await apiFetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedReq)
        });
        setIsServerConnected(true);
      } catch {
        setIsServerConnected(false);
      }
    }
  };

  // --- HÀM 4: Xóa tin cứu trợ ---
  const handleDeleteRequest = async (id) => {
    setRequests(prev => {
      const updated = prev.filter(r => String(r.id) !== String(id));
      localStorage.setItem('sos_requests_cache', JSON.stringify(updated));
      return updated;
    });

    try {
      await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setIsServerConnected(true);
    } catch {
      try {
        await apiFetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
        setIsServerConnected(true);
      } catch {
        setIsServerConnected(false);
      }
    }
  };

  return (
    <div className="font-sans text-gray-900 bg-gray-50 min-h-screen w-full flex flex-col relative selection:bg-red-500 selection:text-white">
      <AnimationStyles />

      {/* Thanh trạng thái kết nối máy chủ gọn nhẹ */}
      <div className="fixed bottom-3 left-4 z-40 pointer-events-none opacity-80 hover:opacity-100 transition">
        <div className="bg-slate-900/90 text-white backdrop-blur text-[11px] px-3 py-1 rounded-full shadow-md flex items-center gap-2 border border-slate-700/60">
          <span className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span>{isServerConnected ? 'Máy chủ: Đang kết nối (Port 5000)' : 'Chế độ Cục bộ (Offline)'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full">
        {view === 'landing' && (
          <RoleSelection onSelect={setView} requests={requests} />
        )}

        {view === 'citizen' && (
          <CitizenView 
            requests={requests} 
            onSubmitRequest={handleCreateRequest}
            onBack={() => setView('landing')}
          />
        )}

        {view === 'operations' && (
          <OperationsView
            requests={requests}
            onAddRequest={handleCreateRequest}
            onUpdateRequest={handleUpdateRequest}
            onDeleteRequest={handleDeleteRequest}
            onBack={() => setView('landing')}
          />
        )}
      </div>
    </div>
  );
};

export default App;
