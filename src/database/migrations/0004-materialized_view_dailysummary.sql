CREATE MATERIALIZED VIEW dailysummaries
AS
  SELECT
    attack_day,
    SUM(active_warning)::INT4 AS active_warning,
    SUM(announcement)::INT4 AS announcement,
    SUM(fake_document)::INT4 AS fake_document,
    SUM(fake_email)::INT4 AS fake_email,
    SUM(fake_president_call)::INT4 AS fake_president_call,
    SUM(falsified_invoice)::INT4 AS falsified_invoice
  FROM dailyevents
  GROUP BY attack_day
  ORDER BY attack_day ASC
WITH DATA;
COMMENT ON MATERIALIZED VIEW dailysummaries IS
'Summary of fraud events by day.';
COMMENT ON COLUMN dailysummaries.attack_day IS
'Day on which attack types occured in milliseconds since epoch.';
COMMENT ON COLUMN dailysummaries.active_warning IS
'Number of active warning frauds committed on this day.';
COMMENT ON COLUMN dailysummaries.announcement IS
'Number of announcement frauds committed on this day.';
COMMENT ON COLUMN dailysummaries.fake_document IS
'Number of frauds using fake documents committed on this day.';
COMMENT ON COLUMN dailysummaries.fake_email IS
'Number of frauds using a fake email committed on this day.';
COMMENT ON COLUMN dailysummaries.fake_president_call IS
'Number of frauds by fake caller credentials committed on this day.';
COMMENT ON COLUMN dailysummaries.falsified_invoice IS
'Number of frauds using a fake invoice committed on this day.';

CREATE UNIQUE INDEX dailysummaries_attack_day_asc ON dailysummaries (attack_day ASC);
COMMENT ON INDEX dailysummaries_attack_day_asc IS
'B-Tree index on attack_day (ascending) for fast LIMIT + ORDER BY on attack_day.';

CREATE FUNCTION dailysummaries_between(earliest INT8, latest INT8)
RETURNS TABLE(
  active_warning INT4,
  announcement INT4,
  fake_document INT4,
  fake_email INT4,
  fake_president_call INT4,
  falsified_invoice INT4
)
AS $$
BEGIN
  RETURN QUERY
    SELECT
      SUM(dailysummaries.active_warning)::INT4,
      SUM(dailysummaries.announcement)::INT4,
      SUM(dailysummaries.fake_document)::INT4,
      SUM(dailysummaries.fake_email)::INT4,
      SUM(dailysummaries.fake_president_call)::INT4,
      SUM(dailysummaries.falsified_invoice)::INT4
    FROM dailysummaries
    WHERE dailysummaries.attack_day >= $1
    AND dailysummaries.attack_day <= $2;
END;
$$ LANGUAGE plpgsql;

