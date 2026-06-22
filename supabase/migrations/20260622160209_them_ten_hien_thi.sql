-- Thêm cột tên hiển thị vào bảng profiles (nếu chưa có)
alter table public.profiles add column if not exists display_name text;