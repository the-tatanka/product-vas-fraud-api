CREATE FUNCTION trigger_updated_at_now()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now()::timestamptz;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION trigger_updated_at_now IS
'A trigger function to set the updated_at column to now()::timestamptz.';
