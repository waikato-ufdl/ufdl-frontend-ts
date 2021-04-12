import React, {ReactNode} from "react";
import {BehaviorSubject} from "rxjs";

export type ImageCache = Map<string, BehaviorSubject<Blob>>

const GLOBAL_UFDL_IMAGE_CACHE: ImageCache = new Map();

export const UFDL_IMAGE_CACHE_CONTEXT = React.createContext(GLOBAL_UFDL_IMAGE_CACHE);

export type UFDLImageCacheProviderProps = {
    context: ImageCache
    children: ReactNode
}

export function UFDLImageCacheProvider(
    props: UFDLImageCacheProviderProps
) {
    return <UFDL_IMAGE_CACHE_CONTEXT.Provider value={props.context}>
        {props.children}
    </UFDL_IMAGE_CACHE_CONTEXT.Provider>
}
