import {FunctionComponentReturnType} from "../types";
import {ReactPictureAnnotation} from "react-picture-annotation";
import React from "react";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import {IShapeStyle} from "react-picture-annotation/dist/types/src/Shape";
import useDerivedState from "../hooks/useDerivedState";
import useRenderNotify from "../hooks/useRenderNotify";
import useDerivedReducer from "../hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../hooks/SimpleStateReducer";
import "./SubmitCancelPictureAnnotation.css"
import {isDeepEqual} from "../../equivalency";
import {arrayEqual} from "../../typescript/arrays/arrayEqual";

export type SubmitCancelPictureAnnotationProps = {
    annotationData?: IAnnotation[]
    selectedId?: string | null
    scrollSpeed?: number
    marginWithInput?: number
    onChange: (annotationData: IAnnotation[]) => void
    onSelect: (id: string | null) => void
    width: number
    height: number
    image: string
    annotationStyle?: IShapeStyle
    defaultAnnotationSize?: [number, number]
    inputElement?: (value: string, onChange: (value: string) => void, onDelete: () => void) => React.ReactElement
    onSubmit: (annotationData: IAnnotation[]) => void
    onCancel: () => void
}

const ANNOTATION_REDUCER = createSimpleStateReducer<IAnnotation[]>()

export function SubmitCancelPictureAnnotation(
    props: SubmitCancelPictureAnnotationProps
): FunctionComponentReturnType {

    useRenderNotify("SubmitCancelPictureAnnotation", props)

    const {
        onSubmit,
        onCancel,
        onChange,
        annotationData,
        ...reactPictureAnnotationProps
    } = props

    const [annotations, setAnnotations] = useDerivedReducer(
        ANNOTATION_REDUCER,
        ([annotationData]) => annotationData ?? [],
        [annotationData] as const,
        () => annotationData ?? []
    )

    const onSubmitActual = useDerivedState(
        ([onSubmit, annotations]) => () => {
            onSubmit(annotations)
        },
        [onSubmit, annotations] as const
    )

    const onChangeActual = useDerivedState(
        ([setAnnotations, onChange, annotations]) => (annotationData: IAnnotation[]) => {
            if (arrayEqual(annotations, annotationData, isDeepEqual)) return
            setAnnotations(annotationData)
            onChange(annotationData)
        },
        [setAnnotations, onChange, annotations] as const
    )

    return <div className={"SubmitCancelPictureAnnotation"}>
        <ReactPictureAnnotation
            onChange={onChangeActual}
            annotationData={annotations}
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