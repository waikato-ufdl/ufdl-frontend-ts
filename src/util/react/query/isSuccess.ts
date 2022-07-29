import {QueryDataType, ReadonlyQueryResult} from "./types";

export default function isSuccess<R extends ReadonlyQueryResult>(
    queryResult: R
): queryResult is (R & { readonly data: QueryDataType<R> } & { readonly isSuccess: true }) {
    return queryResult.isSuccess
}
