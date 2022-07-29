import {UseQueryResult} from "react-query";
import hasData from "./hasData";

export default function mapQueryResult<TDataNew = unknown, TData = unknown, TError = unknown>(
    result: UseQueryResult<TData, TError>,
    mapFunc: (value: TData) => TDataNew
): UseQueryResult<TDataNew, TError> {
    if (hasData(result)) {
        const newData = mapFunc(result.data)
        return {
            ...result,
            data: newData
        } as any
    }

    return {
        ...result
    } as any
}
