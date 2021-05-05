import {RawJSONElement} from "ufdl-ts-client/json/types";

/**
 * Logs produced by jobs are JSON objects with timestamps (as strings)
 * for keys.
 */
export type JobLog = {[timestamp: string]: RawJSONElement}
