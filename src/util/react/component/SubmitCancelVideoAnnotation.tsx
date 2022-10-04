import {FunctionComponentReturnType} from "../types";
import {SubmitCancelPictureAnnotation, SubmitCancelPictureAnnotationProps} from "./SubmitCancelPictureAnnotation";
import useDerivedState from "../hooks/useDerivedState";
import {constantInitialiser} from "../../typescript/initialisers";
import asChangeEventHandler from "../asChangeEventHandler";
import getVideoStats from "../../getVideoStats";
import usePromise, {Resolution} from "../hooks/usePromise";
import useDerivedReducer from "../hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../hooks/SimpleStateReducer";
import getImageFromVideo from "../../getImageFromVideo";
import {mapGetDefault, spreadJoinMaps} from "../../map";
import "./SubmitCancelVideoAnnotation.css"
import {identity} from "../../identity";
import {anyToString} from "../../typescript/strings/anyToString";
import useStateSafe from "../hooks/useStateSafe";
import {Annotated} from "./pictureannotate/annotated";
import Shape from "./pictureannotate/shapes/Shape";
import iteratorMap from "../../typescript/iterate/map";
import arrayFlatten from "../../typescript/arrays/arrayFlatten";
import {Controllable, useControllableState} from "../hooks/useControllableState";

export type SubmitCancelVideoAnnotationProps = Omit<SubmitCancelPictureAnnotationProps, "annotatedShapes" | "selected" | "onSelected" | "onChange" | "image" | "onSubmit"> & {
    annotatedShapes: Controllable<ReadonlyMap<number, readonly Annotated<Shape>[]>>
    onChange: (annotationData: readonly Annotated<Shape>[], timestamp: number) => void
    video: Blob
    onSubmit: (annotationData: ReadonlyMap<number, readonly Annotated<Shape>[]>) => void
}

/** Reducer for controlling the time-stamp of the displayed frame. */
const FRAMETIME_REDUCER = createSimpleStateReducer<number>()

/** Initialiser which resets the frame-time to zero when the video changes. */
const FRAMETIME_INITIALISER = constantInitialiser(0.0)

/** Reducer for controlling the selected annotation. */
const SELECTED_REDUCER = createSimpleStateReducer<number | undefined>()

/** Initialiser which resets the selected annotation when the frame-time changes. */
const SELECTED_INITIALISER = constantInitialiser(undefined as number | undefined)

/**
 * Component which allows for annotating a video, with submit/cancel
 * buttons for exporting/aborting the annotations made.
 */
export function SubmitCancelVideoAnnotation(
    props: SubmitCancelVideoAnnotationProps
): FunctionComponentReturnType {

    const {
        annotatedShapes,
        onChange,
        video,
        onSubmit,
        ...otherProps
    } = props

    // Create an updateable map of annotations per frame, which resets
    // when the source annotationData prop changes
    const [annotationsMap, setAnnotations] = useControllableState(annotatedShapes, () => new Map())

    const setAnnotationsForFrame = useDerivedState(
        ([annotationsMap, setAnnotations, onChange]) =>
            (frametime: number, annotations: readonly Annotated<Shape>[]) => {
                const newMap = spreadJoinMaps(annotationsMap)
                if (annotations.length > 0) {
                    newMap.set(frametime, annotations)
                } else {
                    newMap.delete(frametime)
                }
                setAnnotations(newMap)
                onChange(annotations, frametime)
            },
        [annotationsMap, setAnnotations, onChange] as const
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

    const [selected, setSelected] = useDerivedReducer(
        SELECTED_REDUCER,
        SELECTED_INITIALISER,
        [frametime] as const
    )

    // Augment the onChange callback to also update the annotations map
    const onChangeActual = useDerivedState(
        ([frametime, setAnnotationsForFrame]) => (annotationData: readonly Annotated<Shape>[]) => {
            setAnnotationsForFrame(frametime, annotationData)
        },
        [frametime, setAnnotationsForFrame] as const
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
                // Seek the video to the current frame-time
                videoElement.currentTime = frametime

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
    const [frameURLBuffered] = useDerivedReducer<string, string, never, readonly [Resolution<string>]>(
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
        ([videoStats, frametime, setFrameTime, annotationsMap]) => {
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
                    onChange={asChangeEventHandler(setFrameTime, Number.parseFloat)}
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
        [videoStats, frametime, setFrameTime, annotationsMap] as const
    )

    // Sort the frame-times of the annotated frames for display in a multi-select
    const sortedAnnotatedFrameTimes = useDerivedState(
        (annotatedFrames) => [...annotatedFrames].sort((a, b) => a - b),
        [...annotationsMap.keys()]
    )

    // Keep track of which frame-times the user has multi-selected
    const [selectedFrameTimes, setSelectedFrameTimes] = useStateSafe<readonly string[]>(constantInitialiser([]))

    // Create an on-change handler for updating the selected frame-times when the
    // user interacts with the multi-select
    const selectedFramesHandler = useDerivedState(
        ([setSelectedFrameTimes]) =>
            (event: React.ChangeEvent<HTMLSelectElement>) => {
                const selectedFrameTimes: string[] = []
                for (const frameTimeOption of event.target.selectedOptions) {
                    selectedFrameTimes.push(frameTimeOption.value)
                }
                setSelectedFrameTimes(selectedFrameTimes)
            },
        [setSelectedFrameTimes] as const
    )

    // Create a key-press handler which removes the annotations for the multi-selected
    // frames whenever the user presses delete or backspace
    const keyPressHandler = useDerivedState(
        ([selectedFrameTimes, setSelectedFrameTimes, setAnnotationsForFrame]) =>
            (event: React.KeyboardEvent<HTMLSelectElement>) => {
                // Abort if not delete or backspace pressed
                if (event.key !== "Delete" && event.key !== "Backspace") return

                // Clear the annotations for all selected frame-times
                for (const frameTime of selectedFrameTimes) {
                    setAnnotationsForFrame(Number.parseFloat(frameTime), [])
                }

                // Clear the list of selected frame-times
                setSelectedFrameTimes([])
        },
        [selectedFrameTimes, setSelectedFrameTimes, setAnnotationsForFrame] as const
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

    // Create the multi-select with an option for each annotated frame-time
    const frameDropDown = <select
        className={"FrameMultiSelect"}
        value={selectedFrameTimes}
        onChange={selectedFramesHandler}
        multiple
        onKeyPress={keyPressHandler}
    >
        {
            sortedAnnotatedFrameTimes.map(
                value => <option
                    key={value.toString()}
                    value={value.toString()}
                    onDoubleClick={
                        // If the user double-clicks the option for a given frame-time,
                        // seek to that frame-time
                        () => setFrameTime(value)
                    }
                >
                    {value.toFixed(3)}
                </option>
            )
        }
    </select>

    const options = arrayFlatten(
        [
            ...iteratorMap(
                annotationsMap.values(),
                annotations => annotations.map(annotation => annotation.annotation ?? "")
            )
        ]
    ).filter(annotation => annotation !== "")

    // Display the annotator for the frame, along with the frame-time slider and frame-time multi-select
    return <>
        <SubmitCancelPictureAnnotation
            annotatedShapes={annotationsMap.get(frametime) ?? []}
            selected={selected}
            onSelected={setSelected}
            onChange={onChangeActual}
            image={frameURLBuffered}
            onSubmit={onSubmitActual}
            options={options}
            {...otherProps}
        />
        {element}
        {frameDropDown}
    </>

}