-- Thêm cột created_by vào bảng products để biết ai là người tạo
alter table public.products add column if not exists created_by uuid;