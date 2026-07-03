-- EAST & WEST TRAVEL — initial schema (run once in TablePlus SQL editor)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  duration TEXT, price TEXT, price_note TEXT, destination TEXT,
  dep_date TEXT, ret_date TEXT, airline TEXT, route TEXT,
  hotels TEXT, includes TEXT, excludes TEXT, image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_no TEXT, airline TEXT NOT NULL, airline_code TEXT, route TEXT NOT NULL,
  dep_date TEXT, arr_date TEXT, dep_time TEXT, baggage TEXT, meal TEXT,
  price TEXT NOT NULL, airline_logo_url TEXT, seats INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE visa_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, country TEXT NOT NULL, type TEXT NOT NULL,
  price TEXT, days TEXT, validity TEXT, max_stay TEXT, processing_time TEXT,
  requirements TEXT, country_flag TEXT, country_image TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE insurance_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, logo_url TEXT, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE insurance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE insurance_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES insurance_plans(id) ON DELETE CASCADE,
  price_pkr INT NOT NULL, coverage_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, category TEXT,
  cover_image TEXT, excerpt TEXT, content TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT NOT NULL UNIQUE, customer_name TEXT, service TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE travellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL, passport_no TEXT, cnic TEXT
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_code TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE, phone TEXT, password_hash TEXT NOT NULL,
  balance INT NOT NULL DEFAULT 0, credit_limit INT NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'standard', status TEXT NOT NULL DEFAULT 'active',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  service_type TEXT NOT NULL,
  group_flight_id UUID REFERENCES group_flights(id),
  status TEXT NOT NULL DEFAULT 'pending',
  sell_price INT NOT NULL, commission INT NOT NULL DEFAULT 0,
  booking_ref TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ, issue_requested_at TIMESTAMPTZ, issue_requested_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  amount INT NOT NULL, type TEXT NOT NULL, note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  otp_code TEXT NOT NULL, purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, used BOOLEAN NOT NULL DEFAULT false,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  amount INT NOT NULL, slip_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
