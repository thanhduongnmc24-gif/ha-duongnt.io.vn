"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";
import { supabase } from "../../../lib/supabase";

export default function DynamicPage() {
  const params = useParams();
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // ĐÃ THÊM: State và Hàm tìm kiếm ngoài trang cho User
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPageContent();
  }, [params.slug]);

  const fetchPageContent = async () => {
    setLoading(true);
    const { data } = await supabase.from("custom_pages").select("*").eq("slug", params.slug).single();
    if (data) setPageData(data);
    setLoading(false);
  };

  const handleSearchBlock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!searchQuery.trim() || !pageData?.blocks) return;
      const query = searchQuery.toLowerCase();
      
      const foundIndex = pageData.blocks.findIndex((b: any) => (b.title || "").toLowerCase().includes(query));
      
      if (foundIndex !== -1) {
        const blockId = pageData.blocks[foundIndex].id || `block-${foundIndex}`;
        const el = document.getElementById(blockId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-blue-500", "shadow-2xl", "scale-[1.01]");
          setTimeout(() => {
            el.classList.remove("ring-4", "ring-blue-500", "shadow-2xl", "scale-[1.01]");
          }, 2000);
        }
      } else {
        alert(`🔍 Không tìm thấy đoạn nào có tiêu đề chứa chữ "${searchQuery}"!`);
      }
    }
  };

  if (loading) return <DashboardLayout><div className="p-10 font-bold animate-pulse text-blue-600">⏳ Đang tải cấu trúc trang...</div></DashboardLayout>;
  if (!pageData) return <DashboardLayout><div className="p-10 text-red-500 italic font-bold">❌ Không tìm thấy trang này hoặc đã bị xóa!</div></DashboardLayout>;

  const blocks = pageData.blocks || [];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full font-sans animate-fade-in relative">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-6 pb-4 border-b border-slate-200">{pageData.title}</h1>
        
        {/* THANH TÌM KIẾM TỐC ĐỘ CAO */}
        {blocks.length > 0 && (
          <div className="mb-8 relative max-w-lg">
            <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Gõ tên tiêu đề mục & ấn Enter để nhảy tới nhanh..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchBlock}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-slate-700 shadow-sm"
            />
          </div>
        )}
        
        <div className="grid grid-cols-12 gap-5">
          {blocks.map((block: any, index: number) => {
            return (
              <div 
                id={block.id || `block-${index}`} 
                key={block.id || index} 
                className={`${block.width || 'col-span-12'} ${block.bgColor || 'bg-white'} p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md`}
              >
                <div className="w-full">
                  {block.title && block.title.trim() !== "" && (
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 mb-2 border-b pb-1.5 border-slate-100">
                      {block.title}
                    </h4>
                  )}

                  {block.type === "heading" ? (
                    <h3 className={`font-extrabold leading-tight ${block.textColor || 'text-slate-800'} ${block.textSize || 'text-xl'}`}>
                      {block.content}
                    </h3>
                  ) : (
                    <p className={`leading-relaxed whitespace-pre-wrap ${block.textColor || 'text-slate-600'} ${block.textSize || 'text-sm'}`}>
                      {block.content}
                    </p>
                  )}
                </div>

                {block.imageUrl && block.imageUrl.trim() !== "" && (
                  <div className="mt-4 w-full border border-slate-100 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img 
                      src={block.imageUrl} 
                      alt="Hình ảnh đính kèm" 
                      className="w-full max-h-[400px] object-cover rounded-xl transition-transform duration-300 hover:scale-[1.02]" 
                      onError={(e)=>{(e.target as HTMLElement).style.display='none'}}
                    />
                  </div>
                )}
              </div>
            );
          })}
          
          {blocks.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400 italic bg-white rounded-2xl border border-dashed">
              Trang này chưa được thiết kế ruột gan gì cả, anh hai vào Quản trị bổ sung nhé!
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}