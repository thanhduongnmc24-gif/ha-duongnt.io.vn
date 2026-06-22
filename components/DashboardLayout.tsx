"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isXuongCanOpen, setIsXuongCanOpen] = useState(true); // Nút menu xưởng cán
  const pathname = usePathname();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-[calc(100vh-76px)] bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Nút Mobile */}
      <button onClick={toggleSidebar} className="md:hidden fixed top-24 left-4 z-50 p-2 bg-white text-blue-700 rounded-lg shadow-md hover:bg-slate-100 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      {/* THANH MENU DỌC (SIDEBAR) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <nav className="flex-1 px-4 py-8 space-y-6 overflow-y-auto">
          

          {/* Mục 1: Xưởng Cán có menu xổ xuống */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Vận hành sản xuất</p>
            <div className="flex flex-col gap-1">
              <button onClick={() => setIsXuongCanOpen(!isXuongCanOpen)} className="flex items-center justify-between px-4 py-2 hover:bg-slate-800 hover:text-white rounded-md transition-colors w-full text-left">
                <span className="text-sm font-bold text-slate-300">⚙️ Thông số xưởng cán</span>
                <span className="text-xs text-slate-500">{isXuongCanOpen ? '▼' : '▶'}</span>
              </button>
              
              {/* 2 Nút Page Con */}
              {isXuongCanOpen && (
                <div className="ml-4 flex flex-col gap-1 border-l border-slate-700 pl-2 mt-1">
                  <Link href="/xuong-can/san-pham" className={`text-sm px-3 py-2 rounded-md transition-colors ${pathname === '/xuong-can/san-pham' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    📦 Thông số sản phẩm
                  </Link>
                  <Link href="/xuong-can/dang-cho" className={`text-sm px-3 py-2 rounded-md transition-colors ${pathname === '/xuong-can/dang-cho' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    ⏳ Đang chờ
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mục 2: Phần mềm */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Công cụ & Hệ thống</p>
            <Link href="/phan-mem" className="flex items-center px-4 py-2 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
              <span className="text-sm font-bold text-slate-300">💻 Các phần mềm</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* LỚP PHỦ MOBILE */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={toggleSidebar}></div>}

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <main className="flex-1 overflow-y-auto w-full flex flex-col bg-slate-50">
        {children}
      </main>
    </div>
  );
}