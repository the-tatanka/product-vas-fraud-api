CREATE TYPE EFRAUDTYPE AS ENUM
('ACTIVE_WARNING'
,'ANNOUNCEMENT'
,'FAKE_DOCUMENT'
,'FAKE_EMAIL'
,'FAKE_PRESIDENT_CALL'
,'FALSIFIED_INVOICE'
);
COMMENT ON TYPE EFRAUDTYPE IS
'Enumeration of all discriminable types of fraud cases.';

CREATE TABLE fraudevents
( id SERIAL PRIMARY KEY
, cdl_id CHARACTER(10) NOT NULL UNIQUE
, attack_date INT8 NOT NULL
, country_code CHARACTER(2)
, fraudtype EFRAUDTYPE NOT NULL
, created_at TIMESTAMPTZ NOT NULL DEFAULT now()::TIMESTAMPTZ
, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()::TIMESTAMPTZ
);
COMMENT ON TABLE fraudevents IS
'List of fraud cases describing the date, location and type of fraud committed.';
COMMENT ON COLUMN fraudevents.id IS
'Primary key of table fraudevents.';
COMMENT ON COLUMN fraudevents.cdl_id IS
'Unique identifier of a fraud case in the CDQ API.';
COMMENT ON COLUMN fraudevents.attack_date IS
'Date when attack occurred in milliseconds since epoch.';
COMMENT ON COLUMN fraudevents.country_code IS
'The iso-3166-1 (alpha 2) country identifier where the fraud occurred.';
COMMENT ON COLUMN fraudevents.fraudtype IS
'The type of fraud committed, one of ACTIVE_WARNING,ANNOUNCEMENT,FAKE_DOCUMENT,FAKE_EMAIL,FAKE_PRESIDENT_CALL,FALSIFIED_INVOICE.';
COMMENT ON COLUMN fraudevents.created_at IS
'Row creation timestamp with timezone UTC.';
COMMENT ON COLUMN fraudevents.updated_at IS
'Row update timestamp with timezone UTC, updated internally by trigger function.';

CREATE INDEX fraudevents_attack_date_asc ON fraudevents (attack_date ASC);
COMMENT ON INDEX fraudevents_attack_date_asc IS
'B-Tree index on attack_date (ascending) for fast LIMIT + ORDER BY on attack_date.';

CREATE TRIGGER fraudevents_trigger_updated_at_now BEFORE UPDATE ON fraudevents
FOR EACH ROW
  EXECUTE PROCEDURE trigger_updated_at_now();
COMMENT ON TRIGGER fraudevents_trigger_updated_at_now ON fraudevents IS
'Set updated_at to now() before updating a row in fraudevents.';
