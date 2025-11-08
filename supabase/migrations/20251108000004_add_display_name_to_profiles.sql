-- Add display_name field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create function to auto-populate display_name from auth.users metadata on profile creation
CREATE OR REPLACE FUNCTION populate_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If display_name is not set, try to get it from auth.users metadata
  IF NEW.display_name IS NULL THEN
    SELECT
      COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        INITCAP(SPLIT_PART(email, '@', 1))
      )
    INTO NEW.display_name
    FROM auth.users
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to populate display_name on insert
DROP TRIGGER IF EXISTS trigger_populate_display_name ON profiles;
CREATE TRIGGER trigger_populate_display_name
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION populate_display_name();

-- Backfill existing profiles with display_name
UPDATE profiles
SET display_name = COALESCE(
  (SELECT COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    INITCAP(SPLIT_PART(email, '@', 1))
  )
  FROM auth.users
  WHERE auth.users.id = profiles.id),
  'Anonymous'
)
WHERE display_name IS NULL;
