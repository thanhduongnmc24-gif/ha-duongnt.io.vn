"use client";
import { useState } from "react";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hàm bật/tắt menu trên điện thoại
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-[calc(100vh-76px)] bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* NÚT MOBILE: Đã căn chỉnh để phối hợp mượt mà với thanh trên cùng */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-24 left-4 z-50 p-2 bg-white text-blue-700 rounded-lg shadow-md hover:bg-slate-100 focus:outline-none transition-all"
        title="Mở menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </button>

      {/* THANH MENU DỌC (SIDEBAR) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col shadow-2xl ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Danh sách các mục - Đã dọn sạch chữ Điều Hướng và nút Trang Chủ thừa */}
        <nav className="flex-1 px-4 py-8 space-y-6 overflow-y-auto">
          {/* Mục 1 */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Vận hành sản xuất</p>
            <a href="#" className="flex items-center px-4 py-2 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
              <span className="text-sm">Thông số xưởng cán</span>
            </a>
          </div>

          {/* Mục 2 */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Công cụ & Hệ thống</p>
            <a href="#" className="flex items-center px-4 py-2 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
              <span className="text-sm">Các phần mềm</span>
            </a>
          </div>
        </nav>
        
        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-700/50 text-center text-xs text-slate-500">
          Phiên bản 1.0.0
        </div>
      </aside>

      {/* LỚP PHỦ MÀN HÌNH MỜ (Chỉ xuất hiện trên Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <main className="flex-1 overflow-y-auto w-full flex flex-col">
        {/* Bảng điều khiển (Dashboard) */}
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
          <div className="mb-8 pl-12 md:pl-0">
            <h2 className="text-3xl font-extrabold text-slate-800">Tổng quan Hệ thống</h2>
            <p className="text-slate-500 mt-2">Theo dõi và giám sát toàn bộ hoạt động theo thời gian thực.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            
            {/* Thẻ hiển thị 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                   <svg xmlns="http://www.w3.org/2000/xl" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Dữ liệu Xưởng Cán</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Khu vực sẵn sàng để đồng bộ chỉ số từ các PLC, hiển thị tiến độ đếm thép thành phẩm và giám sát dây chuyền sản xuất tự động.
              </p>
            </div>
            
            {/* Thẻ hiển thị 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Kho Ứng dụng & AI</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tích hợp các luồng công việc kỹ thuật, quản lý ứng dụng ghi chú cá nhân, trích xuất dữ liệu Excel và quản trị hệ thống nhận diện.
              </p>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}