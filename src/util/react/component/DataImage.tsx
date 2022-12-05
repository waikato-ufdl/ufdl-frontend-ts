import {FunctionComponentReturnType} from "../types/FunctionComponentReturnType";
import React, {ImgHTMLAttributes} from "react";
import {BehaviorSubject} from "rxjs";
import {augmentClassName} from "../augmentClass";
import {useObservable} from "../hooks/useObservable";
import useDerivedState from "../hooks/useDerivedState";
import isBehaviourSubject from "../../rx/isBehaviourSubject";

export type DataImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    src: BehaviorSubject<Blob> | BehaviorSubject<string> | Blob | string | undefined
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

    const srcTracker = useObservable<Blob | string>(
        isBehaviourSubject(src) ? src : undefined
    );

    // Create a data-url for any data-like sources
    const srcValue: string | Blob | undefined = isBehaviourSubject(src)
        ? src.value
        : src;

    // Create a url for blobs
    const url = useDerivedState(
        () => srcValue instanceof Blob ? URL.createObjectURL(srcValue) : srcValue,
        [srcValue]
    );

    return <img
        src={url}
        className={augmentClassName(className, "DataImage")}
        alt={alt === undefined ? "" : alt}
        {...imgProps}
    />
}
