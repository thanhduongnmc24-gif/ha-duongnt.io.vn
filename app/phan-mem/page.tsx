"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

// Chìa khóa và Tọa độ kho bí mật của anh hai
const API_KEY = 'AIzaSyB-WBOZfXXZgehcn-8TOXG-mlE7pxfqPk8';
const ROOT_FOLDER_ID = '132MsY7sPJpqZNGPAiO7LW7ilJm9OuQ8W';

export default function PhanMemPage() {
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);
  
  const [subFiles, setSubFiles] = useState<any[]>([]);
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRootFolders();
  }, []);

  const fetchRootFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${ROOT_FOLDER_ID}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&key=${API_KEY}`);
      const data = await res.json();
      if (data.files) setFolders(data.files);
    } catch (err) {
      console.error("Lỗi lấy thư mục:", err);
    }
    setLoading(false);
  };

  const handleSelectFolder = async (folder: any) => {
    setSelectedFolder(folder);
    setLoading(true);
    setReadmeContent("Đang tải nội dung hướng dẫn...");
    setSubFiles([]);

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webViewLink)&key=${API_KEY}`);
      const data = await res.json();
      
      if (data.files) {
        setSubFiles(data.files);
        
        const readmeFile = data.files.find((f: any) => f.name.toLowerCase() === 'readme.txt');
        
        if (readmeFile) {
          const txtRes = await fetch(`https://www.googleapis.com/drive/v3/files/${readmeFile.id}?alt=media&key=${API_KEY}`);
          if (txtRes.ok) {
            const text = await txtRes.text();
            setReadmeContent(text);
          } else {
            setReadmeContent("Không thể đọc được file (Có thể chưa bật quyền chia sẻ Bất kỳ ai có liên kết).");
          }
        } else {
          setReadmeContent("Không có hướng dẫn nào trong thư mục này.");
        }
      }
    } catch (err) {
      console.error(err);
      setReadmeContent("Lỗi đường truyền khi tải dữ liệu Google Drive.");
    }
    setLoading(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return '📁';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📘';
    if (mimeType.includes('text')) return '📄';
    return '📎';
  };

  // Lọc ra các file không phải là readme.txt
  const otherFiles = subFiles.filter(f => f.name.toLowerCase() !== 'readme.txt');

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full font-sans animate-fade-in">
        
        {/* Nút quay lại và Tiêu đề */}
        <div className="flex items-center gap-4 mb-8">
          {selectedFolder && (
            <button 
              onClick={() => setSelectedFolder(null)} 
              className="bg-slate-800 text-white hover:bg-slate-900 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-slate-900/20 flex items-center gap-2"
            >
              ◀ Quay lại
            </button>
          )}
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800">
              {selectedFolder ? selectedFolder.name : "Kho Ứng Dụng & Phần Mềm"}
            </h2>
          </div>
        </div>

        {loading && <div className="text-blue-500 font-bold animate-pulse text-lg mb-4">⏳ Đang móc nối với Google Drive...</div>}

        {/* TRẠNG THÁI 1: DANH SÁCH THƯ MỤC GỐC */}
        {!selectedFolder && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {folders.map(folder => (
              <div 
                key={folder.id} 
                onClick={() => handleSelectFolder(folder)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex flex-col items-center gap-4"
              >
                <div className="text-6xl group-hover:scale-110 transition-transform">🗂️</div>
                <h3 className="font-bold text-slate-800 text-center line-clamp-2">{folder.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold">Mở kho</span>
              </div>
            ))}
            {folders.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-400 italic bg-white rounded-2xl border border-dashed">
                Không tìm thấy thư mục phần mềm nào!
              </div>
            )}
          </div>
        )}

        {/* TRẠNG THÁI 2: CHI TIẾT THƯ MỤC (CHIA ĐÔI MÀN HÌNH) */}
        {selectedFolder && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cột trái: Nội dung Readme - Đã đổi màu nền và font chữ cực nét! */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-slate-50 border-b border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">📖 Hướng dẫn sử dụng</h3>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50 text-slate-800 font-sans text-base leading-relaxed whitespace-pre-wrap">
                {readmeContent}
              </div>
            </div>

            {/* Cột phải: Danh sách File/Folder */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[60vh]">
              <div className="bg-blue-50 border-b p-4">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">🔗 Thành phần bên trong</h3>
              </div>
              
              <div className="p-2 overflow-y-auto flex-1">
                {otherFiles.map(file => (
                  <a 
                    key={file.id} 
                    href={file.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                  >
                    <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">{file.name}</p>
                    </div>
                    <span className="text-slate-300 group-hover:text-blue-500">↗️</span>
                  </a>
                ))}
                
                {otherFiles.length === 0 && (
                  <p className="text-slate-400 text-sm italic text-center mt-6">Kho này trống trơn.</p>
                )}
              </div>

              {/* Nút Mở Thư Mục */}
              {otherFiles.length > 1 && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <a 
                    href={`https://drive.google.com/drive/folders/${selectedFolder.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-600/20"
                  >
                    📁 Mở Thư Mục Này
                  </a>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}