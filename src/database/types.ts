type Efraudtype = 'ACTIVE_WARNING' | 'ANNOUNCEMENT' | 'FAKE_DOCUMENT' | 'FAKE_EMAIL' | 'FAKE_PRESIDENT_CALL' | 'FALSIFIED_INVOICE';

/**
 * List of fraud cases describing the date, location and type of fraud committed.
 */
interface Fraudevents {
	/**
	 * Primary key of table fraudevents.
	 *
	 * @default nextval('fraudevents_id_seq'::regclass)
	 */
	id: number & {readonly __brand?: 'fraudevents_id'}
	/**
	 * Unique identifier of a fraud case in the CDQ API.
	 */
	cdl_id: string
	/**
	 * Date when attack occurred in milliseconds since epoch.
	 */
	attack_date: number
	/**
	 * The iso-3166-1 (alpha 2) country identifier where the fraud occurred.
	 */
	country_code: (string) | null
	/**
	 * The type of fraud committed, one of
	 * ACTIVE_WARNING,ANNOUNCEMENT,FAKE_DOCUMENT,FAKE_EMAIL,FAKE_PRESIDENT_CALL,FALSIFIED_INVOICE.
	 */
	fraudtype: Efraudtype
	/**
	 * Row creation timestamp with timezone UTC.
	 *
	 * @default now()
	 */
	created_at: Date
	/**
	 * Row update timestamp with timezone UTC, updated internally by trigger function.
	 *
	 * @default now()
	 */
	updated_at: Date
}

/**
 * List of fraud cases describing the date, location and type of fraud committed.
 */
interface FraudeventsInsert {
	/**
	 * Unique identifier of a fraud case in the CDQ API.
	 */
	cdl_id: string
	/**
	 * Date when attack occurred in milliseconds since epoch.
	 */
	attack_date: number
	/**
	 * The iso-3166-1 (alpha 2) country identifier where the fraud occurred.
	 */
	country_code: (string) | null
	/**
	 * The type of fraud committed, one of
	 * ACTIVE_WARNING,ANNOUNCEMENT,FAKE_DOCUMENT,FAKE_EMAIL,FAKE_PRESIDENT_CALL,FALSIFIED_INVOICE.
	 */
	fraudtype: Efraudtype
}

interface Dailyevents {
	attack_day: number
	country_code: (string) | null
	active_warning: number
	announcement: number
	fake_document: number
	fake_email: number
	fake_president_call: number
	falsified_invoice: number
	created_at: Date
	updated_at: Date
}


interface Dailysummary {
	attack_day: number
	active_warning: number
	announcement: number
	fake_document: number
	fake_email: number
	fake_president_call: number
	falsified_invoice: number
	created_at: Date
	updated_at: Date
}

interface DatabaseSchema {
	fraudevents: {record: Fraudevents, insert: FraudeventsInsert};
	dailyevents: {record: Dailyevents};
	dailysummary: {record: Dailysummary};
}

function serializeValue(_tableName: string, _columnName: string, value: unknown): unknown {
	return value;
}

export {
	serializeValue,
}

export type {
	Dailyevents,
	Dailysummary,
	DatabaseSchema,
	Efraudtype,
	Fraudevents,
	FraudeventsInsert,
}

export default DatabaseSchema;
