-- Tạo bảng quản lý các cột thông số (Nhiệt độ K1, Cơ tính...)
create table if not exists public.product_columns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  order_index integer default 0
);

-- Tạo bảng lưu tên sản phẩm (D22 CB400...) và dữ liệu các cột (dạng JSON)
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  data jsonb default '{}'::jsonb
);

-- Tắt khiên bảo vệ RLS để anh em thao tác từ giao diện web thoải mái
alter table public.product_columns disable row level security;
alter table public.products disable row level security;