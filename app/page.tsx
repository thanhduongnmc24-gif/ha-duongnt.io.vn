import DashboardLayout from "../components/DashboardLayout";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in font-sans">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800">Tổng quan Hệ thống</h2>
          <p className="text-slate-500 mt-2">Theo dõi và giám sát toàn bộ hoạt động theo thời gian thực.</p>
        </div>
        {/* Nơi đây sau này anh hai thích gắn thêm biểu đồ gì cũng được */}
      </div>
    </DashboardLayout>
  );
}