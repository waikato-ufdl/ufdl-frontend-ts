import React, {Key, ReactNode} from "react";
import {FunctionComponentReturnType} from "../util/react/types";
import {DataCache} from "./DataCache";


export type DataCacheProviderProps = {
    children?: ReactNode
    key?: Key | null
}

export default function dataCacheContext<D>(
    convert: (blob: Blob) => D
): [
    React.Context<DataCache<D>>,
    (props: DataCacheProviderProps) => FunctionComponentReturnType
] {

    const cache = new DataCache(convert);

    const context = React.createContext(cache);

    const component = (props: DataCacheProviderProps) => <context.Provider value={cache} {...props} />;

    return [context, component];
}
