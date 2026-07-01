"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

// --- LÕI BÓC TÁCH DRIVE BẰNG API KEY TRỰC TIẾP ---
const DriveFolderViewer = ({ url }: { url: string }) => {
  const [data, setData] = useState<{ readme: string, files: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!url || url.trim() === "") return;
    
    // Tự động gạn lọc: Dù anh hai dán link dài hay chỉ dán Folder ID thì hệ thống vẫn lấy chuẩn
    let folderId = url.trim();
    if (folderId.includes("drive.google.com")) {
      const match = folderId.match(/(?:folders\/|id=)([a-zA-Z0-9-_]+)/);
      folderId = match ? match[1] : "";
    }

    if (folderId) {
      setLoading(true);
      setErrorMsg("");
      
      const API_KEY = 'AIzaSyB-WBOZfXXZgehcn-8TOXG-mlE7pxfqPk8';
      const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${API_KEY}`;

      fetch(apiUrl)
        .then(res => {
          if (!res.ok) throw new Error("Mã Folder ID sai hoặc chưa Share Public");
          return res.json();
        })
        .then(async (json) => {
          if (json.error) throw new Error(json.error.message);
          const files = json.files || [];
          
          // Động cơ quét tìm file README tự động
          const readmeFile = files.find((f: any) => f.name.toLowerCase() === 'readme.md' || f.name.toLowerCase() === 'readme.txt');
          let readmeContent = "📌 Thư mục này không có file README.md hoặc readme.txt.";
          
          if (readmeFile) {
            try {
              const readmeRes = await fetch(`https://www.googleapis.com/drive/v3/files/${readmeFile.id}?alt=media&key=${API_KEY}`);
              if (readmeRes.ok) {
                readmeContent = await readmeRes.text();
              }
            } catch (e) {
              readmeContent = "⚠️ Có lỗi khi cố tải nội dung file README.";
            }
          }

          // Phân loại tệp tin và gán Icon siêu thông minh
          const displayFiles = files.filter((f: any) => f.id !== readmeFile?.id).map((f: any) => {
            let icon = '📄';
            const nameLower = f.name.toLowerCase();
            if (nameLower.endsWith('.pdf')) icon = '📕';
            else if (nameLower.endsWith('.exe') || nameLower.endsWith('.msi')) icon = '📦';
            else if (nameLower.endsWith('.zip') || nameLower.endsWith('.rar') || nameLower.endsWith('.7z')) icon = '📚';
            else if (nameLower.endsWith('.doc') || nameLower.endsWith('.docx')) icon = '📝';
            else if (nameLower.endsWith('.xls') || nameLower.endsWith('.xlsx')) icon = '📊';
            else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg')) icon = '🖼️';
            else if (f.mimeType === 'application/vnd.google-apps.folder') icon = '📁';
            return { name: f.name, icon, id: f.id };
          });

          setData({ readme: readmeContent, files: displayFiles });
          setLoading(false);
        })
        .catch((err) => {
          setErrorMsg(`❌ Báo cáo: Không lấy được dữ liệu! (${err.message}). Anh hai nhớ kiểm tra lại Folder ID và đảm bảo thư mục Drive đã bật "Bất kỳ ai có liên kết".`);
          setLoading(false);
        });
    }
  }, [url]);

  if (!url || url.trim() === "") return null;

  return (
    <div className="mt-6 border-t border-slate-200 border-dashed pt-5 w-full animate-fade-in">
      <div className="flex items-center gap-2 mb-4 text-sm font-bold text-blue-700 bg-blue-50 w-max px-4 py-1.5 rounded-full border border-blue-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm0 2v14h10V5H7z"/></svg>
        Kho Phần Mềm Đính Kèm
      </div>
      
      {loading ? (
        <div className="h-40 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 text-blue-500 font-bold animate-pulse text-base">
          ⏳ Đang kết nối trực tiếp vào Google Drive để quét...
        </div>
      ) : errorMsg ? (
        <div className="h-40 flex items-center justify-center bg-red-50 rounded-2xl border border-red-200 text-red-500 font-bold text-sm px-6 text-center">
          {errorMsg}
        </div>
      ) : data ? (
        <div className="flex flex-col lg:flex-row gap-5 h-80">
          <div className="flex-[2] bg-slate-900 text-slate-200 p-6 rounded-2xl overflow-y-auto shadow-inner custom-scrollbar relative group">
            <span className="absolute top-0 right-0 bg-blue-600 text-[10px] text-white font-extrabold px-3 py-1 rounded-bl-xl tracking-widest uppercase shadow-md">Tài liệu README</span>
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed mt-2">{data.readme}</pre>
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-y-auto shadow-sm p-3 custom-scrollbar">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3 border-b border-slate-100 pb-2">Danh sách tệp tin</span>
            <div className="flex flex-col gap-1.5">
              {data.files.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 hover:bg-blue-50 hover:shadow-sm rounded-xl cursor-pointer border border-transparent hover:border-blue-100 transition-all">
                  <span className="text-2xl drop-shadow-sm">{file.icon}</span>
                  <span className="text-sm font-bold text-slate-700 truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
// -----------------------------------------------------------

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
  
  const [editingPageMeta, setEditingPageMeta] = useState<any | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [searchBlockQuery, setSearchBlockQuery] = useState("");

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
    const { data } = await supabase.from("custom_pages").select("*");
    if (data) {
      const sortedData = data.sort((a, b) => {
        const groupA = (a.group_name || "Z_KHÁC").toUpperCase();
        const groupB = (b.group_name || "Z_KHÁC").toUpperCase();
        if (groupA !== groupB) return groupA.localeCompare(groupB, 'vi');
        const folderA = (a.folder_name || "").toUpperCase();
        const folderB = (b.folder_name || "").toUpperCase();
        if (folderA !== folderB) return folderA.localeCompare(folderB, 'vi');
        return (a.order_index || 0) - (b.order_index || 0);
      });
      setCustomPages(sortedData);
    }
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
    setSearchBlockQuery("");
  };

  const handleAddBlock = (type: "heading" | "text") => {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: "",
      content: "",
      imageUrl: "",
      driveUrl: "", 
      width: "col-span-12", 
      bgColor: "bg-white",
      textColor: "text-slate-800",
      textSize: type === "heading" ? "text-xl" : "text-sm",
    };
    setPageBlocks([...pageBlocks, newBlock]);
    setTimeout(() => {
      const container = document.getElementById('designer-workspace');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  };

  const handleDuplicateBlock = (index: number) => {
    const blockToCopy = pageBlocks[index];
    const newBlock = {
      ...blockToCopy,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    };
    const updated = [...pageBlocks];
    updated.splice(index + 1, 0, newBlock);
    setPageBlocks(updated);
  };

  const handleBlockPropChange = (index: number, key: string, value: string) => {
    const updated = [...pageBlocks];
    updated[index] = { ...updated[index], [key]: value };
    setPageBlocks(updated);
  };

  const handleRemoveBlock = (index: number) => {
    if (!confirm("🗑️ Anh hai có chắc chắn muốn xóa khối nội dung này không?")) return;
    setPageBlocks(pageBlocks.filter((_, i) => i !== index));
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === pageBlocks.length - 1) return;
    const updated = [...pageBlocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPageBlocks(updated);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...pageBlocks];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setPageBlocks(updated);
  };

  const handleSaveDesign = async () => {
    setLoading(true);
    await supabase.from("custom_pages").update({ blocks: pageBlocks }).eq("id", designingPage.id);
    alert(" Saved! Thiết kế đa năng đã được đồng bộ lên mây.");
    setLoading(false);
    setDesigningPage(null);
    fetchPages();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans relative">
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

      {activeTab === "pages" && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-700">📌 Danh sách Menu</h2>
              <button onClick={() => setEditingPageMeta({ title: "", icon: "📄", group_name: "VẬN HÀNH SẢN XUẤT", folder_name: "", route_url: "", order_index: 0 })} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs">+ Thêm</button>
            </div>
            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              {customPages.map(page => (
                <div key={page.id} className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${designingPage?.id === page.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col truncate pr-2 w-full">
                      <span className="font-bold text-sm text-slate-700 truncate">{page.icon} {page.title}</span>
                      <span className="text-[10px] text-slate-400 truncate mt-0.5">{page.group_name} {page.folder_name ? `> ${page.folder_name}` : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 justify-end border-t pt-2 border-dashed border-slate-200">
                    {!page.route_url && (
                      <button onClick={() => openDesigner(page)} className="bg-blue-600 text-white text-[11px] px-2 py-1 rounded-md hover:bg-blue-700 font-bold">🎨 Thiết kế</button>
                    )}
                    <button onClick={() => setEditingPageMeta(page)} className="bg-slate-700 text-slate-200 text-[11px] px-2 py-1 rounded-md hover:bg-slate-800 font-bold">⚙ Cấu hình</button>
                    <button onClick={() => handleDeletePage(page.id)} className="bg-red-500 text-white text-[11px] px-1.5 py-1 rounded-md hover:bg-red-600">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] relative">
            {designingPage ? (
              <div className="flex flex-col h-full flex-1 relative">
                
                <div className="p-5 border-b bg-slate-800 text-white flex justify-between items-center z-30">
                  <div className="truncate">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Trang thiết kế:</span>
                    <h2 className="text-lg font-extrabold truncate w-48 sm:w-full">{designingPage.title}</h2>
                  </div>
                </div>

                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50 pointer-events-none">
                  <button onClick={() => handleAddBlock("heading")} className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-2xl shadow-blue-600/30 flex items-center gap-2 border border-blue-500 hover:scale-105">
                    <span className="text-lg">➕</span> Tiêu Đề
                  </button>
                  <button onClick={() => handleAddBlock("text")} className="pointer-events-auto bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-2xl shadow-purple-600/30 flex items-center gap-2 border border-purple-500 hover:scale-105">
                    <span className="text-lg">📄</span> Văn Bản
                  </button>
                </div>

                <div id="designer-workspace" className="p-6 flex-1 overflow-y-auto bg-slate-100/70 scroll-smooth pb-24 relative">
                  <div className="grid grid-cols-12 gap-4">
                    {pageBlocks.map((block, index) => (
                      <div 
                        id={block.id} 
                        key={block.id || index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        className={`${block.width || 'col-span-12'} ${block.bgColor || 'bg-white'} p-4 rounded-2xl border border-slate-200 shadow-sm relative group/block transition-all duration-300 hover:shadow-md cursor-grab active:cursor-grabbing`}
                      >
                        <div className="flex flex-wrap gap-2 items-center justify-between mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100 opacity-90 group-hover/block:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <span className="cursor-move text-slate-400 mr-1" title="Kéo thả để đổi vị trí">☰</span>
                            <button onClick={() => handleMoveBlock(index, "up")} className="hover:bg-slate-200 px-1.5 py-0.5 rounded" title="Dịch lên">▲</button>
                            <button onClick={() => handleMoveBlock(index, "down")} className="hover:bg-slate-200 px-1.5 py-0.5 rounded" title="Dịch xuống">▼</button>
                            <span className="ml-1 text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                              {block.type === 'heading' ? 'TIÊU ĐỀ' : 'NỘI DUNG'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 items-center">
                            <select value={block.width || "col-span-12"} onChange={e => handleBlockPropChange(index, "width", e.target.value)} className="text-[11px] font-bold p-1 border rounded bg-white outline-none text-slate-600">
                              <option value="col-span-12">↔️ Rộng Full</option>
                              <option value="col-span-6">🌓 Rộng 1/2</option>
                              <option value="col-span-4">⅓ Rộng 1/3</option>
                              <option value="col-span-3">¼ Rộng 1/4</option>
                            </select>

                            <select value={block.bgColor || "bg-white"} onChange={e => handleBlockPropChange(index, "bgColor", e.target.value)} className="text-[11px] font-bold p-1 border rounded bg-white outline-none text-slate-600">
                              <option value="bg-white">⚪ Nền Trắng</option>
                              <option value="bg-slate-50">📁 Nền Xám</option>
                              <option value="bg-blue-50 text-blue-900">🔷 Nền Xanh</option>
                              <option value="bg-amber-50 text-amber-900">🔶 Nền Vàng</option>
                              <option value="bg-red-50 text-red-900">🛑 Nền Đỏ</option>
                              <option value="bg-slate-800 text-white">⬛ Nền Đen</option>
                            </select>

                            <select value={block.textColor || "text-slate-800"} onChange={e => handleBlockPropChange(index, "textColor", e.target.value)} className="text-[11px] font-bold p-1 border rounded bg-white outline-none text-slate-600">
                              <option value="text-slate-800">⚫ Chữ Đen</option>
                              <option value="text-blue-600">🔵 Chữ Xanh Dương</option>
                              <option value="text-amber-600">🟡 Chữ Vàng Cam</option>
                              <option value="text-red-500">🔴 Chữ Đỏ</option>
                              <option value="text-green-600">🟢 Chữ Xanh Lá</option>
                              <option value="text-white">⚪ Chữ Trắng</option>
                            </select>

                            <select value={block.textSize || "text-sm"} onChange={e => handleBlockPropChange(index, "textSize", e.target.value)} className="text-[11px] font-bold p-1 border rounded bg-white outline-none text-slate-600">
                              <option value="text-xs">Cỡ Nhỏ</option>
                              <option value="text-sm">Cỡ Vừa</option>
                              <option value="text-base">Cỡ Lớn</option>
                              <option value="text-lg">Tiêu Đề Nhỏ</option>
                              <option value="text-xl">Tiêu Đề Vừa</option>
                              <option value="text-2xl">Tiêu Đề Lớn</option>
                            </select>

                            <button onClick={() => handleDuplicateBlock(index)} className="text-blue-600 bg-white hover:bg-blue-100 p-1.5 rounded-lg font-bold text-xs border border-blue-200 transition-colors ml-1" title="Nhân bản khối này">📑 Copy</button>
                            <button onClick={() => handleRemoveBlock(index)} className="text-red-600 bg-white hover:bg-red-100 p-1.5 rounded-lg font-bold text-xs border border-red-200 transition-colors" title="Xóa khối này">🗑️ Xóa</button>
                          </div>
                        </div>
                        
                        <div className="mb-2.5">
                          <input 
                            type="text"
                            value={block.title || ""}
                            onChange={e => handleBlockPropChange(index, "title", e.target.value)}
                            placeholder="🏷️ Nhập tiêu đề riêng cho khối này (Khóa tìm kiếm User ăn theo dòng này)..."
                            className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-extrabold text-slate-700 outline-none focus:border-blue-400 transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input 
                            type="text"
                            value={block.imageUrl || ""}
                            onChange={e => handleBlockPropChange(index, "imageUrl", e.target.value)}
                            placeholder="🖼️ Dán link ảnh đính kèm (URL) vào đây..."
                            className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono outline-none focus:border-blue-400 transition-all"
                          />
                          <input 
                            type="text"
                            value={block.driveUrl || ""}
                            onChange={e => handleBlockPropChange(index, "driveUrl", e.target.value)}
                            placeholder="📂 Nhập mã Folder ID của Google Drive vào đây..."
                            className="w-full p-2 text-xs border border-blue-200 rounded-lg bg-blue-50 text-blue-700 font-mono outline-none focus:border-blue-500 transition-all placeholder:text-blue-300"
                          />
                        </div>
                        
                        {block.type === "heading" ? (
                          <input type="text" value={block.content} onChange={e => handleBlockPropChange(index, "content", e.target.value)} placeholder="✍️ Gõ nội dung chính..." className={`w-full p-2 bg-transparent border-b border-dashed border-slate-300 outline-none font-extrabold ${block.textColor} ${block.textSize}`} />
                        ) : (
                          <textarea value={block.content} onChange={e => handleBlockPropChange(index, "content", e.target.value)} placeholder="✍️ Nhập văn bản ghi chú chi tiết..." rows={4} className={`w-full p-2 bg-transparent border border-dashed border-slate-200 rounded-xl outline-none resize-y ${block.textColor} ${block.textSize}`} />
                        )}

                        {block.imageUrl && (
                          <div className="mt-2 text-center border rounded-xl overflow-hidden bg-slate-50 max-h-48 flex items-center justify-center p-2">
                            <img src={block.imageUrl} alt="Preview đính kèm" className="max-h-44 object-contain rounded" onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
                          </div>
                        )}

                        {block.driveUrl && <DriveFolderViewer url={block.driveUrl} />}
                      </div>
                    ))}
                  </div>
                  
                  {pageBlocks.length === 0 && (
                    <div className="text-center py-24 text-slate-400 italic bg-white rounded-2xl border-2 border-dashed border-slate-300">
                      🚀 Trang chưa có nội dung! Bấm nút thêm khối bên phải để kiến thiết nhé!
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t flex justify-end gap-3 shrink-0 absolute bottom-0 right-0 w-full rounded-b-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40">
                  <button onClick={() => setDesigningPage(null)} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100">Hủy bỏ</button>
                  <button onClick={handleSaveDesign} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-xl text-sm shadow-md shadow-green-500/20">💾 Lưu Bản Thiết Kế Đa Năng</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 italic">
                <span className="text-5xl mb-4">🎨</span>
                <span className="text-center max-w-md">Xưởng kiến trúc trang động đang đợi lệnh. Anh hai hãy bấm chọn nút "🎨 Thiết kế" ở một trang bất kỳ tại danh sách bên trái để bắt đầu ra chiêu!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CẤU HÌNH MENU */}
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
                 <label className="block text-xs font-bold mb-1.5 text-slate-500">Thư mục con (để trống nếu đứng riêng)</label>
                 <input type="text" value={editingPageMeta.folder_name || ""} onChange={e => setEditingPageMeta({...editingPageMeta, folder_name: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" placeholder="vd: Thông số xưởng cán" />
               </div>
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-xs font-bold mb-1.5 text-slate-500">Link trỏ đến (route_url)</label>
                   <input type="text" value={editingPageMeta.route_url || ""} onChange={e => setEditingPageMeta({...editingPageMeta, route_url: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500" placeholder="vd: /xuong-can/dang-cho (Trống = Trang tự thiết kế)" />
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