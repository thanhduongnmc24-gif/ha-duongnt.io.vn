"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import { supabase } from "../../../lib/supabase";

export default function SanPhamPage() {
  const [columns, setColumns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [role, setRole] = useState("user");
  const [userId, setUserId] = useState("");
  
  const [newColName, setNewColName] = useState("");
  const [newProductName, setNewProductName] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [firstColWidth, setFirstColWidth] = useState(250);
  const [editingCell, setEditingCell] = useState<{id: string, col: string} | null>(null);

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
    // Kéo cùng lúc 3 kho: Cột, Sản phẩm, và Cài đặt chung
    const [colsRes, prodsRes, settingsRes] = await Promise.all([
      supabase.from('product_columns').select('*').order('order_index', { ascending: true }),
      supabase.from('products').select('*').order('name', { ascending: true }),
      supabase.from('app_settings').select('*')
    ]);
    if (colsRes.data) setColumns(colsRes.data);
    if (prodsRes.data) setProducts(prodsRes.data);
    if (settingsRes.data) {
      const widthSetting = settingsRes.data.find(s => s.key === 'firstColWidth');
      if (widthSetting) setFirstColWidth(Number(widthSetting.value));
    }
  };

  const handleFirstColResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = firstColWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(150, startWidth + (moveEvent.clientX - startX));
      setFirstColWidth(newWidth); 
    };

    const handleMouseUp = async (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      const finalWidth = Math.max(150, startWidth + (upEvent.clientX - startX));
      setFirstColWidth(finalWidth);
      
      // Bắn thông số độ rộng lên Supabase để User khác cũng thấy được
      await supabase.from('app_settings').upsert({ key: 'firstColWidth', value: finalWidth.toString() });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleAddColumn = async () => {
    if (!newColName) return;
    const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order_index)) : 0;
    await supabase.from('product_columns').insert({ name: newColName, order_index: maxOrder + 1, width: '200px' });
    setNewColName("");
    fetchData();
  };

  const handleEditColumnName = async (col: any) => {
    const newName = prompt("✏️ Nhập tên mới cho cột này:", col.name);
    if (newName && newName.trim() !== "" && newName !== col.name) {
      await supabase.from('product_columns').update({ name: newName.trim() }).eq('id', col.id);
      fetchData();
    }
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

  const handleResizeStart = (e: React.MouseEvent, colId: string, currentWidth: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = parseInt(currentWidth.replace('px', '')) || 200;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(100, startWidth + (moveEvent.clientX - startX));
      setColumns(prev => prev.map(c => c.id === colId ? { ...c, width: `${newWidth}px` } : c));
    };

    const handleMouseUp = async (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      const finalWidth = Math.max(100, startWidth + (upEvent.clientX - startX));
      await supabase.from('product_columns').update({ width: `${finalWidth}px` }).eq('id', colId);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleAddProduct = async () => {
    if (!newProductName) return;
    await supabase.from('products').insert({ name: newProductName, data: {}, created_by: userId });
    setNewProductName("");
    fetchData();
  };

  const handleDeleteProduct = async (product: any) => {
    if (role !== 'admin' && product.created_by !== userId) {
      return alert("❌ Anh hai không có quyền xóa sản phẩm do người khác tạo!");
    }
    if (!confirm(`⚠️ Chắc chắn xóa sản phẩm [ ${product.name} ]?`)) return;
    await supabase.from('products').delete().eq('id', product.id);
    fetchData();
  };

  const handleCellBlur = async (product: any, colName: string, value: string) => {
    if (role !== 'admin' && product.created_by !== userId) return;
    if (product.data?.[colName] === value) return;

    const newData = { ...product.data, [colName]: value };
    await supabase.from('products').update({ data: newData }).eq('id', product.id);
    setProducts(products.map(p => p.id === product.id ? { ...p, data: newData } : p));
  };

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setEditData(product.data || {});
  };

  const saveProductData = async () => {
    setIsSaving(true);
    await supabase.from('products').update({ data: editData }).eq('id', selectedProduct.id);
    setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, data: editData } : p));
    setIsSaving(false);
    setSelectedProduct(null); 
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const canEditSelected = selectedProduct && (role === 'admin' || selectedProduct.created_by === userId);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-full mx-auto w-full font-sans relative">
        
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
            <table className="w-max min-w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b text-slate-600 text-sm">
                <tr>
                  <th style={{ width: `${firstColWidth}px`, minWidth: `${firstColWidth}px` }} className="p-4 font-extrabold border-r relative select-none">
                    <div className="flex justify-between items-center overflow-hidden">
                      <span className="truncate">Sản phẩm</span>
                    </div>
                    {role === 'admin' && (
                      <div 
                        onMouseDown={handleFirstColResizeStart}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/50 z-10"
                        title="Kéo để chỉnh độ rộng"
                      />
                    )}
                  </th>
                  
                  {columns.map((col, index) => (
                    <th key={col.id} style={{ width: col.width || '200px', minWidth: col.width || '200px' }} className="p-4 font-bold border-r group relative select-none">
                      <div className="flex justify-between items-center overflow-hidden">
                        <span className="truncate">{col.name}</span>
                        {role === 'admin' && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/90 px-1 rounded absolute mt-8 shadow border z-20">
                            <button onClick={() => handleEditColumnName(col)} className="text-amber-500 hover:bg-slate-200 p-1 rounded" title="Sửa tên cột">✏️</button>
                            <button onClick={() => handleMoveColumn(index, 'left')} className="text-blue-600 hover:bg-slate-200 p-1 rounded" title="Dịch trái">◀</button>
                            <button onClick={() => handleMoveColumn(index, 'right')} className="text-blue-600 hover:bg-slate-200 p-1 rounded" title="Dịch phải">▶</button>
                            <button onClick={() => handleDeleteColumn(col.id)} className="text-red-500 hover:bg-slate-200 p-1 rounded" title="Xóa cột">🗑️</button>
                          </div>
                        )}
                      </div>
                      
                      {role === 'admin' && (
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, col.id, col.width || '200px')}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/50 z-10"
                          title="Kéo để chỉnh độ rộng"
                        />
                      )}
                    </th>
                  ))}
                  <th className="w-full bg-transparent"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredProducts.map(product => {
                  const isOwnerOrAdmin = role === 'admin' || product.created_by === userId;
                  return (
                    <tr key={product.id} className="hover:bg-blue-50/50 transition-colors group/prod">
                      
                      <td style={{ width: `${firstColWidth}px`, minWidth: `${firstColWidth}px` }} className="p-4 border-r bg-slate-50/50 align-top">
                        <div className="flex justify-between items-start">
                          <button onClick={() => openProductModal(product)} className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline text-left w-full break-words" title="Bấm để mở bảng chi tiết">
                            {product.name}
                          </button>
                          {isOwnerOrAdmin && (
                            <button onClick={() => handleDeleteProduct(product)} className="text-red-300 hover:text-red-600 opacity-0 group-hover/prod:opacity-100 transition-all text-xs ml-2 flex-shrink-0 mt-1" title="Xóa SP này">
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                      
                      {columns.map(col => {
                        const cellValue = product.data?.[col.name] || "";
                        const isEditing = editingCell?.id === product.id && editingCell?.col === col.name;

                        return (
                          <td key={col.id} style={{ width: col.width || '200px', minWidth: col.width || '200px' }} className="p-2 border-r align-top relative">
                            {isEditing ? (
                              <textarea 
                                autoFocus
                                defaultValue={cellValue} 
                                onFocus={(e) => {
                                  const val = e.target.value;
                                  e.target.value = '';
                                  e.target.value = val;
                                }}
                                onBlur={(e) => {
                                  handleCellBlur(product, col.name, e.target.value);
                                  setEditingCell(null);
                                }}
                                className="w-full p-2 bg-white border border-blue-400 rounded outline-none shadow-md resize-none text-sm transition-all z-10"
                                rows={Math.min(5, Math.max(2, cellValue.split('\n').length))}
                              />
                            ) : (
                              <div
                                onClick={() => { if(isOwnerOrAdmin) setEditingCell({id: product.id, col: col.name}) }}
                                className={`w-full p-2 min-h-[40px] rounded text-sm whitespace-pre-line break-words line-clamp-4 ${isOwnerOrAdmin ? 'cursor-text hover:bg-white/60' : 'text-slate-500 cursor-not-allowed'}`}
                                title={isOwnerOrAdmin ? "Nhấp chuột vào để nhập/sửa trực tiếp" : ""}
                              >
                                {cellValue || (isOwnerOrAdmin ? "..." : "-")}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="w-full bg-transparent"></td>
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
              
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-extrabold text-blue-700">📦 {selectedProduct.name}</h2>
                  {!canEditSelected && (
                    <p className="text-xs text-red-500 font-bold mt-1">⚠️ Bạn đang ở chế độ Chỉ Xem (Sản phẩm này do người khác tạo).</p>
                  )}
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-red-500 text-3xl leading-none">&times;</button>
              </div>
              
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