import {FilterSpec} from "ufdl-ts-client/json/generated/FilterSpec";

export function exactFilter(field: string, value: boolean | number | string): FilterSpec {
    return {
        expressions: [
            {
                type: "exact",
                field: field,
                value: value
            }
        ]
    }
}