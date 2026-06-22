import DashboardLayout from "../../../components/DashboardLayout";

export default function DangChoPage() {
  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full font-sans">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">⏳ Hàng đợi (Đang chờ)</h2>
        <p className="text-slate-500">Trang này đang được giữ chỗ, chờ anh hai cấp lệnh thi công tiếp theo!</p>
      </div>
    </DashboardLayout>
  );
}