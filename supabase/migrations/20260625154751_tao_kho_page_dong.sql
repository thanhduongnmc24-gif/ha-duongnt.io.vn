-- Bảng lưu trữ các trang do Admin tự chế
create table if not exists public.custom_pages (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  blocks jsonb default '[]'::jsonb, -- Chứa ruột gan thiết kế của trang (text, heading...)
  created_at timestamp with time zone default now()
);

-- Tắt khiên bảo vệ RLS để admin tạo cho thoải mái
alter table public.custom_pages disable row level security;