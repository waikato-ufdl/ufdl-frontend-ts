import {QueryDataType, ReadonlyQueryResult} from "./types";

export default function hasData<R extends ReadonlyQueryResult>(
    queryResult: R
): queryResult is (R & { readonly data: QueryDataType<R> } & ( { readonly isSuccess: true } | { readonly isRefetchError: true } )) {
    return queryResult.isSuccess || queryResult.isRefetchError
}
