import React, {ReactNode} from "react";
import {BehaviorSubject} from "rxjs";
import {map} from "rxjs/operators";
import behaviourSubjectOperatorFunction from "../util/rx/behaviourSubjectOperatorFunction";
import {mapGetDefault} from "../util/map";

export class FileCache extends Map<string, BehaviorSubject<Blob>> {
    private _urlMap: Map<string, BehaviorSubject<string>>;

    constructor(entries?: readonly (readonly [string, BehaviorSubject<Blob>])[] | null) {
        super(entries);
        this._urlMap = new Map();
    }

    clear(): void {
        super.clear();
        this._urlMap.clear();
    }

    delete(key: string): boolean {
        this._urlMap.delete(key);
        return super.delete(key);
    }

    getURL(key: string): BehaviorSubject<string> | undefined {
        return mapGetDefault(
            this._urlMap,
            key,
            () => {
                const data = this.get(key);
                const x = data === undefined
                    ? undefined
                    : behaviourSubjectOperatorFunction(map(URL.createObjectURL))(data);
                return x;
            },
            this.has(key)
        )
    }
}

const GLOBAL_UFDL_FILE_CACHE: FileCache = new FileCache();

export const UFDL_FILE_CACHE_CONTEXT = React.createContext(GLOBAL_UFDL_FILE_CACHE);

export type UFDLFileCacheProviderProps = {
    context: FileCache
    children: ReactNode
}

export function UFDLImageCacheProvider(
    props: UFDLFileCacheProviderProps
) {
    return <UFDL_FILE_CACHE_CONTEXT.Provider value={props.context}>
        {props.children}
    </UFDL_FILE_CACHE_CONTEXT.Provider>
}
