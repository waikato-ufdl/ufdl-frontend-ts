import {FunctionComponentReturnType} from "../types/FunctionComponentReturnType";
import React from "react";
import {augmentClassName} from "../augmentClass";
import DataVideo, {DataVideoProps} from "./DataVideo";
import getImageFromVideo, {SupportedImageTypes} from "../../getImageFromVideo";

export type DataVideoWithFrameExtractorProps = Omit<DataVideoProps, "forwardedRef"> & {
    type: SupportedImageTypes
    onExtract: (frame: Blob, time: number) => void
}

export default function DataVideoWithFrameExtractor(
    props: DataVideoWithFrameExtractorProps
): FunctionComponentReturnType {

    const {
        className,
        type,
        onExtract,
        ...dataVideoProps
    } = props;

    const ref = React.createRef<HTMLVideoElement>();

    const button = <button
        onClick={
            async () => {
                const video = ref.current
                if (video === null) {
                    console.log("No current video element for ref!")
                    return;
                }
                const image = await getImageFromVideo(video, type);
                onExtract(image, video.currentTime);
            }
        }
    >Extract</button>

    return <>
        <DataVideo
            className={augmentClassName(className, "DataVideoWithFrameExtractor")}
            forwardedRef={ref}
            {...dataVideoProps}
        />
        {button}
    </>
}
