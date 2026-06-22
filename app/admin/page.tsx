"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", role: "user" });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.error) alert("❌ Lỗi: " + data.error);
    else alert("✅ Đã cấp tài khoản thành công!");
    setForm({ email: "", password: "", role: "user" });
    setLoading(false);
    fetchUsers();
  };

  const handleResetPassword = async (id: string) => {
    if (!newPassword) return alert("Vui lòng nhập mật khẩu mới!");
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      body: JSON.stringify({ id, newPassword })
    });
    const data = await res.json();
    if (data.error) alert("❌ Lỗi: " + data.error);
    else alert("✅ Đã đặt lại mật khẩu thành công!");
    setNewPassword("");
    setSelectedUserId(null);
    setLoading(false);
  };

  const handleDelete = async (id: string, email: string) => {
    if (confirm(`⚠️ Anh hai có chắc chắn muốn XÓA SỔ tài khoản [ ${email} ] khỏi hệ thống không?`)) {
      setLoading(true);
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) alert("❌ Lỗi: " + data.error);
      else alert("✅ Đã xóa nhân sự thành công!");
      setLoading(false);
      fetchUsers();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        🛡️ Phòng Điều Hành Quản Trị Hệ Thống
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form thêm tài khoản */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-xl font-bold mb-4 text-slate-700">Cấp Ca Trực Mới</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">EMAIL TÀI KHOẢN</label>
              <input type="email" placeholder="VD: nguyenvanA@ha-duongnt.io.vn" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                     value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">MẬT KHẨU KHỞI TẠO</label>
              <input type="password" placeholder="Tối thiểu 6 ký tự" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                     value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">VAI TRÒ HỆ THỐNG</label>
              <select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="user">User (Nhân viên vận hành)</option>
                <option value="admin">Admin (Quản lý cấp cao)</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all disabled:bg-slate-300">
              {loading ? "Đang xử lý..." : "Kích Hoạt Tài Khoản"}
            </button>
          </form>
        </div>

        {/* Danh sách nhân sự */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b bg-slate-50">
            <h2 className="text-xl font-bold text-slate-700">Danh Sách Nhân Sự Đang Quản Lý</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase border-b">
                <tr>
                  <th className="p-4">Email nhân sự</th>
                  <th className="p-4">Quyền hạn</th>
                  <th className="p-4">Truy cập cuối</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-slate-700">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-all">
                    <td className="p-4 font-medium text-slate-900">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {u.last_sign_in ? new Date(u.last_sign_in).toLocaleString('vi-VN') : 'Chưa từng vào mạng'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 justify-center items-center">
                        {selectedUserId === u.id ? (
                          <div className="flex gap-1 items-center bg-slate-100 p-1.5 rounded-lg border">
                            <input type="password" placeholder="Mật khẩu mới" className="p-1 text-xs border rounded outline-none"
                                   value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            <button onClick={() => handleResetPassword(u.id)} className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700">Lưu</button>
                            <button onClick={() => { setSelectedUserId(null); setNewPassword(""); }} className="bg-slate-400 text-white text-xs px-2 py-1 rounded hover:bg-slate-500">Hủy</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedUserId(u.id)} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                              🔑 Reset Pass
                            </button>
                            {u.email !== 'admin@ha-duongnt.io.vn' && (
                              <button onClick={() => handleDelete(u.id, u.email)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                                🗑️ Xóa Sổ
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}