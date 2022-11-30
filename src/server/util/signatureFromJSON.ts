import {RawJSONObject} from "ufdl-ts-client/json/types";

export default function signatureFromJSON(
    json: RawJSONObject & { name: string, version: number }
): string {
    return `${json.name} v${json.version}`;
}
