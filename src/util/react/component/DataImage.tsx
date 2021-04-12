import {FunctionComponentReturnType} from "../types";
import React, {ImgHTMLAttributes} from "react";
import {BehaviorSubject} from "rxjs";
import {augmentClassName} from "../../augmentClass";
import {useObservable} from "../hooks/useObservable";
import useDerivedState from "../hooks/useDerivedState";

export type DataImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    src: BehaviorSubject<Blob> | Blob | string | undefined
}

export default function DataImage(
    props: DataImageProps
): FunctionComponentReturnType {
    
    const {
        src,
        alt,
        className,
        ...imgProps
    } = props;

    const srcTracker = useObservable(
        src !== undefined && typeof src !== "string" && !(src instanceof Blob) ? src : undefined
    );

    // Create a data-url for any data-like sources
    const srcActual: string | undefined = useDerivedState(
        () => src instanceof Blob
            ? URL.createObjectURL(src)
            : typeof src === "string"
                ? src
                : src !== undefined
                    ? URL.createObjectURL(src.value)
                    : undefined,
        [src, srcTracker]
    );

    return <img
        src={srcActual}
        className={augmentClassName(className, "DataImage")}
        alt={alt === undefined ? "" : alt}
        {...imgProps}
    />
}
