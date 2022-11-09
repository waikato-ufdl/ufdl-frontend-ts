import {UseQueryResult} from "@tanstack/react-query";
import {ReadonlyQueryResult} from "./types";
import {omit} from "../../typescript/object";

export function toReadonlyQueryResult<TData = unknown, TError = unknown>(
    useQueryResult: UseQueryResult<TData, TError>
): ReadonlyQueryResult<TData, TError> {
    return omit(
        'remove',
        useQueryResult
    )
}