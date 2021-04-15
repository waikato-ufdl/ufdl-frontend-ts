import {RawJSONObject} from "ufdl-ts-client/types/raw";

export function nameFromJSON(
    json: RawJSONObject & {name: string}
): string {
    return json.name;
}
