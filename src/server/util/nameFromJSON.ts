import {RawJSONObject} from "ufdl-js-client/types";

export function nameFromJSON(json: RawJSONObject): string {
    return json['name'] as string;
}
