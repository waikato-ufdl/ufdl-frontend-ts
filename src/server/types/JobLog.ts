import {RawJSONElement} from "ufdl-ts-client/types/raw";

/**
 * Logs produced by jobs are JSON objects with timestamps (as strings)
 * for keys.
 */
export type JobLog = {[timestamp: string]: RawJSONElement}
