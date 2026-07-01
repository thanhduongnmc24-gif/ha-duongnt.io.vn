"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";
import { supabase } from "../../../lib/supabase";

// --- LÕI BÓC TÁCH DRIVE CHO NGƯỜI DÙNG XEM ---
const DriveFolderViewer = ({ url }: { url: string }) => {
  const [data, setData] = useState<{ readme: string, files: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!url || url.trim() === "") return;
    
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
          setErrorMsg(`❌ Không truy cập được thư mục Drive! Vui lòng báo cho Admin kiểm tra lại ID tài liệu. (${err.message})`);
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
          ⏳ Hệ thống đang quét tài liệu từ Google Drive...
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

export default function DynamicPage() {
  const params = useParams();
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
                className={`${block.width || 'col-span-12'} ${block.bgColor || 'bg-white'} p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md`}
              >
                <div className="w-full">
                  {block.title && block.title.trim() !== "" && (
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 mb-3 border-b pb-2 border-slate-100 inline-block">
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
                  <div className="mt-5 w-full border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 shadow-inner">
                    <img 
                      src={block.imageUrl} 
                      alt="Hình ảnh đính kèm" 
                      className="w-full max-h-[500px] object-contain rounded-xl transition-transform duration-500 hover:scale-[1.01]" 
                      onError={(e)=>{(e.target as HTMLElement).style.display='none'}}
                    />
                  </div>
                )}

                {block.driveUrl && <DriveFolderViewer url={block.driveUrl} />}
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