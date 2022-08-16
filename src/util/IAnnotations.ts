import {DetectedObjects} from "../server/types/annotations";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import {IRectShapeData} from "react-picture-annotation/dist/types/src/Shape";
import {Annotation} from "ufdl-ts-client/json/hand_crafted/AnnotationsFile";
import {isNotEmpty} from "./typescript/arrays/isNotEmpty";
import arrayMap from "./typescript/arrays/arrayMap";

export function iAnnotationsToDetectedObjects(
    iAnnotations: IAnnotation<IRectShapeData>[]
): DetectedObjects | undefined {
    if (isNotEmpty(iAnnotations)) {
        return arrayMap(
            iAnnotations,
            iAnnotationToAnnotation
        )
    }

    return undefined
}

export function iAnnotationToAnnotation(
    iAnnotation: IAnnotation<IRectShapeData>
): Annotation {
    let x = Math.round(iAnnotation.mark.x)
    let y = Math.round(iAnnotation.mark.y)
    let width = Math.round(iAnnotation.mark.width)
    let height = Math.round(iAnnotation.mark.height)

    if (width < 0) {
        x += width
        width = -width
    }

    if (height < 0) {
        y += height
        height = -height
    }

    return {
        x,
        y,
        width,
        height,
        label: iAnnotation.comment || "UNLABELLED"
    }
}

export function detectedObjectsToIAnnotations(
    detectedObjects: DetectedObjects
): IAnnotation<IRectShapeData>[] {
    return detectedObjects.map(
        (annotation, index) => annotationToIAnnotation(annotation, index.toString())
    )
}

export function annotationToIAnnotation(
    annotation: Annotation,
    id: string
): IAnnotation<IRectShapeData> {
    return {
        comment: annotation.label,
        id: id,
        mark: {
            type: "RECT",
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height
        }
    }
}