import {QueryObserverBaseResult} from "react-query/types/core/types";

/** Query result without the ability to remove the query-data. */
export type ReadonlyQueryResult<TData = unknown, TError = unknown> = Readonly<
    Omit<QueryObserverBaseResult<TData, TError>, 'remove'>
>

/** The data-type of a given query-type. */
export type QueryDataType<R extends ReadonlyQueryResult>
    = R extends ReadonlyQueryResult<infer TData> ? TData : never

/** The error type of a given query-type. */
export type QueryErrorType<R extends ReadonlyQueryResult>
    = R extends ReadonlyQueryResult<unknown, infer TError> ? TError : never
