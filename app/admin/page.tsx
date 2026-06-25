"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "pages">("users");
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", role: "user", display_name: "" });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [customPages, setCustomPages] = useState<any[]>([]);
  const [designingPage, setDesigningPage] = useState<any | null>(null);
  const [pageBlocks, setPageBlocks] = useState<any[]>([]);
  
  // Trạng thái quản lý Modal Thêm/Sửa Cấu Hình Menu
  const [editingPageMeta, setEditingPageMeta] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchPages();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
  };

  const fetchPages = async () => {
    const { data } = await supabase.from("custom_pages").select("*").order("order_index", { ascending: true }).order("created_at", { ascending: true });
    if (data) setCustomPages(data);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
    const data = await res.json();
    if (data.error) alert(" Lỗi: " + data.error);
    else alert(" Đã cấp tài khoản thành công!");
    setForm({ email: "", password: "", role: "user", display_name: "" });
    setLoading(false);
    fetchUsers();
  };

  const handleUpdateUser = async (id: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/users", { method: "PUT", body: JSON.stringify({ id, newPassword, display_name: editDisplayName }) });
    const data = await res.json();
    if (data.error) alert(" Lỗi: " + data.error);
    else alert(" Cập nhật nhân sự thành công!");
    setSelectedUserId(null);
    setNewPassword("");
    setLoading(false);
    fetchUsers();
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(` Chắc xóa [ ${name} ] không?`)) {
      setLoading(true);
      await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      setLoading(false);
      fetchUsers();
    }
  };

  // ----- LOGIC ĐIỀU HÀNH MENU & TRANG -----
  const handleSavePageMeta = async () => {
    if (!editingPageMeta.title) return alert("Vui lòng nhập tên Menu!");
    
    const payload = {
      title: editingPageMeta.title,
      icon: editingPageMeta.icon || '📄',
      group_name: editingPageMeta.group_name || 'KHÁC',
      folder_name: editingPageMeta.folder_name || null,
      route_url: editingPageMeta.route_url || null,
      order_index: editingPageMeta.order_index || 0,
    };

    if (editingPageMeta.id) {
       await supabase.from("custom_pages").update(payload).eq("id", editingPageMeta.id);
    } else {
       const slug = editingPageMeta.title.trim().toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, "") + "-" + Date.now().toString().slice(-4);
       await supabase.from("custom_pages").insert({ ...payload, slug, blocks: [] });
    }
    setEditingPageMeta(null);
    fetchPages();
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("⚠️ Chắc chắn XÓA SỔ trang/menu này khỏi hệ thống không anh hai?")) return;
    await supabase.from("custom_pages").delete().eq("id", id);
    if (designingPage?.id === id) setDesigningPage(null);
    fetchPages();
  };

  const openDesigner = (page: any) => {
    setDesigningPage(page);
    setPageBlocks(page.blocks || []);
  };

  const handleAddBlock = (type: "heading" | "text") => {
    setPageBlocks([...pageBlocks, { type, content: "" }]);
  };

  const handleBlockChange = (index: number, value: string) => {
    const updated = [...pageBlocks];
    updated[index].content = value;
    setPageBlocks(updated);
  };

  const handleRemoveBlock = (index: number) => {
    setPageBlocks(pageBlocks.filter((_, i) => i !== index));
  };

  const handleSaveDesign = async () => {
    setLoading(true);
    await supabase.from("custom_pages").update({ blocks: pageBlocks }).eq("id", designingPage.id);
    alert(" Saved! Thiết kế của trang đã được đồng bộ lên mây.");
    setLoading(false);
    setDesigningPage(null);
    fetchPages();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans relative">
      <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">🛡️ Bộ Chỉ Huy Hệ Thống</h1>
      
      <div className="flex gap-4 border-b border-slate-200 mb-8">
        <button onClick={() => setActiveTab("users")} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          👥 Quản Lý Nhân Sự
        </button>
        <button onClick={() => setActiveTab("pages")} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'pages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          📄 Quản Lý Menu & Trang Động
        </button>
      </div>

      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-xl font-bold mb-4 text-slate-700">Cấp Ca Trực Mới</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">TÊN HIỂN THỊ</label>
                <input type="text" placeholder="VD: Nguyễn Văn A" className="w-full p-3 border rounded-xl outline-none" value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">EMAIL ĐĂNG NHẬP</label>
                <input type="email" placeholder="VD: nv.a@ha-duongnt.io.vn" className="w-full p-3 border rounded-xl outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">MẬT KHẨU</label>
                <input type="password" placeholder="Tối thiểu 6 ký tự" className="w-full p-3 border rounded-xl outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">VAI TRÒ</label>
                <select className="w-full p-3 border rounded-xl outline-none bg-white" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="user">User (Nhân viên)</option>
                  <option value="admin">Admin (Quản lý)</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">{loading ? "Đang xử lý..." : "Kích Hoạt Tài Khoản"}</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase border-b">
                <tr><th className="p-4">Nhân sự</th><th className="p-4">Quyền</th><th className="p-4 text-center">Hành động</th></tr>
              </thead>
              <tbody className="divide-y text-sm text-slate-700">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-all">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-base">{u.display_name || 'Chưa đặt tên'}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{u.role.toUpperCase()}</span>
                    </td>
                    <td className="p-4 text-center">
                      {selectedUserId === u.id ? (
                        <div className="flex flex-col gap-2 bg-slate-100 p-3 rounded-xl border min-w-[200px]">
                          <input type="text" className="p-2 text-sm border rounded bg-white" value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} />
                          <input type="password" placeholder="Mật khẩu mới" className="p-2 text-sm border rounded bg-white" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                          <div className="flex gap-2"><button onClick={() => handleUpdateUser(u.id)} className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded">Lưu</button><button onClick={() => setSelectedUserId(null)} className="flex-1 bg-slate-400 text-white text-xs font-bold py-2 rounded">Hủy</button></div>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => { setSelectedUserId(u.id); setEditDisplayName(u.display_name || ""); }} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg">✏️ Sửa</button>
                          {u.email !== 'admin@ha-duongnt.io.vn' && <button onClick={() => handleDeleteUser(u.id, u.display_name || u.email)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg">🗑️ Xóa</button>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN TRỊ MENU TOÀN NĂNG */}
      {activeTab === "pages" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-700">📌 Danh sách Menu</h2>
              <button onClick={() => setEditingPageMeta({ title: "", icon: "📄", group_name: "VẬN HÀNH SẢN XUẤT", folder_name: "", route_url: "", order_index: 0 })} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs">+ Thêm Menu</button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-2 pb-4">
              {customPages.map(page => (
                <div key={page.id} className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${designingPage?.id === page.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-bold text-sm text-slate-700 truncate">{page.icon} {page.title}</span>
                      <span className="text-[10px] text-slate-500 truncate mt-0.5">{page.group_name} {page.folder_name ? `> ${page.folder_name}` : ''}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!page.route_url && (
                        <button onClick={() => openDesigner(page)} className="bg-blue-600 text-white text-[11px] px-2 py-1 rounded hover:bg-blue-700">🎨 Thiết kế</button>
                      )}
                      <button onClick={() => setEditingPageMeta(page)} className="bg-amber-500 text-white text-[11px] px-1.5 py-1 rounded hover:bg-amber-600">⚙ Cấu hình</button>
                      <button onClick={() => handleDeletePage(page.id)} className="bg-red-500 text-white text-[11px] px-1.5 py-1 rounded hover:bg-red-600">🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[60vh]">
            {designingPage ? (
              <div className="flex flex-col h-full flex-1">
                <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase">Đang thiết kế trang:</span>
                    <h2 className="text-xl font-extrabold text-slate-800">{designingPage.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddBlock("heading")} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg">+ Khối Tiêu Đề</button>
                    <button onClick={() => handleAddBlock("text")} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg">+ Khối Nội Dung</button>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-slate-50/50">
                  {pageBlocks.map((block, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border shadow-sm relative group">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${block.type === 'heading' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {block.type === 'heading' ? 'Khối Tiêu Đề' : 'Khối Nội Dung Văn Bản'}
                        </span>
                        <button onClick={() => handleRemoveBlock(index)} className="text-red-400 hover:text-red-600 text-xs font-bold">Xóa khối</button>
                      </div>
                      
                      {block.type === "heading" ? (
                        <input type="text" value={block.content} onChange={e => handleBlockChange(index, e.target.value)} placeholder="Gõ tiêu đề đoạn vào đây..." className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 font-bold" />
                      ) : (
                        <textarea value={block.content} onChange={e => handleBlockChange(index, e.target.value)} placeholder="Gõ ghi chú, văn bản hướng dẫn chi tiết vào đây..." rows={3} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 text-sm" />
                      )}
                    </div>
                  ))}
                  
                  {pageBlocks.length === 0 && (
                    <p className="text-slate-400 text-sm italic text-center py-12">Trang đang trống, anh hai bấm nút góc phải ở trên để thêm cấu trúc nhé!</p>
                  )}
                </div>

                <div className="p-4 bg-white border-t flex justify-end gap-3">
                  <button onClick={() => setDesigningPage(null)} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100">Hủy</button>
                  <button onClick={handleSaveDesign} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-xl text-sm shadow-md shadow-green-500/20">💾 Lưu Bản Thiết Kế</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 italic">
                <span>🎨 Bấm "Thiết kế" ở một trang bất kỳ bên trái (Trang không có link cứng) để bắt đầu.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HỘP THOẠI CHỈNH SỬA TOÀN NĂNG (MODAL) */}
      {editingPageMeta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-extrabold text-blue-700 mb-6 border-b pb-3">{editingPageMeta.id ? '⚙️ Cấu Hình Menu' : '➕ Thêm Menu Mới'}</h2>
            
            <div className="space-y-4">
               <div className="flex gap-4">
                 <div className="w-24 shrink-0">
                   <label className="block text-xs font-bold mb-1.5 text-slate-500">Biểu tượng</label>
                   <input type="text" value={editingPageMeta.icon} onChange={e => setEditingPageMeta({...editingPageMeta, icon: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" />
                 </div>
                 <div className="flex-1">
                   <label className="block text-xs font-bold mb-1.5 text-slate-500">Tên Menu / Trang <span className="text-red-500">*</span></label>
                   <input type="text" value={editingPageMeta.title} onChange={e => setEditingPageMeta({...editingPageMeta, title: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 font-bold" />
                 </div>
               </div>
               
               <div>
                 <label className="block text-xs font-bold mb-1.5 text-slate-500">Nhóm hiển thị (vd: VẬN HÀNH SẢN XUẤT)</label>
                 <input type="text" value={editingPageMeta.group_name} onChange={e => setEditingPageMeta({...editingPageMeta, group_name: e.target.value.toUpperCase()})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 uppercase" />
               </div>
               
               <div>
                 <label className="block text-xs font-bold mb-1.5 text-slate-500">Thư mục con (để trống nếu muốn nó đứng riêng ở ngoài)</label>
                 <input type="text" value={editingPageMeta.folder_name || ""} onChange={e => setEditingPageMeta({...editingPageMeta, folder_name: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" placeholder="vd: Thông số xưởng cán" />
               </div>

               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-xs font-bold mb-1.5 text-slate-500">Link trỏ đến (route_url)</label>
                   <input type="text" value={editingPageMeta.route_url || ""} onChange={e => setEditingPageMeta({...editingPageMeta, route_url: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" placeholder="vd: /xuong-can/dang-cho (Bỏ trống = Trang thiết kế)" />
                 </div>
                 <div className="w-24 shrink-0">
                   <label className="block text-xs font-bold mb-1.5 text-slate-500">Thứ tự xếp</label>
                   <input type="number" value={editingPageMeta.order_index || 0} onChange={e => setEditingPageMeta({...editingPageMeta, order_index: parseInt(e.target.value) || 0})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" />
                 </div>
               </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
              <button onClick={() => setEditingPageMeta(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all">Hủy bỏ</button>
              <button onClick={handleSavePageMeta} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/30 transition-all">Lưu Cấu Hình</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}