"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", role: "user", display_name: "" });
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
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
    setForm({ email: "", password: "", role: "user", display_name: "" });
    setLoading(false);
    fetchUsers();
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      body: JSON.stringify({ id, newPassword, display_name: editDisplayName })
    });
    const data = await res.json();
    if (data.error) alert("❌ Lỗi: " + data.error);
    else alert("✅ Đã cập nhật thành công!");
    setSelectedUserId(null);
    setNewPassword("");
    setLoading(false);
    fetchUsers();
  };

  const handleDelete = async (id: string, nameOrEmail: string) => {
    if (confirm(`⚠️ Anh hai có chắc muốn XÓA SỔ [ ${nameOrEmail} ] không?`)) {
      setLoading(true);
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) alert("❌ Lỗi: " + data.error);
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
              <label className="block text-xs font-bold text-slate-500 mb-1">TÊN HIỂN THỊ</label>
              <input type="text" placeholder="VD: Nguyễn Văn A" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                     value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">EMAIL ĐĂNG NHẬP</label>
              <input type="email" placeholder="VD: nv.a@ha-duongnt.io.vn" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                     value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">MẬT KHẨU</label>
              <input type="password" placeholder="Tối thiểu 6 ký tự" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                     value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">VAI TRÒ</label>
              <select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="user">User (Nhân viên)</option>
                <option value="admin">Admin (Quản lý)</option>
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
            <h2 className="text-xl font-bold text-slate-700">Danh Sách Nhân Sự</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase border-b">
                <tr>
                  <th className="p-4">Nhân sự</th>
                  <th className="p-4">Quyền</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-slate-700">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-all">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-base">{u.display_name || 'Chưa đặt tên'}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 justify-center items-center">
                        {selectedUserId === u.id ? (
                          <div className="flex flex-col gap-2 bg-slate-100 p-3 rounded-xl border w-full min-w-[200px]">
                            <input type="text" placeholder="Tên hiển thị mới" className="p-2 text-sm border rounded outline-none focus:border-blue-500"
                                   value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} />
                            <input type="password" placeholder="Mật khẩu mới (bỏ trống nếu giữ nguyên)" className="p-2 text-sm border rounded outline-none focus:border-blue-500"
                                   value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            <div className="flex gap-2 w-full">
                              <button onClick={() => handleUpdate(u.id)} className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded hover:bg-green-700">Lưu</button>
                              <button onClick={() => { setSelectedUserId(null); setNewPassword(""); }} className="flex-1 bg-slate-400 text-white text-xs font-bold py-2 rounded hover:bg-slate-500">Hủy</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedUserId(u.id); setEditDisplayName(u.display_name || ""); }} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all">
                              ✏️ Sửa Tên / Pass
                            </button>
                            {u.email !== 'admin@ha-duongnt.io.vn' && (
                              <button onClick={() => handleDelete(u.id, u.display_name || u.email)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all">
                                🗑️ Xóa
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