import {MutableDatasetDispatch, MutableDatasetDispatchItem} from "../useDataset/DatasetDispatch";
import {NO_ANNOTATION} from "../../NO_ANNOTATION";
import {DomainAnnotationType, DomainDataType} from "../../domains";
import isDefined from "../../../util/typescript/isDefined";
import hasData from "../../../util/react/query/hasData";
import {detectedObjectsToIAnnotations} from "../../../util/IAnnotations";
import {Annotated} from "../../../util/react/component/pictureannotate/annotated";
import Shape from "../../../util/react/component/pictureannotate/shapes/Shape";

export class ObjectDetectionDatasetDispatchItem
    extends MutableDatasetDispatchItem<
        DomainDataType<'Object Detection'>,
        DomainAnnotationType<'Object Detection'>
    >
{
    public asIAnnotations(): readonly Annotated<Shape>[] | Map<number, readonly Annotated<Shape>[]> | typeof NO_ANNOTATION | undefined {
        const annotationsResult = this.annotations

        if (!hasData(annotationsResult)) return undefined;

        const annotations = annotationsResult.data

        if (annotations === NO_ANNOTATION) return NO_ANNOTATION

        return detectedObjectsToIAnnotations(annotations)
    }

    public allLabels(): string[] {
        const annotationsResult = this.annotations

        if (!hasData(annotationsResult)) return [];

        const annotations = annotationsResult.data

        if (annotations === NO_ANNOTATION) return []

        const labelSet = new Set<string>()

        for (const annotation of annotations) {
            labelSet.add(annotation.label)
        }

        return [...labelSet]
    }

}
export default class ObjectDetectionDatasetDispatch
    extends MutableDatasetDispatch<
        DomainDataType<'Object Detection'>,
        DomainAnnotationType<'Object Detection'>,
        ObjectDetectionDatasetDispatchItem
> {
    public asIAnnotations(filename: string): readonly Annotated<Shape>[] | Map<number, readonly Annotated<Shape>[]> | typeof NO_ANNOTATION | undefined {
        const objects = this.get(filename);

        if (!isDefined(objects)) return undefined

        return objects.asIAnnotations()
    }

    public allLabels(): string[] {
        const labelSet = new Set<string>()

        for (const item of this.itemMap.values()) {
            for (const label of item.allLabels())
                labelSet.add(label)
        }

        return [...labelSet]
    }

}