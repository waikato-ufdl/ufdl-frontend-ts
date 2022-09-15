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

export type SubmitCancelVideoAnnotationProps = Omit<SubmitCancelPictureAnnotationProps, "annotationData" | "onChange" | "image" | "onSubmit"> & {
    annotationData?: ReadonlyMap<number, IAnnotation[]>
    onChange: (annotationData: IAnnotation[], timestamp: number) => void
    video: Blob
    onSubmit: (annotationData: ReadonlyMap<number, IAnnotation[]>) => void
}

/** Reducer which simply joins the items from the action into the state. */
const ANNOTATIONS_MAP_REDUCER: Reducer<ReadonlyMap<number, IAnnotation[]>, readonly [number, IAnnotation[]]> = spreadJoinMaps

/**
 * Initialiser which initialises to the given dependency map, or to an empty
 * map if no dependency is given.
 *
 * @param dependency
 *          The dependent map from which to initialise.
 */
function annotationsMapInitialiser(
    [dependency]: readonly [ReadonlyMap<number, IAnnotation[]> | undefined]
): ReadonlyMap<number, IAnnotation[]> {
    if (dependency === undefined) return new Map()
    return dependency
}

/** Reducer for controlling the time-stamp of the displayed frame. */
const FRAMETIME_REDUCER = createSimpleStateReducer<number>()

/** Initialiser which resets the frame-time to zero when the video changes. */
const FRAMETIME_INITIALISER = constantInitialiser(0.0)

/**
 * Component which allows for annotating a video, with submit/cancel
 * buttons for exporting/aborting the annotations made.
 */
export function SubmitCancelVideoAnnotation(
    props: SubmitCancelVideoAnnotationProps
): FunctionComponentReturnType {

    const {
        annotationData,
        onChange,
        video,
        onSubmit,
        ...otherProps
    } = props

    // Create an updateable map of annotations per frame, which resets
    // when the source annotationData prop changes
    const [annotationsMap, setAnnotationsForFrame] = useDerivedReducer(
        ANNOTATIONS_MAP_REDUCER,
        annotationsMapInitialiser,
        [annotationData] as const
    )

    // Create a submit function which submits the current state of the annotations
    const onSubmitActual = useDerivedState(
        ([onSubmit, annotationsMap]) => () => {
            onSubmit(annotationsMap)
        },
        [onSubmit, annotationsMap] as const
    )

    // Get a data-URL to the video prop
    const videoURL = useDerivedState(
        ([blob]) => URL.createObjectURL(blob),
        [video] as const
    )

    // Create a video element to interact with the video data
    const videoElement = useDerivedState(
        ([url]) => {
            const el = document.createElement("video")
            el.src = url
            el.preload = "auto"
            return el
        },
        [videoURL] as const
    )

    // Get the video's stats
    const videoStats = usePromise(
        useDerivedState(
            ([blob]) => getVideoStats(blob),
            [video] as const
        )
    )

    // Create some state to manage the time of the current frame in
    // the video, which resets to zero when the video changes
    const [frametime, setFrameTime] = useDerivedReducer(
        FRAMETIME_REDUCER,
        FRAMETIME_INITIALISER,
        [videoStats] as const
    )

    // Augment the onChange callback to also update the annotations map
    const onChangeActual = useDerivedState(
        ([onChange, frametime, setAnnotationsForFrame]) => (annotationData: IAnnotation[]) => {
            setAnnotationsForFrame([frametime, annotationData])
            onChange(annotationData, frametime)
        },
        [onChange, frametime, setAnnotationsForFrame] as const
    )

    // Create a cache of promises of frame-data URLs so we only capture frame
    // images once (resets to empty whenever the video changes)
    const frameCache = useDerivedState(
        () => new Map<number, Promise<string>>(),
        [videoElement] as const
    )

    // Get a data-url for the current frame of the video, utilising the frame-cache
    // to eliminate double-loading of frame-data
    const frameURL = usePromise(
        useDerivedState(
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
    )

    // Create a buffer, so that when the frame changes, the previous frame is still
    // shown until the new frame is ready
    const [frameURLBuffered] = useDerivedReducer<string, never, readonly [Resolution<string>]>(
        identity,
        ([frameURL], state) => {
            // If the new frame is ready, return it
            if (frameURL.status === "resolved") return frameURL.value

            // Otherwise keep the previous frame
            return state
        },
        [frameURL] as const,
        constantInitialiser("")
    )

    // Create a range element to control the frame time, or a message to display the error if
    // one occurred
    const [status, element] = useDerivedState(
        ([videoStats, frametime, setFrameTime, videoElement, annotationsMap]) => {
            // If an error occurred while getting the video stats, just display it
            if (videoStats.status === "rejected") {
                return [
                    "rejected",
                    <p>{"Rejected: " + anyToString(videoStats.reason)}</p>
                ]
            }

            // Create an mark on the range element for each annotated frame-time
            const marks = []
            for (const time of annotationsMap.keys()) {
                marks.push(<option value={time}/>)
            }

            // Create the range slider
            const element = <div className={"SubmitCancelVideoAnnotationRange"}>
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

            return [videoStats.status, element]
        },
        [videoStats, frametime, setFrameTime, videoElement, annotationsMap] as const
    )

    // If getting the video stats errored, just display the error
    if (status === "rejected") return element

    // If getting the frame-data errored, display that error
    if (frameURL.status === "rejected")
        return <>
            <p>{`Couldn't get frame from video: ${frameURL.reason}`}</p>
            {element}
        </>

    // If the frame-data is still loading, just display the frame-time slider
    if (frameURLBuffered === "" && frameURL.status === "pending")
        return <>{element}</>

    // Display the annotator for the frame, along with the frame-time slider
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