import {MutableDatasetDispatch, MutableDatasetDispatchItem} from "../useDataset/DatasetDispatch";
import {NO_ANNOTATION} from "../../types/annotations";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import {IRectShapeData} from "react-picture-annotation/dist/types/src/Shape";
import {DomainAnnotationType, DomainDataType} from "../../domains";
import isDefined from "../../../util/typescript/isDefined";
import hasData from "../../../util/react/query/hasData";
import {detectedObjectsToIAnnotations} from "../../../util/IAnnotations";

export class ObjectDetectionDatasetDispatchItem
    extends MutableDatasetDispatchItem<
        DomainDataType<'Object Detection'>,
        DomainAnnotationType<'Object Detection'>
    >
{
    public asIAnnotations(): IAnnotation<IRectShapeData>[] | Map<number, IAnnotation<IRectShapeData>[]> | typeof NO_ANNOTATION | undefined {
        const annotationsResult = this.annotations

        if (!hasData(annotationsResult)) return undefined;

        const annotations = annotationsResult.data

        if (annotations === NO_ANNOTATION) return NO_ANNOTATION

        return detectedObjectsToIAnnotations(annotations)
    }

}
export default class ObjectDetectionDatasetDispatch
    extends MutableDatasetDispatch<
        DomainDataType<'Object Detection'>,
        DomainAnnotationType<'Object Detection'>,
        ObjectDetectionDatasetDispatchItem
> {
    public asIAnnotations(filename: string): IAnnotation<IRectShapeData>[] | Map<number, IAnnotation<IRectShapeData>[]> | typeof NO_ANNOTATION | undefined {
        const objects = this.get(filename);

        if (!isDefined(objects)) return undefined

        return objects.asIAnnotations()
    }

}