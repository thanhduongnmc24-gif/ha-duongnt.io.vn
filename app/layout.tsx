import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata = {
  title: "HA-DUONGNT - Hệ thống quản lý xưởng cán",
  description: "Vận hành và quản trị nhân sự tối ưu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-50 min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}