"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customPages, setCustomPages] = useState<any[]>([]);
  
  // Trạng thái mở/đóng của các thư mục con
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ "Thông số xưởng cán": true });
  const pathname = usePathname();
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleFolder = (fName: string) => setOpenFolders(prev => ({ ...prev, [fName]: !prev[fName] }));

  useEffect(() => {
    fetchCustomPages();
    const channel = supabase.channel("custom_pages_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_pages" }, () => {
        fetchCustomPages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchCustomPages = async () => {
    const { data } = await supabase.from("custom_pages")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    if (data) setCustomPages(data);
  };

  // Thuật toán gộp Menu tự động theo Nhóm lớn -> Thư mục con
  const menuGroups: Record<string, { direct: any[], folders: Record<string, any[]> }> = {};
  customPages.forEach(page => {
    const gName = (page.group_name || 'KHÁC').toUpperCase();
    if (!menuGroups[gName]) menuGroups[gName] = { direct: [], folders: {} };
    
    if (page.folder_name) {
      if (!menuGroups[gName].folders[page.folder_name]) menuGroups[gName].folders[page.folder_name] = [];
      menuGroups[gName].folders[page.folder_name].push(page);
    } else {
      menuGroups[gName].direct.push(page);
    }
  });

  return (
    <div className="flex h-[calc(100vh-76px)] bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <button onClick={toggleSidebar} className="md:hidden fixed top-24 left-4 z-50 p-2 bg-white text-blue-700 rounded-lg shadow-md hover:bg-slate-100 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <nav className="flex-1 py-8 space-y-6 overflow-y-auto">
          {Object.keys(menuGroups).map(gName => (
            <div key={gName}>
              <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{gName}</p>
              <div className="flex flex-col gap-1">
                
                {/* 1. Vẽ các Thư mục (Có menu thả xuống) */}
                {Object.keys(menuGroups[gName].folders).map(fName => (
                  <div key={fName} className="flex flex-col gap-1">
                    <button onClick={() => toggleFolder(fName)} className="flex items-center justify-between px-4 py-2 hover:bg-slate-800 hover:text-white rounded-md transition-colors w-full text-left outline-none">
                      <span className="text-sm font-bold text-slate-300">📁 {fName}</span>
                      <span className="text-xs text-slate-500">{openFolders[fName] ? '▼' : '▶'}</span>
                    </button>
                    
                    {openFolders[fName] && (
                      <div className="ml-4 flex flex-col gap-1 border-l border-slate-700 pl-2 mt-1">
                        {menuGroups[gName].folders[fName].map(page => {
                          const linkUrl = page.route_url || `/pages/${page.slug}`;
                          const isActive = pathname === linkUrl;
                          return (
                            <Link key={page.id} href={linkUrl} className={`text-sm px-3 py-2 rounded-md transition-colors truncate block ${isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                              {page.icon} {page.title}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* 2. Vẽ các Link đứng đơn lẻ (Không nằm trong thư mục nào) */}
                {menuGroups[gName].direct.map(page => {
                  const linkUrl = page.route_url || `/pages/${page.slug}`;
                  const isActive = pathname === linkUrl;
                  return (
                    <Link key={page.id} href={linkUrl} className={`flex items-center px-4 py-2 mx-2 rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                      <span className="text-sm font-bold truncate">{page.icon} {page.title}</span>
                    </Link>
                  )
                })}
                
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={toggleSidebar}></div>}
      <main className="flex-1 overflow-y-auto w-full flex flex-col bg-slate-50">
        {children}
      </main>
    </div>
  );
}