import React, { useState, useEffect } from 'react';
import { AlertTriangle, LogOut, MapPin, Ambulance, Package, Home, CheckCircle2, Clock, Phone, User, FileText, Compass } from 'lucide-react';
import { REQUEST_TYPES, STATUS } from '../constants/data';

const DEFAULT_COORDS = { lat: 16.0544, lng: 108.2022, label: 'Đà Nẵng' };

const CitizenView = ({ requests, onSubmitRequest, onBack }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', type: 'food', desc: '' });
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [submittedId, setSubmittedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locStatus, setLocStatus] = useState('Đang lấy vị trí GPS...');

  // Tự động định vị vị trí khi vào trang
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: 'Vị trí hiện tại của bạn'
          });
          setLocStatus('Đã định vị thành công vị trí GPS của bạn');
        },
        () => {
          setCoords(DEFAULT_COORDS);
          setLocStatus('Không lấy được GPS tự động, sử dụng vị trí trung tâm Đà Nẵng');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setLocStatus('Trình duyệt không hỗ trợ GPS, sử dụng vị trí trung tâm');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate số điện thoại
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      alert('Vui lòng nhập số điện thoại hợp lệ (từ 9 đến 11 chữ số)!');
      return;
    }

    if (!formData.desc.trim()) {
      alert('Vui lòng mô tả tình trạng cần cứu trợ để đội điều phối nắm rõ thông tin!');
      return;
    }

    setIsSubmitting(true);

    const newRequest = {
      id: Date.now(),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      type: formData.type,
      desc: formData.desc.trim(),
      lat: Number(coords.lat.toFixed(5)),
      lng: Number(coords.lng.toFixed(5)),
      status: 'pending',
      time: new Date().toLocaleTimeString('vi-VN', { hour12: false })
    };

    try {
      const res = await onSubmitRequest(newRequest);
      setSubmittedId(res?.id || newRequest.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setSubmittedId(newRequest.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tìm yêu cầu hiện tại để cập nhật realtime theo polling từ Admin
  const myRequest = requests.find(r => String(r.id) === String(submittedId)) || {
    ...formData,
    id: submittedId,
    status: 'pending',
    lat: coords.lat,
    lng: coords.lng,
    time: 'Vừa xong'
  };

  const currentTypeConfig = REQUEST_TYPES[(myRequest.type || 'food').toUpperCase()] || REQUEST_TYPES.FOOD;
  const currentStatusConfig = STATUS[(myRequest.status || 'pending').toUpperCase()] || STATUS.PENDING;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full">
      {/* Header cố định trên cùng */}
      <header className="bg-red-600 text-white px-5 py-3.5 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2.5 font-bold text-base md:text-lg uppercase tracking-wider">
          <div className="p-1.5 bg-red-700 rounded-lg">
            <AlertTriangle size={18} className="animate-pulse" />
          </div>
          <span>SOS VIỆT NAM — CỨU TRỢ KHẨN CẤP</span>
        </div>
        <button 
          onClick={onBack} 
          className="bg-white/20 hover:bg-white/30 text-white px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <LogOut size={15} /> Trang chủ
        </button>
      </header>

      {/* Khu vực nội dung: Cuộn tự nhiên với padding-bottom thoải mái (pb-32) */}
      <main className="flex-1 w-full flex items-start justify-center px-4 py-6 md:py-8 pb-32">
        {!submittedId ? (
          <form 
            onSubmit={handleSubmit} 
            className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-lg p-5 md:p-8 animate-fade-in-up"
          >
            <div className="text-center mb-5">
              <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-[11px] font-bold rounded-full uppercase tracking-wider mb-1.5">
                Dành cho người dân
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">Gửi Yêu Cầu Cứu Trợ</h2>
              <p className="text-slate-500 text-xs md:text-sm mt-0.5">Thông tin sẽ được gửi ngay đến Đội điều phối cứu hộ</p>
            </div>

            <div className="space-y-4">
              {/* 1. Chọn loại cứu trợ */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Loại hỗ trợ cần thiết *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {Object.values(REQUEST_TYPES).map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id })}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-red-500 bg-red-50 text-red-600 shadow-md scale-102 font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={24} className={isSelected ? 'text-red-500' : 'text-slate-500'} />
                        <span className="text-[11px] mt-1.5 text-center leading-tight font-medium">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Thông tin cá nhân */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <User size={13} /> Họ và tên *
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition font-medium text-slate-800 text-sm"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Phone size={13} /> Số điện thoại *
                  </label>
                  <input
                    required
                    type="tel"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition font-medium text-slate-800 text-sm"
                    placeholder="0905 xxx xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* 3. Tọa độ GPS */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
                    <MapPin size={15} className="text-amber-600" /> Tọa độ cứu hộ
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-snug">
                  {locStatus}
                </p>
              </div>

              {/* 4. Mô tả tình trạng */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <FileText size={13} /> Mô tả tình trạng cứu trợ khẩn cấp *
                </label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition resize-none font-medium text-slate-800 text-sm min-h-[75px]"
                  placeholder="Ví dụ: Nước ngập sâu ngang ngực, có 1 người già khó thở, cần cano tiếp cận gấp..."
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                />
              </div>

              {/* 5. Nút gửi tín hiệu */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm md:text-base shadow-lg shadow-red-500/25 transition duration-150 active:scale-98 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>Đang gửi tín hiệu SOS...</>
                  ) : (
                    <>
                      <MapPin size={18} /> GỬI TÍN HIỆU CỨU TRỢ NGAY
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* MÀN HÌNH THEO DÕI TIẾN ĐỘ THỜI GIAN THỰC */
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-center">
              <div className={`p-6 md:p-8 text-white ${
                myRequest.status === 'completed' 
                  ? 'bg-emerald-600' 
                  : myRequest.status === 'in_progress' 
                  ? 'bg-blue-600' 
                  : 'bg-amber-600'
              }`}>
                <div className="inline-block p-3 rounded-full bg-white/20 mb-2.5 backdrop-blur-sm animate-pulse">
                  {myRequest.status === 'completed' ? (
                    <CheckCircle2 size={32} />
                  ) : myRequest.status === 'in_progress' ? (
                    <Compass size={32} />
                  ) : (
                    <Clock size={32} />
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-1">
                  {currentStatusConfig.label}
                </h2>
                <p className="text-white/90 text-xs md:text-sm">
                  {myRequest.status === 'completed'
                    ? 'Ca cứu hộ của bạn đã hoàn thành an toàn!'
                    : myRequest.status === 'in_progress'
                    ? 'Đội cứu trợ đã tiếp nhận và đang triển khai tới vị trí của bạn'
                    : 'Đã nhận tín hiệu. Trung tâm điều phối đang điều động đội gần nhất'}
                </p>
                <div className="mt-3 inline-block bg-black/20 text-white font-mono text-xs px-3 py-1 rounded-full">
                  Mã tin báo: #{myRequest.id}
                </div>
              </div>

              <div className="p-5 md:p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Loại yêu cầu:</span>
                    <span className="font-bold text-slate-800">{currentTypeConfig.label}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Người gửi:</span>
                    <span className="font-bold text-slate-800">{myRequest.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Số điện thoại:</span>
                    <span className="font-bold text-blue-600 font-mono text-sm">{myRequest.phone}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Thời gian gửi:</span>
                    <span className="font-bold text-slate-800 font-mono">{myRequest.time}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 font-bold block mb-1">MÔ TẢ TÌNH TRẠNG:</span>
                    <p className="text-slate-800 italic font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/60">
                      "{myRequest.desc}"
                    </p>
                  </div>
                </div>

                <div className="py-1 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                    Tiến trình điều phối:
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 size={16} /> 1. Đã tiếp nhận tin báo khẩn cấp
                    </div>
                    <div className={`flex items-center gap-2 font-bold ${
                      myRequest.status === 'in_progress' || myRequest.status === 'completed'
                        ? 'text-blue-600'
                        : 'text-slate-400'
                    }`}>
                      <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">2</span>
                      2. Đội cứu hộ tiếp nhận & đang di chuyển
                    </div>
                    <div className={`flex items-center gap-2 font-bold ${
                      myRequest.status === 'completed' ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">3</span>
                      3. Hoàn tất cứu trợ
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedId(null);
                    setFormData({ name: '', phone: '', type: 'food', desc: '' });
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs md:text-sm transition cursor-pointer"
                >
                  Gửi yêu cầu hỗ trợ khác
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenView;
