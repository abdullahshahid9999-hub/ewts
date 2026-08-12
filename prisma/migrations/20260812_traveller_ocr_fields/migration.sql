-- Traveller OCR fields
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS traveller_type TEXT NOT NULL DEFAULT 'adult';
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS given_name TEXT;
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS surname TEXT;
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS date_of_issue TIMESTAMPTZ;
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS date_of_expiry TIMESTAMPTZ;
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMPTZ;
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS issuing_country TEXT;
ALTER TABLE travellers ADD COLUMN IF NOT EXISTS passport_image_url TEXT;

-- Package room type child rates
ALTER TABLE package_room_types ADD COLUMN IF NOT EXISTS price_per_child_with_bed_pkr INT NOT NULL DEFAULT 0;
ALTER TABLE package_room_types ADD COLUMN IF NOT EXISTS price_per_child_without_bed_pkr INT NOT NULL DEFAULT 0;

-- Booking child split
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS children_with_bed INT NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS children_without_bed INT NOT NULL DEFAULT 0;
