"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null); // Thêm biến lưu tên
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from('profiles').select('role, display_name').eq('id', session.user.id).single();
        setRole(data?.role || 'user');
        setDisplayName(data?.display_name || session.user.email); // Lấy tên, nếu không có thì xài email
      } else {
        setUser(null); setRole(null); setDisplayName(null);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        supabase.from('profiles').select('role, display_name').eq('id', session.user.id).single().then(({ data }) => {
          setRole(data?.role || 'user');
          setDisplayName(data?.display_name || session.user.email);
        });
      } else {
        setUser(null); setRole(null); setDisplayName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; path=/; max-age=0;";
    router.push("/login");
    router.refresh();
  };

  if (pathname === "/login") return null;

  return (
    <nav className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center font-sans shadow-md border-b border-slate-700">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold tracking-wider text-blue-400 hover:text-blue-300 transition-all">
          HA-DUONGNT
        </Link>
        {role === 'admin' && (
          <Link href="/admin" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20">
            🔧 Thiết Lập Quản Trị
          </Link>
        )}
      </div>
      
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">
            {/* Hiển thị cái Tên ở đây nè anh hai */}
            Xin chào, <strong className="text-white font-semibold">{displayName}</strong> 
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
              {role === 'admin' ? 'Quản lý' : 'Nhân viên'}
            </span>
          </span>
          <button onClick={handleLogout} className="bg-slate-700 hover:bg-red-600 text-xs font-bold px-3 py-2 rounded-lg transition-all border border-slate-600 hover:border-red-500">
            Đăng Xuất
          </button>
        </div>
      )}
    </nav>
  );
}