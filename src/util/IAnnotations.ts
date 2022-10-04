import {DetectedObjects} from "../server/types/annotations";
import {Annotation, ImageAnnotation, VideoAnnotation} from "ufdl-ts-client/json/hand_crafted/AnnotationsFile";
import arrayMap from "./typescript/arrays/arrayMap";
import {mapGetDefault} from "./map";
import {hasOwnProperty} from "./typescript/object";
import {inferElementsFromFirst} from "./typescript/arrays/inferElementsFromFirst";
import isDefined from "./typescript/isDefined";
import {Annotated} from "./react/component/pictureannotate/annotated";
import Shape from "./react/component/pictureannotate/shapes/Shape";
import Box from "./react/component/pictureannotate/shapes/Box";
import Polygon from "./react/component/pictureannotate/shapes/Polygon";

export function iAnnotationsToAnnotations(iAnnotations: readonly Annotated<Shape>[]): ImageAnnotation[];
export function iAnnotationsToAnnotations(iAnnotations: readonly Annotated<Shape>[], time: number): VideoAnnotation[];
export function iAnnotationsToAnnotations(
    iAnnotations: readonly Annotated<Shape>[],
    time?: number | undefined
): ImageAnnotation[] | VideoAnnotation[] {
    return arrayMap(
        iAnnotations,
        iAnnotation => iAnnotationToDetectedObject(iAnnotation, time)
    ) as any
}

export function iAnnotationToDetectedObject(
    iAnnotation: Annotated<Shape>,
    time?: number | undefined
): ImageAnnotation | VideoAnnotation {
    let x = Math.round(iAnnotation.shape.left())
    let y = Math.round(iAnnotation.shape.top())
    let width = Math.round(iAnnotation.shape.width())
    let height = Math.round(iAnnotation.shape.height())

    if (width < 0) {
        x += width
        width = -width
    }

    if (height < 0) {
        y += height
        height = -height
    }

    const label = iAnnotation.annotation ?? "UNLABELLED"

    const polygon = iAnnotation.shape instanceof Polygon
        ? {
            points: arrayMap(
                iAnnotation.shape.points,
                ({ x, y }) => [Math.round(x), Math.round(y)] as [number, number]
            )
        }
        : undefined

    if (isDefined(time))
        return {
            x,
            y,
            width,
            height,
            label,
            polygon,
            time
        }
    else
        return {
            x,
            y,
            width,
            height,
            label,
            polygon
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
): Annotated<Shape>[] | Map<number, Annotated<Shape>[]> {
    if (inferElementsFromFirst<VideoAnnotation, ImageAnnotation>(detectedObjects, firstIsVideoAnnotation))
        return videoAnnotationsToIAnnotations(detectedObjects)
    else
        return imageAnnotationsToIAnnotations(detectedObjects)
}

export function imageAnnotationsToIAnnotations(
    annotations: ImageAnnotation[]
): Annotated<Shape>[] {
    return annotations.map(annotationToIAnnotation)
}

export function videoAnnotationsToIAnnotations(
    annotations: VideoAnnotation[]
): Map<number, Annotated<Shape>[]> {
    const result = new Map<number, Annotated<Shape>[]>()

    for (const annotation of annotations) {
        const array = mapGetDefault(
            result,
            annotation.time,
            () => [],
            true
        )

        array.push(
            annotationToIAnnotation(annotation)
        )
    }

    return result
}

export function annotationToIAnnotation(
    annotation: Annotation
): Annotated<Shape> {
    return {
        annotation: annotation.label,
        shape: annotation.polygon === undefined
            ? new Box(annotation.y, annotation.x, annotation.width, annotation.height)
            : new Polygon(
                ...arrayMap(
                    annotation.polygon.points,
                    ([x, y]) => {
                        return {
                            x, y
                        }
                    }
                )
            )
    }
}
