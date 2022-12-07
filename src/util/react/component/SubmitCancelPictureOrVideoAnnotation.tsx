import {FunctionComponentReturnType} from "../types/FunctionComponentReturnType";
import {SubmitCancelPictureAnnotation, SubmitCancelPictureAnnotationProps} from "./SubmitCancelPictureAnnotation";
import {ObjectDetectionDatasetDispatchItem} from "../../../server/hooks/useObjectDetectionDataset/ObjectDetectionDatasetDispatch";
import isDefined from "../../typescript/isDefined";
import {SubmitCancelVideoAnnotation} from "./SubmitCancelVideoAnnotation";
import useDerivedState from "../hooks/useDerivedState";
import {NO_ANNOTATION} from "../../../server/NO_ANNOTATION";
import {Annotated} from "./pictureannotate/annotated";
import Shape from "./pictureannotate/shapes/Shape";
import {UNCONTROLLED_RESET, UncontrolledResetOverride} from "../hooks/useControllableState";
import pass from "../../typescript/functions/pass";

export type SubmitCancelPictureOrVideoAnnotationProps = Omit<SubmitCancelPictureAnnotationProps, "annotatedShapes" | "selected" | "onSelected" | "onChange" | "image" | "onSubmit"> & {
    item: ObjectDetectionDatasetDispatchItem
    onChange: (annotationData: readonly Annotated<Shape>[], timestamp?: number) => void
    onSubmit: (annotationData: ReadonlyMap<number, readonly Annotated<Shape>[]> | readonly Annotated<Shape>[]) => void
}

export function SubmitCancelPictureOrVideoAnnotation(
    props: SubmitCancelPictureOrVideoAnnotationProps
): FunctionComponentReturnType {

    const {
        item,
        ...otherProps
    } = props

    const destructured:
        | undefined
        | [true, Blob, UncontrolledResetOverride<Map<number, readonly Annotated<Shape>[]>>]
        | [false, string, UncontrolledResetOverride<readonly Annotated<Shape>[]>]
        = useDerivedState(
        ([item]) => {
            const imageOrVideo = item.data.data?.value

            if (!isDefined(imageOrVideo)) return undefined

            const annotations = item.asIAnnotations()
            console.log("annotations", annotations)

            if (!isDefined(annotations)) return undefined

            if (imageOrVideo.isVideo)
                return [
                    true,
                    imageOrVideo.raw,
                    new UncontrolledResetOverride(
                        annotations === NO_ANNOTATION
                            ? new Map()
                            : annotations as Map<number, readonly Annotated<Shape>[]>
                    )
                ]
            else
                return [
                    false,
                    imageOrVideo.url,
                    new UncontrolledResetOverride(
                        annotations === NO_ANNOTATION
                            ? []
                            : annotations as readonly Annotated<Shape>[]
                    )
                ]

        },
        [item] as const
    )

    if (!isDefined(destructured)) return <p>Pending data...</p>

    if (destructured[0]) {
        return <SubmitCancelVideoAnnotation
            video={destructured[1]}
            annotatedShapes={destructured[2]}
            {...otherProps}
        />
    } else {
        return <SubmitCancelPictureAnnotation
            image={destructured[1]}
            annotatedShapes={destructured[2]}
            selected={UNCONTROLLED_RESET}
            onSelected={pass}
            {...otherProps}
        />

    }

}