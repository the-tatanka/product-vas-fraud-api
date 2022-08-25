CREATE MATERIALIZED VIEW dailyevents
AS
  SELECT
    ((attack_date / 86400000) * 86400000) AS attack_day,
    country_code,
    SUM((fraudtype = 'ACTIVE_WARNING')::INT4)::INT4 AS active_warning,
    SUM((fraudtype = 'ANNOUNCEMENT')::INT4)::INT4 AS announcement,
    SUM((fraudtype = 'FAKE_DOCUMENT')::INT4)::INT4 AS fake_document,
    SUM((fraudtype = 'FAKE_EMAIL')::INT4)::INT4 AS fake_email,
    SUM((fraudtype = 'FAKE_PRESIDENT_CALL')::INT4)::INT4 AS fake_president_call,
    SUM((fraudtype = 'FALSIFIED_INVOICE')::INT4)::INT4 AS falsified_invoice
  FROM fraudevents
  GROUP BY (attack_day, country_code)
  ORDER BY attack_day ASC
WITH DATA;
COMMENT ON MATERIALIZED VIEW dailyevents IS
'Summary of fraud events by day and country.';
COMMENT ON COLUMN dailyevents.attack_day IS
'Day on which attack types occured in milliseconds since epoch.';
COMMENT ON COLUMN dailyevents.country_code IS
'The iso-3166-1 country code specifying the country of this fraud type summary.';
COMMENT ON COLUMN dailyevents.active_warning IS
'Number of active warning frauds committed on this day in this country.';
COMMENT ON COLUMN dailyevents.announcement IS
'Number of announcement frauds committed on this day in this country.';
COMMENT ON COLUMN dailyevents.fake_document IS
'Number of frauds using fake documents committed on this day in this country.';
COMMENT ON COLUMN dailyevents.fake_email IS
'Number of frauds using a fake email committed on this day in this country.';
COMMENT ON COLUMN dailyevents.fake_president_call IS
'Number of frauds by fake caller credentials committed on this day in this country.';
COMMENT ON COLUMN dailyevents.falsified_invoice IS
'Number of frauds using a fake invoice committed on this day in this country.';

CREATE UNIQUE INDEX dailyevents_unique_attack_day_country_code ON dailyevents (attack_day, country_code);
COMMENT ON INDEX dailyevents_unique_attack_day_country_code IS
'The summary is unique for each day and country.';

CREATE INDEX dailyevents_attack_day_asc ON dailyevents (attack_day ASC);
COMMENT ON INDEX dailyevents_attack_day_asc IS
'B-Tree index on attack_day (ascending) for fast LIMIT + ORDER BY on attack_day.';

CREATE FUNCTION dailyevents_between(earliest INT8, latest INT8, countries TEXT DEFAULT '')
RETURNS TABLE(
  country_code CHARACTER(2),
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
    dailyevents.country_code,
      SUM(dailyevents.active_warning)::INT4,
      SUM(dailyevents.announcement)::INT4,
      SUM(dailyevents.fake_document)::INT4,
      SUM(dailyevents.fake_email)::INT4,
      SUM(dailyevents.fake_president_call)::INT4,
      SUM(dailyevents.falsified_invoice)::INT4
    FROM dailyevents
    WHERE dailyevents.attack_day >= $1
      AND dailyevents.attack_day <= $2
      AND CASE WHEN $3 <> ''
          THEN dailyevents.country_code = any(string_to_array($3, ','))
          ELSE true
          END
    GROUP BY dailyevents.country_code;
END;
$$ LANGUAGE plpgsql;
