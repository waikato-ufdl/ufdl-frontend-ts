import {FunctionComponentReturnType} from "../types";
import {SubmitCancelPictureAnnotation, SubmitCancelPictureAnnotationProps} from "./SubmitCancelPictureAnnotation";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import useDerivedState from "../hooks/useDerivedState";
import {constantInitialiser} from "../../typescript/initialisers";
import asChangeEventHandler from "../asChangeEventHandler";
import getVideoStats from "../../getVideoStats";
import usePromise, {Resolution} from "../hooks/usePromise";
import useDerivedReducer from "../hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../hooks/SimpleStateReducer";
import getImageFromVideo from "../../getImageFromVideo";
import {mapGetDefault, spreadJoinMaps} from "../../map";
import {Reducer} from "react";
import "./SubmitCancelVideoAnnotation.css"
import {identity} from "../../identity";
import {anyToString} from "../../typescript/strings/anyToString";
import useRenderNotify from "../hooks/useRenderNotify";

export type SubmitCancelVideoAnnotationProps = Omit<SubmitCancelPictureAnnotationProps, "annotationData" | "onChange" | "image" | "onSubmit"> & {
    annotationData?: ReadonlyMap<number, IAnnotation[]>
    onChange: (annotationData: IAnnotation[], timestamp: number) => void
    video: Blob
    onSubmit: (annotationData: ReadonlyMap<number, IAnnotation[]>) => void
}

const ANNOTATIONS_MAP_REDUCER: Reducer<ReadonlyMap<number, IAnnotation[]>, readonly [number, IAnnotation[]]> = spreadJoinMaps

function annotationsMapInitialiser(
    [dependency]: readonly [ReadonlyMap<number, IAnnotation[]> | undefined]
): ReadonlyMap<number, IAnnotation[]> {
    if (dependency === undefined) return new Map()
    return dependency
}

export function SubmitCancelVideoAnnotation(
    props: SubmitCancelVideoAnnotationProps
): FunctionComponentReturnType {

    useRenderNotify("SubmitCancelVideoAnnotation", props)

    const {
        annotationData,
        onChange,
        video,
        onSubmit,
        ...otherProps
    } = props

    const [annotationsMap, setAnnotationsForFrame] = useDerivedReducer(
        ANNOTATIONS_MAP_REDUCER,
        annotationsMapInitialiser,
        [annotationData] as const
    )

    const onSubmitActual = useDerivedState(
        ([onSubmit, annotationsMap]) => () => {
            onSubmit(annotationsMap)
        },
        [onSubmit, annotationsMap] as const
    )

    const videoURL = useDerivedState(
        ([blob]) => URL.createObjectURL(blob),
        [props.video] as const
    )

    const videoElement = useDerivedState(
        ([url]) => {
            const el = document.createElement("video")
            el.src = url
            el.preload = "auto"
            return el
        },
        [videoURL] as const
    )

    const videoStatsPromise = useDerivedState(
        ([blob]) => getVideoStats(blob),
        [props.video] as const
    )

    const videoStats = usePromise(videoStatsPromise)

    const [frametime, setFrameTime] = useDerivedReducer(
        createSimpleStateReducer<number>(),
        constantInitialiser(0.0),
        [videoStats] as const
    )

    const onChangeActual = useDerivedState(
        ([onChange, frametime, setAnnotationsForFrame]) => (annotationData: IAnnotation[]) => {
            console.log("onChange called", frametime, annotationData)
            setAnnotationsForFrame([frametime, annotationData])
            onChange(annotationData, frametime)
        },
        [onChange, frametime, setAnnotationsForFrame] as const
    )

    const frameCache = useDerivedState(
        () => new Map<number, Promise<string>>(),
        [videoElement] as const
    )

    const framePromise = useDerivedState(
        ([videoElement, frameCache, frametime]) => {
            return mapGetDefault(
                frameCache,
                frametime,
                () => getImageFromVideo(videoElement, "jpeg").then(URL.createObjectURL),
                true
            )
        },
        [videoElement, frameCache, frametime] as const
    )

    const frameURL = usePromise(framePromise)

    const [frameURLBuffered] = useDerivedReducer<string, never, readonly [Resolution<string>]>(
        identity,
        ([frameURL], state) => {
            if (frameURL.status === "resolved")
                return frameURL.value
            return state
        },
        [frameURL] as const,
        constantInitialiser("")
    )

    const [status, element] = useDerivedState(
        ([videoStats, frametime, setFrameTime, videoElement, annotationsMap]) => {
            let element: JSX.Element
            if (videoStats.status !== "rejected") {
                const marks = []
                for (const time of annotationsMap.keys()) {
                    marks.push(<option value={time}/>)
                }

                element = <div className={"SubmitCancelVideoAnnotationRange"}>
                    <input
                        type={"range"}
                        min={0.0}
                        max={videoStats.status === "resolved" ? videoStats.value.length : 100.0}
                        value={frametime}
                        step={1/24}
                        onChange={asChangeEventHandler((t) => {
                            setFrameTime(t)
                            videoElement.currentTime = t
                        }, Number.parseFloat)}
                        disabled={videoStats.status === "pending"}
                        list={"annotation_marks"}
                    />
                    <datalist id={"annotation_marks"}>
                        {marks}
                    </datalist>
                    {frametime}
                </div>
            } else
                element = <p>
                    {"Rejected: " + anyToString(videoStats.reason)}
                </p>

            return [videoStats.status, element]
        },
        [videoStats, frametime, setFrameTime, videoElement, annotationsMap] as const
    )

    if (status === "rejected") return element

    if (frameURL.status === "rejected")
        return <>
            <p>{`Couldn't get frame from video: ${frameURL.reason}`}</p>
            {element}
        </>
    else if (frameURLBuffered === "" && frameURL.status === "pending")
        return <>{element}</>

    return <>
        <SubmitCancelPictureAnnotation
            annotationData={annotationsMap.get(frametime)}
            onChange={onChangeActual}
            image={frameURLBuffered}
            onSubmit={onSubmitActual}
            {...otherProps}
        />
        {element}
    </>

}