import {QueryErrorType, ReadonlyQueryResult} from "./types";

export default function hasError<R extends ReadonlyQueryResult>(
    queryResult: R
): queryResult is (R & { readonly error: QueryErrorType<R> } & { readonly isError: true } ) {
    return queryResult.isError
}
