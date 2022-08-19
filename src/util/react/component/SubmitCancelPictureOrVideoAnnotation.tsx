import {FunctionComponentReturnType} from "../types";
import {SubmitCancelPictureAnnotation, SubmitCancelPictureAnnotationProps} from "./SubmitCancelPictureAnnotation";
import {ObjectDetectionDatasetDispatchItem} from "../../../server/hooks/useObjectDetectionDataset/ObjectDetectionDatasetDispatch";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import isDefined from "../../typescript/isDefined";
import {SubmitCancelVideoAnnotation} from "./SubmitCancelVideoAnnotation";
import useDerivedState from "../hooks/useDerivedState";
import {IRectShapeData} from "react-picture-annotation/dist/types/src/Shape";
import {NO_ANNOTATION} from "../../../server/types/annotations";
import useRenderNotify from "../hooks/useRenderNotify";

export type SubmitCancelPictureOrVideoAnnotationProps = Omit<SubmitCancelPictureAnnotationProps, "annotationData" | "onChange" | "image" | "onSubmit"> & {
    item: ObjectDetectionDatasetDispatchItem
    onChange: (annotationData: IAnnotation[], timestamp?: number) => void
    onSubmit: (annotationData: ReadonlyMap<number, IAnnotation[]> | IAnnotation[]) => void
}

export function SubmitCancelPictureOrVideoAnnotation(
    props: SubmitCancelPictureOrVideoAnnotationProps
): FunctionComponentReturnType {

    useRenderNotify("SubmitCancelPictureOrVideoAnnotation", props)

    const {
        item,
        ...otherProps
    } = props

    const destructured: undefined | [true, Blob, Map<number, IAnnotation<IRectShapeData>[]>] | [false, string, IAnnotation<IRectShapeData>[]]
        = useDerivedState(
        ([item]) => {
            const imageOrVideo = item.data.data?.getValue()

            if (!isDefined(imageOrVideo)) return undefined

            const annotations = item.asIAnnotations()
            console.log("annotations", annotations)

            if (!isDefined(annotations)) return undefined

            if (imageOrVideo.isVideo)
                return [true, imageOrVideo.raw, annotations === NO_ANNOTATION ? new Map() : annotations as Map<number, IAnnotation<IRectShapeData>[]>]
            else
                return [false, imageOrVideo.url, annotations === NO_ANNOTATION ? [] : annotations as IAnnotation<IRectShapeData>[]]

        },
        [item] as const
    )

    if (!isDefined(destructured)) return <p>Pending data...</p>

    if (destructured[0]) {
        return <SubmitCancelVideoAnnotation
            video={destructured[1]}
            annotationData={destructured[2]}
            {...otherProps}
        />
    } else {
        return <SubmitCancelPictureAnnotation
            image={destructured[1]}
            annotationData={destructured[2]}
            {...otherProps}
        />

    }

}