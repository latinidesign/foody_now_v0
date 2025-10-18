-- Payments tracking with provider abstraction (Mercado Pago + future methods)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_payment_id text,
  preference_id text,
  mp_payment_id text,
  payment_method text,
  status text,
  status_detail text,
  transaction_amount numeric,
  currency text,
  payer_email text,
  collector_id text,
  source_type text,
  metadata jsonb,
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payments_store_id_idx on public.payments(store_id);
create index if not exists payments_provider_idx on public.payments(provider);
create unique index if not exists payments_provider_payment_id_unique
  on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;
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
