"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";
import { supabase } from "../../../lib/supabase";

export default function DynamicPage() {
  const params = useParams();
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent();
  }, [params.slug]);

  const fetchPageContent = async () => {
    setLoading(true);
    const { data } = await supabase.from("custom_pages").select("*").eq("slug", params.slug).single();
    if (data) setPageData(data);
    setLoading(false);
  };

  if (loading) return <DashboardLayout><div className="p-10 font-bold animate-pulse text-blue-600">⏳ Đang tải trang thiết kế...</div></DashboardLayout>;
  if (!pageData) return <DashboardLayout><div className="p-10 text-red-500 italic font-bold">❌ Không tìm thấy trang này hoặc đã bị xóa!</div></DashboardLayout>;

  const blocks = pageData.blocks || [];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-4xl mx-auto w-full font-sans animate-fade-in">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-8 pb-4 border-b border-slate-200">{pageData.title}</h1>
        
        {/* VẼ RUỘT GAN TỰ THIẾT KẾ CỦA PAGE */}
        <div className="space-y-6">
          {blocks.map((block: any, index: number) => {
            if (block.type === "heading") {
              return <h3 key={index} className="text-xl font-bold text-slate-800 mt-6 border-l-4 border-blue-500 pl-3">{block.content}</h3>;
            }
            if (block.type === "text") {
              return <p key={index} className="text-slate-600 leading-relaxed bg-white p-4 rounded-xl border shadow-sm whitespace-pre-wrap">{block.content}</p>;
            }
            return null;
          })}
          
          {blocks.length === 0 && (
            <div className="text-center py-12 text-slate-400 italic bg-white rounded-2xl border border-dashed">
              Trang này chưa được thiết kế ruột gan gì cả, anh hai vào Quản trị bổ sung nhé!
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}