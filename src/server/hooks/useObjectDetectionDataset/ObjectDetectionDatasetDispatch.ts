import {MutableDatasetDispatch, MutableDatasetDispatchItem} from "../useDataset/DatasetDispatch";
import {NO_ANNOTATION, OptionalAnnotations} from "../../types/annotations";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import {IRectShapeData} from "react-picture-annotation/dist/types/src/Shape";
import {DomainAnnotationType, DomainDataType} from "../../domains";
import isDefined from "../../../util/typescript/isDefined";
import hasData from "../../../util/react/query/hasData";
import delayFunction from "../../../util/typescript/delayFunction";
import {mapGetDefault} from "../../../util/map";
import {detectedObjectsToIAnnotations} from "../../../util/IAnnotations";
import {isDeepEqual} from "../../../util/equivalency";

export class ObjectDetectionDatasetDispatchItem
    extends MutableDatasetDispatchItem<
        DomainDataType<'Object Detection'>,
        DomainAnnotationType<'Object Detection'>
    >
{
    public asIAnnotations(): IAnnotation<IRectShapeData>[] | undefined {
        const annotationsResult = this.annotations

        if (!hasData(annotationsResult)) return undefined;

        const annotations = annotationsResult.data

        if (annotations === NO_ANNOTATION) return []

        return detectedObjectsToIAnnotations(annotations)
    }

}
export default class ObjectDetectionDatasetDispatch
    extends MutableDatasetDispatch<
        DomainDataType<'Object Detection'>,
        DomainAnnotationType<'Object Detection'>,
        ObjectDetectionDatasetDispatchItem
> {
    // Create a delayed version of the annotation change function which doesn't
    // update the server until the user has stopped making changes for at least
    // half a second
    private delayedSetAnnotationsForFile: Map<string, (annotations: OptionalAnnotations<DomainAnnotationType<"Object Detection">>) => void>
        = new Map()

    setAnnotationsForFile(filename: string, annotations: OptionalAnnotations<DomainAnnotationType<"Object Detection">>) {
        // Make sure the annotations have changed before sending
        const currentAnnotations = this.get(filename)?.annotations?.data as OptionalAnnotations<DomainAnnotationType<"Object Detection">>
        if (annotations === NO_ANNOTATION && currentAnnotations === NO_ANNOTATION) return
        if (annotations !== NO_ANNOTATION && currentAnnotations !== NO_ANNOTATION) {
            if (isDeepEqual(annotations, currentAnnotations)) return
        }

        const delayedFunction = mapGetDefault(
            this.delayedSetAnnotationsForFile,
            filename,
            () => delayFunction((annotations) => super.setAnnotationsForFile(filename, annotations), 500),
            true
        )

        delayedFunction(annotations)
    }

    public asIAnnotations(filename: string): IAnnotation<IRectShapeData>[] | undefined {
        const objects = this.get(filename);

        if (!isDefined(objects)) return undefined

        return objects.asIAnnotations()
    }

}