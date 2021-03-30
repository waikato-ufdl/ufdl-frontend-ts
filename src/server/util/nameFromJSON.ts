import {RawJSONObject} from "ufdl-ts-client/types";

export function nameFromJSON(json: RawJSONObject): string {
    return json['name'] as string;
}
