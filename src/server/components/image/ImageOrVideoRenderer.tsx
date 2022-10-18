import {ImageOrVideo} from "../../types/data";
import DataImage from "../../../util/react/component/DataImage";
import React from "react";
import {anyToString} from "../../../util/typescript/strings/anyToString";
import hasData from "../../../util/react/query/hasData";
import hasError from "../../../util/react/query/hasError";
import DataVideo from "../../../util/react/component/DataVideo";
import {DatasetDispatchItemDataType} from "../../hooks/useDataset/types";
import {useObservable} from "../../../util/react/hooks/useObservable";
import {augmentClassName} from "../../../util/react/augmentClass";

export function ImageOrVideoRenderer<D extends DatasetDispatchItemDataType<ImageOrVideo>>(
    props: {
        filename: string,
        selected: boolean,
        data: D
        className?: string
    }
) {
    const inTransitImageOrVideo = hasData(props.data)
        ? props.data.data
        : undefined

    // Need to update when the data loads more
    useObservable(inTransitImageOrVideo?.getObservable())

    const imageOrVideo = inTransitImageOrVideo?.getValue()

    const error = hasError(props.data)
        ? anyToString(props.data.error)
        : imageOrVideo === undefined
            ? "Couldn't find image/video data"
            : undefined

    if (imageOrVideo === undefined)
        return <div>
            {error}
        </div>

    if (imageOrVideo.isVideo) {
        return <DataVideo
            className={augmentClassName(props.className, "ImageOrVideoRenderer")}
            src={imageOrVideo?.url}
            title={error === undefined ? props.filename : `${props.filename}: ${error}`}
            forwardedRef={undefined}
            controls
            playsInline
            autoPlay
            loop
            muted
        />
    }

    return <DataImage
        className={augmentClassName(props.className, "ImageOrVideoRenderer")}
        src={imageOrVideo?.url}
        title={error === undefined ? props.filename : `${props.filename}: ${error}`}
    />
}
