"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import { supabase } from "../../../lib/supabase";

export default function SanPhamPage() {
  const [columns, setColumns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [role, setRole] = useState("user");
  const [userId, setUserId] = useState(""); // Lưu ID người dùng để phân quyền
  
  const [newColName, setNewColName] = useState("");
  const [newProductName, setNewProductName] = useState("");

  // Các State phục vụ Modal Chi tiết sản phẩm
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSession();
    fetchData();
  }, []);

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (data) setRole(data.role);
    }
  };

  const fetchData = async () => {
    const [colsRes, prodsRes] = await Promise.all([
      supabase.from('product_columns').select('*').order('order_index', { ascending: true }),
      supabase.from('products').select('*').order('name', { ascending: true }) 
    ]);
    if (colsRes.data) setColumns(colsRes.data);
    if (prodsRes.data) setProducts(prodsRes.data);
  };

  // ----- CÁC HÀM CHO ADMIN QUẢN LÝ CỘT -----
  const handleAddColumn = async () => {
    if (!newColName) return;
    const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order_index)) : 0;
    await supabase.from('product_columns').insert({ name: newColName, order_index: maxOrder + 1 });
    setNewColName("");
    fetchData();
  };

  const handleDeleteColumn = async (id: string) => {
    if (!confirm("⚠️ Chắc chắn xóa cột thông số này?")) return;
    await supabase.from('product_columns').delete().eq('id', id);
    fetchData();
  };

  const handleMoveColumn = async (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return; 
    if (direction === 'right' && index === columns.length - 1) return; 

    const newCols = [...columns];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    const tempOrder = newCols[index].order_index;
    newCols[index].order_index = newCols[targetIndex].order_index;
    newCols[targetIndex].order_index = tempOrder;

    await supabase.from('product_columns').upsert([
      { id: newCols[index].id, name: newCols[index].name, order_index: newCols[index].order_index },
      { id: newCols[targetIndex].id, name: newCols[targetIndex].name, order_index: newCols[targetIndex].order_index }
    ]);
    fetchData(); 
  };

  // ----- QUẢN LÝ SẢN PHẨM -----
  const handleAddProduct = async () => {
    if (!newProductName) return;
    // Gắn thẻ tên (created_by) khi tạo sản phẩm mới
    await supabase.from('products').insert({ name: newProductName, data: {}, created_by: userId });
    setNewProductName("");
    fetchData();
  };

  const handleDeleteProduct = async (product: any) => {
    // Thuật toán kiểm tra quyền
    if (role !== 'admin' && product.created_by !== userId) {
      return alert("❌ Anh hai không có quyền xóa sản phẩm do người khác tạo!");
    }
    if (!confirm(`⚠️ Chắc chắn xóa sản phẩm [ ${product.name} ]?`)) return;
    
    await supabase.from('products').delete().eq('id', product.id);
    fetchData();
  };

  // ----- MODAL CHI TIẾT SẢN PHẨM -----
  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setEditData(product.data || {});
  };

  const saveProductData = async () => {
    setIsSaving(true);
    await supabase.from('products').update({ data: editData }).eq('id', selectedProduct.id);
    
    // Cập nhật lại UI ngay lập tức
    setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, data: editData } : p));
    setIsSaving(false);
    setSelectedProduct(null); // Đóng Modal
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Biến kiểm tra quyền của User đang đăng nhập đối với sản phẩm đang mở trên Modal
  const canEditSelected = selectedProduct && (role === 'admin' || selectedProduct.created_by === userId);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-full mx-auto w-full font-sans relative">
        
        {/* Tiêu đề & Thanh Tìm Kiếm */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-full md:w-1/2 relative">
            <span className="absolute left-4 top-3 text-slate-400">🔍</span>
            <input 
              type="text" placeholder="Nhập tên sản phẩm (VD: D22 CB400)..." 
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-slate-700"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input type="text" placeholder="Tên SP mới..." value={newProductName} onChange={e => setNewProductName(e.target.value)} className="p-3 border rounded-xl outline-none focus:border-blue-500 text-sm w-full md:w-48" />
            <button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl whitespace-nowrap transition-all shadow-md shadow-blue-500/30">
              + Thêm SP
            </button>
          </div>
        </div>

        {/* Bảng Dữ Liệu Thu Gọn (Có độ rộng cố định) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {role === 'admin' && (
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex gap-2 items-center">
              <span className="text-sm font-bold text-slate-500 uppercase">🔧 Cài đặt Cột:</span>
              <input type="text" placeholder="Tên thông số (Cơ tính...)" value={newColName} onChange={e => setNewColName(e.target.value)} className="p-2 border rounded-lg outline-none text-sm w-64 focus:border-purple-500" />
              <button onClick={handleAddColumn} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all">
                + Thêm Cột Mới
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b text-slate-600 text-sm">
                <tr>
                  <th className="p-4 font-extrabold border-r w-[250px]">Sản phẩm</th>
                  {columns.map((col, index) => (
                    <th key={col.id} className="p-4 font-bold border-r group w-[200px]">
                      <div className="flex justify-between items-center overflow-hidden">
                        <span className="truncate">{col.name}</span>
                        {role === 'admin' && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/90 px-1 rounded absolute mt-8 shadow border">
                            <button onClick={() => handleMoveColumn(index, 'left')} className="text-blue-600 hover:bg-slate-200 p-1 rounded">◀</button>
                            <button onClick={() => handleMoveColumn(index, 'right')} className="text-blue-600 hover:bg-slate-200 p-1 rounded">▶</button>
                            <button onClick={() => handleDeleteColumn(col.id)} className="text-red-500 hover:bg-slate-200 p-1 rounded">🗑️</button>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredProducts.map(product => {
                  const isOwnerOrAdmin = role === 'admin' || product.created_by === userId;
                  return (
                    <tr key={product.id} className="hover:bg-blue-50/50 transition-colors group/prod">
                      
                      {/* Cột Tên SP bấm vào để mở bảng to */}
                      <td className="p-4 border-r bg-slate-50/50 w-[250px]">
                        <div className="flex justify-between items-center">
                          <button onClick={() => openProductModal(product)} className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline text-left truncate w-full">
                            {product.name}
                          </button>
                          {isOwnerOrAdmin && (
                            <button onClick={() => handleDeleteProduct(product)} className="text-red-300 hover:text-red-600 opacity-0 group-hover/prod:opacity-100 transition-all text-xs ml-2 flex-shrink-0" title="Xóa SP này">
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                      
                      {/* Dữ liệu hiển thị thu gọn, không cho nhập ở đây nữa để giữ form bảng */}
                      {columns.map(col => (
                        <td key={col.id} className="p-3 border-r w-[200px]">
                          <div className="truncate text-sm text-slate-500 w-[180px]">
                            {product.data?.[col.name] || "-"}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={100} className="p-8 text-center text-slate-400 italic">Không tìm thấy sản phẩm nào!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL BẢNG TO CHI TIẾT SẢN PHẨM */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-full">
              
              {/* Header Modal */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-extrabold text-blue-700">📦 {selectedProduct.name}</h2>
                  {!canEditSelected && (
                    <p className="text-xs text-red-500 font-bold mt-1">⚠️ Bạn đang ở chế độ Chỉ Xem (Sản phẩm này do người khác tạo).</p>
                  )}
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-red-500 text-3xl leading-none">&times;</button>
              </div>
              
              {/* Nội dung Form (Chia làm 2 cột cho thoáng) */}
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                {columns.map(col => (
                  <div key={col.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">{col.name}</label>
                    <textarea 
                      value={editData[col.name] || ""}
                      onChange={e => setEditData({...editData, [col.name]: e.target.value})}
                      disabled={!canEditSelected}
                      placeholder={canEditSelected ? "Nhập thông số..." : "Trống"}
                      className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[100px] text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 transition-all"
                    />
                  </div>
                ))}
              </div>
              
              {/* Footer Modal */}
              <div className="p-6 border-t border-slate-100 flex justify-end gap-4 rounded-b-2xl bg-white">
                <button onClick={() => setSelectedProduct(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Đóng bảng</button>
                {canEditSelected && (
                  <button onClick={saveProductData} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/30 disabled:bg-slate-400">
                    {isSaving ? "Đang lưu..." : "💾 Lưu Dữ Liệu"}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}