export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-gray-900">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-blue-600">
          Tổng hành dinh ha-duongnt.io.vn
        </h1>
        <p className="text-xl">
          Hệ thống đang được nâng cấp lên phiên bản siêu cấp!
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <span className="px-4 py-2 bg-white rounded-lg shadow font-medium">✨ Next.js</span>
          <span className="px-4 py-2 bg-white rounded-lg shadow font-medium">🛡️ TypeScript</span>
          <span className="px-4 py-2 bg-white rounded-lg shadow font-medium">🗄️ Supabase</span>
        </div>
      </div>
    </main>
  );
}