import {Audio} from "../../types/data";
import React from "react";
import {anyToString} from "../../../util/typescript/strings/anyToString";
import hasData from "../../../util/react/query/hasData";
import hasError from "../../../util/react/query/hasError";
import {DatasetDispatchItemDataType} from "../../hooks/useDataset/types";
import {useObservable} from "../../../util/react/hooks/useObservable";

export function AudioRenderer<D extends DatasetDispatchItemDataType<Audio>>(
    props: {
        filename: string,
        selected: boolean,
        data: D
    }
) {
    const loadingAudio = hasData(props.data)
        ? props.data.data
        : undefined

    // Need to update when the data loads more
    useObservable(loadingAudio?.observable)

    const audio = loadingAudio?.value

    const error = hasError(props.data)
        ? anyToString(props.data.error)
        : audio === undefined
            ? "Couldn't find audio data"
            : undefined

    if (audio === undefined)
        return <div
            className={"AudioRenderer"}
            title={error === undefined ? props.filename : `${props.filename}: ${error}`}
        >
            {error}
        </div>

    return <div
        className={"AudioRenderer"}
        title={error === undefined ? props.filename : `${props.filename}: ${error}`}
    >
        <audio controls>
            {loadingAudio!.isFinished && <source src={audio.url} type={"audio/wav"}/>}
            {props.filename}
        </audio>
    </div>
}
