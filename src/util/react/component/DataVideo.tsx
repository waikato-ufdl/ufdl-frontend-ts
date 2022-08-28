import {FunctionComponentReturnType} from "../types";
import React, {ForwardedRef, VideoHTMLAttributes} from "react";
import {BehaviorSubject} from "rxjs";
import {augmentClassName} from "../augmentClass";
import {useObservable} from "../hooks/useObservable";
import useDerivedState from "../hooks/useDerivedState";
import isBehaviourSubject from "../../rx/isBehaviourSubject";

export type DataVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> & {
    src: BehaviorSubject<Blob> | BehaviorSubject<string> | Blob | string | undefined,
    forwardedRef: ForwardedRef<HTMLVideoElement> | undefined
}

export default function DataVideo(
    props: DataVideoProps
): FunctionComponentReturnType {

    const {
        src,
        forwardedRef,
        className,
        ...videoProps
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

    return <VideoWithRef
        src={url}
        ref={forwardedRef}
        className={augmentClassName(className, "DataVideo")}
        {...videoProps}
    />
}

const VideoWithRef = React.forwardRef<HTMLVideoElement, VideoHTMLAttributes<HTMLVideoElement>>(
    (props, ref) => <video
        ref={ref}
        {...props}
    />
)