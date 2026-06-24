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

  // ----- CÔNG CỤ DỊCH THỜI GIAN CHUẨN VIỆT NAM -----
  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${hh}:${mm} ngày ${dd}/${mo}/${yyyy}`;
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
    if (!confirm("⚠️ Chắc chắn xóa cột thông số này? Toàn bộ dữ liệu của cột này sẽ bị ẩn đi.")) return;
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

  // ----- QUẢN LÝ SẢN PHẨM & SAO CHÉP -----
  const handleAddProduct = async () => {
    if (!newProductName) return;
    await supabase.from('products').insert({ 
      name: newProductName, 
      data: {}, 
      created_by: userId,
      updated_at: new Date().toISOString()
    });
    setNewProductName("");
    fetchData();
  };

  // NÚT SAO CHÉP: Gọi bảng Modal lên với mã ID giả, chờ xác nhận mới lưu
  const handleCopyProduct = (product: any) => {
    setSelectedProduct({ 
      id: 'NEW_COPY', 
      name: product.name, 
      created_by: userId 
    });
    setEditData(product.data || {});
  };

  const handleEditProductName = async (product: any) => {
    const newName = prompt("✏️ Nhập tên mới cho sản phẩm này:", product.name);
    if (newName && newName.trim() !== "" && newName !== product.name) {
      // Nếu là sản phẩm đang copy chưa lưu, chỉ cập nhật biến tạm
      if (product.id === 'NEW_COPY') {
        setSelectedProduct({ ...selectedProduct, name: newName.trim() });
      } else {
        // Cập nhật tên và chốt luôn thời gian lưu mới nhất
        await supabase.from('products').update({ 
          name: newName.trim(),
          updated_at: new Date().toISOString()
        }).eq('id', product.id);
        fetchData();
        if (selectedProduct && selectedProduct.id === product.id) {
          setSelectedProduct({ ...selectedProduct, name: newName.trim() });
        }
      }
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (role !== 'admin' && product.created_by !== userId) {
      return alert("❌ Anh hai không có quyền xóa sản phẩm do người khác tạo!");
    }
    if (!confirm(`⚠️ Chắc chắn xóa sản phẩm [ ${product.name} ]?`)) return;
    await supabase.from('products').delete().eq('id', product.id);
    fetchData();
  };

  const handleCellBlur = async (product: any, colId: string, value: string) => {
    if (role !== 'admin' && product.created_by !== userId) return;
    if (product.data?.[colId] === value) return;

    const newData = { ...product.data, [colId]: value };
    // Lưu dữ liệu và cập nhật luôn đồng hồ
    await supabase.from('products').update({ 
      data: newData,
      updated_at: new Date().toISOString()
    }).eq('id', product.id);
    
    fetchData(); // Tải lại để cập nhật dòng thời gian
  };

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setEditData(product.data || {});
  };

  const saveProductData = async () => {
    setIsSaving(true);
    const now = new Date().toISOString();

    if (selectedProduct.id === 'NEW_COPY') {
      // Đang bấm lưu bản SAO CHÉP -> Tạo dòng mới
      await supabase.from('products').insert({
        name: selectedProduct.name,
        data: editData,
        created_by: userId,
        updated_at: now
      });
    } else {
      // Lưu sản phẩm có sẵn -> Update dòng cũ
      await supabase.from('products').update({ 
        data: editData,
        name: selectedProduct.name,
        updated_at: now 
      }).eq('id', selectedProduct.id);
    }
    
    fetchData(); 
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
                      <div className="flex items-center justify-between pr-4 w-full">
                        <span className="truncate block w-full">{col.name}</span>
                      </div>
                      
                      {role === 'admin' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-slate-50/95 pl-2 py-1 rounded shadow-sm z-20 items-center border border-slate-200">
                          <button onClick={() => handleEditColumnName(col)} className="text-amber-500 hover:bg-slate-200 p-1.5 rounded" title="Sửa tên cột">✏️</button>
                          <button onClick={() => handleMoveColumn(index, 'left')} className="text-blue-600 hover:bg-slate-200 p-1.5 rounded" title="Dịch trái">◀</button>
                          <button onClick={() => handleMoveColumn(index, 'right')} className="text-blue-600 hover:bg-slate-200 p-1.5 rounded" title="Dịch phải">▶</button>
                          <button onClick={() => handleDeleteColumn(col.id)} className="text-red-500 hover:text-red-700 hover:bg-slate-200 p-1.5 rounded transition-colors" title="Xóa cột">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                      
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
                      
                      <td style={{ width: `${firstColWidth}px`, minWidth: `${firstColWidth}px` }} className="p-4 border-r bg-slate-50/50 align-top relative">
                        <div className="flex flex-col justify-start w-full">
                          <button onClick={() => openProductModal(product)} className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline text-left w-full break-words pr-12" title="Bấm để mở bảng chi tiết">
                            {product.name}
                          </button>
                          
                          {/* ĐÃ THÊM: Thời gian lưu hiển thị phía dưới tên mác thép */}
                          {product.updated_at && (
                            <div className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                              <span>🕒</span> {formatTime(product.updated_at)}
                            </div>
                          )}
                        </div>

                        {/* ĐÃ THÊM: Nút COPY và các nút hành động đặt tuyệt đối để không làm xô lệch giao diện */}
                        <div className="absolute top-4 right-2 flex gap-1 opacity-0 group-hover/prod:opacity-100 transition-all bg-white/95 px-1 py-1 rounded shadow-sm border border-slate-200 z-10">
                          {/* Nút COPY ai cũng bấm được */}
                          <button onClick={() => handleCopyProduct(product)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded" title="Sao chép SP này">
                            📑
                          </button>
                          
                          {isOwnerOrAdmin && (
                            <>
                              <button onClick={() => handleEditProductName(product)} className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-1 rounded font-bold text-sm" title="Sửa tên sản phẩm">✏️</button>
                              <button onClick={() => handleDeleteProduct(product)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded" title="Xóa SP này">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      
                      {columns.map(col => {
                        const cellValue = product.data?.[col.id] || "";
                        const isEditing = editingCell?.id === product.id && editingCell?.col === col.id;

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
                                  handleCellBlur(product, col.id, e.target.value);
                                  setEditingCell(null);
                                }}
                                className="w-full p-2 bg-white border border-blue-400 rounded outline-none shadow-md resize-none text-sm transition-all z-10"
                                rows={Math.min(5, Math.max(2, cellValue.split('\n').length))}
                              />
                            ) : (
                              <div
                                onClick={() => { if(isOwnerOrAdmin) setEditingCell({id: product.id, col: col.id}) }}
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
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-blue-700">📦 {selectedProduct.name}</h2>
                    
                    {/* Báo hiệu đang copy bằng nhãn dán xanh mướt */}
                    {selectedProduct.id === 'NEW_COPY' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold text-xs rounded-full border border-green-200">
                        ✨ ĐANG SAO CHÉP
                      </span>
                    )}

                    {canEditSelected && (
                      <button 
                        onClick={() => handleEditProductName(selectedProduct)}
                        className="bg-white border border-slate-200 text-amber-500 px-3 py-1 rounded-lg text-xs font-bold shadow-sm hover:bg-amber-50 transition-all flex items-center gap-1"
                      >
                        ✏️ Đổi tên SP
                      </button>
                    )}
                  </div>
                  {!canEditSelected && (
                    <p className="text-xs text-red-500 font-bold mt-1">⚠️ Bạn đang ở chế độ Chỉ Xem (Sản phẩm này do người khác tạo).</p>
                  )}
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-red-500 text-3xl leading-none">&times;</button>
              </div>
              
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                {columns.map(col => {
                  const textValue = editData[col.id] || "";
                  const lineCount = textValue.split('\n').length;

                  return (
                    <div key={col.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">{col.name}</label>
                      <textarea 
                        value={textValue}
                        onChange={e => setEditData({...editData, [col.id]: e.target.value})}
                        disabled={!canEditSelected}
                        rows={Math.max(4, lineCount)}
                        placeholder={canEditSelected ? "Nhập thông số..." : "Trống"}
                        className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 transition-all resize-none"
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="p-6 border-t border-slate-100 flex justify-end gap-4 rounded-b-2xl bg-white">
                <button onClick={() => setSelectedProduct(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">
                  {selectedProduct.id === 'NEW_COPY' ? 'Hủy Sao Chép' : 'Đóng bảng'}
                </button>
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