"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Đang xác thực...");

    // 1. Gửi yêu cầu đăng nhập lên Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ Lỗi: " + error.message);
    } else if (data?.session) {
      setMessage("✅ Đăng nhập thành công! Đang chuyển hướng...");

      // 2. Lưu token vào Cookie để người bảo vệ Middleware ở Server đọc được
      const token = data.session.access_token;
      document.cookie = `sb-access-token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

      // 3. Chuyển hướng về trang chủ
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">HA-DUONGNT</h1>
          <p className="text-slate-500 mt-2">Hệ thống quản lý vận hành xưởng cán</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email tài khoản</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="name@ha-duongnt.io.vn"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
          >
            Đăng Nhập Hệ Thống
          </button>
        </form>

        {message && (
          <div className="mt-6 p-3 bg-slate-50 text-center rounded-xl font-medium text-sm text-slate-700 border border-slate-100">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}