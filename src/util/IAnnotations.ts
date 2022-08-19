import {DetectedObjects} from "../server/types/annotations";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import {IRectShapeData} from "react-picture-annotation/dist/types/src/Shape";
import {Annotation, ImageAnnotation, VideoAnnotation} from "ufdl-ts-client/json/hand_crafted/AnnotationsFile";
import arrayMap from "./typescript/arrays/arrayMap";
import {mapGetDefault} from "./map";
import enumerate from "./typescript/iterate/enumerate";
import {hasOwnProperty} from "./typescript/object";
import {inferElementsFromFirst} from "./typescript/arrays/inferElementsFromFirst";
import isDefined from "./typescript/isDefined";

export function iAnnotationsToAnnotations(iAnnotations: IAnnotation<IRectShapeData>[]): ImageAnnotation[];
export function iAnnotationsToAnnotations(iAnnotations: IAnnotation<IRectShapeData>[], time: number): VideoAnnotation[];
export function iAnnotationsToAnnotations(
    iAnnotations: IAnnotation<IRectShapeData>[],
    time?: number | undefined
): ImageAnnotation[] | VideoAnnotation[] {
    return arrayMap(
        iAnnotations,
        iAnnotation => iAnnotationToDetectedObject(iAnnotation, time)
    )
}

export function iAnnotationToDetectedObject(
    iAnnotation: IAnnotation<IRectShapeData>,
    time?: number | undefined
): ImageAnnotation | VideoAnnotation {
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

    const label = iAnnotation.comment || "UNLABELLED"

    if (isDefined(time))
        return {
            x,
            y,
            width,
            height,
            label,
            time
        }
    else
        return {
            x,
            y,
            width,
            height,
            label
        }
}

export function firstIsVideoAnnotation(
    first: ImageAnnotation | VideoAnnotation
): first is VideoAnnotation {
    console.log("firstIsVideoAnnotation", first)
    return hasOwnProperty(first, "time")
}

export function detectedObjectsToIAnnotations(
    detectedObjects: DetectedObjects
): IAnnotation<IRectShapeData>[] | Map<number, IAnnotation<IRectShapeData>[]> {
    if (inferElementsFromFirst<VideoAnnotation, ImageAnnotation>(detectedObjects, firstIsVideoAnnotation))
        return videoAnnotationsToIAnnotations(detectedObjects)
    else
        return imageAnnotationsToIAnnotations(detectedObjects)
}

export function imageAnnotationsToIAnnotations(
    annotations: ImageAnnotation[]
): IAnnotation<IRectShapeData>[] {
    return annotations.map(
        (annotation, index) => annotationToIAnnotation(annotation, index.toString())
    )
}

export function videoAnnotationsToIAnnotations(
    annotations: VideoAnnotation[]
): Map<number, IAnnotation<IRectShapeData>[]> {
    const result = new Map<number, IAnnotation<IRectShapeData>[]>()

    for (const [index, annotation] of enumerate(annotations)) {
        const array = mapGetDefault(
            result,
            annotation.time,
            () => [],
            true
        )

        array.push(
            annotationToIAnnotation(annotation, index.toString())
        )
    }

    return result
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