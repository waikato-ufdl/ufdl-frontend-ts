import {RawJSONObject} from "ufdl-js-client/types";

export default function nameFromSignature(json: RawJSONObject): string {
    return `${json['name']} v${json['version']}`;
}