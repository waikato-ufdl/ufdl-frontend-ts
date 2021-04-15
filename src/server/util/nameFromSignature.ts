import {RawJSONObject} from "ufdl-ts-client/types/raw";

export default function nameFromSignature(
    json: RawJSONObject & { name: string, version: number }
): string {
    return `${json.name} v${json.version}`;
}