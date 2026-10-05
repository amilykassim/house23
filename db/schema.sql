-- Velstays schema (Neon Postgres). Safe to run again: every statement is
-- "if not exists". Applied by `pnpm db:setup` and before every `pnpm db:import`.

CREATE TABLE IF NOT EXISTS bookings (
    id                  text PRIMARY KEY, -- "BK-001"
    house               text NOT NULL,
    house_name          text NOT NULL,
    guest_name          text NOT NULL,
    guest_email         text NOT NULL DEFAULT '',
    guest_phone         text NOT NULL DEFAULT '',
    check_in            date NOT NULL,
    check_out           date NOT NULL,
    nights              integer NOT NULL DEFAULT 0,
    -- nights of the stay given for free (by-hand bookings); part of `nights`
    free_nights         integer NOT NULL DEFAULT 0,
    guests              integer NOT NULL DEFAULT 1,
    price_per_night     double precision NOT NULL DEFAULT 0,
    cleaning_fee        double precision NOT NULL DEFAULT 0,
    service_fee         double precision NOT NULL DEFAULT 0,
    total               double precision NOT NULL DEFAULT 0,
    total_rwf           double precision NOT NULL DEFAULT 0,
    momo_transaction_id text NOT NULL DEFAULT '',
    special_requests    text NOT NULL DEFAULT '',
    status              text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    -- 'manual' = recorded by hand in the admin panel; null on website bookings
    source              text CHECK (source IN ('website', 'manual')),
    created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS free_nights integer NOT NULL DEFAULT 0;

-- Numbers for booking ids, so two bookings made at once never share one
CREATE SEQUENCE IF NOT EXISTS booking_number_seq;

-- One row per unavailable night: admin blocks and confirmed bookings alike
CREATE TABLE IF NOT EXISTS blocked_dates (
    house text NOT NULL,
    date  date NOT NULL,
    PRIMARY KEY (house, date)
);

CREATE TABLE IF NOT EXISTS guide_access (
    code       text PRIMARY KEY, -- last 4 digits of the guest's phone
    label      text NOT NULL DEFAULT '',
    source     text NOT NULL CHECK (source IN ('manual', 'booking')),
    booking_id text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
    id         text PRIMARY KEY,
    house      text NOT NULL, -- house slug or 'all'
    category   text NOT NULL,
    amount_rwf integer NOT NULL,
    date       date NOT NULL,
    note       text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Per-house config documents. key is one of:
-- 'prices', 'photo-order', 'photo-categories', 'calendar-config', 'feed-reads'
CREATE TABLE IF NOT EXISTS house_settings (
    key   text NOT NULL,
    house text NOT NULL,
    value jsonb NOT NULL,
    PRIMARY KEY (key, house)
);
