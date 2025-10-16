-- Payments tracking for Mercado Pago reconciliation
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  preference_id text,
  mp_payment_id text unique,
  status text,
  transaction_amount numeric,
  currency text,
  payer_email text,
  collector_id text,
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payments_store_id_idx on public.payments(store_id);
create index if not exists payments_mp_payment_id_idx on public.payments(mp_payment_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists trg_touch_payments on public.payments;
create trigger trg_touch_payments before update on public.payments
for each row execute function public.touch_updated_at(); 