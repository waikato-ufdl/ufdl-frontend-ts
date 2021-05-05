import {RawJSONObject} from "ufdl-ts-client/json/types";

export function nameFromJSON(
    json: RawJSONObject & {name: string}
): string {
    return json.name;
}
