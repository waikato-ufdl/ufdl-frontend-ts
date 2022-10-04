import {FunctionComponentReturnType} from "../types";
import React from "react";
import useDerivedState from "../hooks/useDerivedState";
import "./SubmitCancelPictureAnnotation.css"
import PictureAnnotator, {PictureAnnotatorProps} from "./pictureannotate/PictureAnnotator";
import {Annotated} from "./pictureannotate/annotated";
import Shape from "./pictureannotate/shapes/Shape";
import {useControllableState} from "../hooks/useControllableState";

export type SubmitCancelPictureAnnotationProps = PictureAnnotatorProps & {
    onSubmit: (annotationData: readonly Annotated<Shape>[]) => void
    onCancel: () => void
}

export function SubmitCancelPictureAnnotation(
    props: SubmitCancelPictureAnnotationProps
): FunctionComponentReturnType {

    const {
        onSubmit,
        onCancel,
        onChange,
        annotatedShapes,
        ...reactPictureAnnotationProps
    } = props

    const [annotations, setAnnotations] = useControllableState(props.annotatedShapes, () => [])

    const onSubmitActual = useDerivedState(
        ([onSubmit, annotations]) => () => {
            onSubmit(annotations)
        },
        [onSubmit, annotations] as const
    )

    const onChangeActual = useDerivedState(
        ([setAnnotations, onChange]) => (annotationData: readonly Annotated<Shape>[]) => {
            setAnnotations(annotationData)
            onChange(annotationData)
        },
        [setAnnotations, onChange] as const
    )

    return <div className={"SubmitCancelPictureAnnotation"}>
        <PictureAnnotator
            onChange={onChangeActual}
            annotatedShapes={annotations}
            {...reactPictureAnnotationProps}
        />
        <div className={"SubmitCancelPictureAnnotationButtons"}>
            <button
                onClick={onSubmitActual}
            >
                Submit
            </button>
            <button
                onClick={onCancel}
            >
                Cancel
            </button>
        </div>
    </div>

}