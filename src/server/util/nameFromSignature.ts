import {RawJSONObject} from "ufdl-ts-client/json/types";

export default function nameFromSignature(
    json: RawJSONObject & { name: string, version: number }
): string {
    return `${json.name} v${json.version}`;
}
