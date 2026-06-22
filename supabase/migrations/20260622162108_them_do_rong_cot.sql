-- Thêm cột width vào bảng product_columns, mặc định là 200px
alter table public.product_columns add column if not exists width text default '200px';