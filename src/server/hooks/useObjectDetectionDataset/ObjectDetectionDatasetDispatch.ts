import DatasetDispatch from "../useDataset/DatasetDispatch";
import {Image} from "../../types/data";
import {mapMap} from "../../../util/map";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import {DetectedObjects} from "../../types/annotations";
import {IAnnotation} from "react-picture-annotation/dist/types/src/Annotation";
import {IRectShapeData} from "react-picture-annotation/dist/types/src/Shape";

export default class ObjectDetectionDatasetDispatch
    extends DatasetDispatch<Image, DetectedObjects> {

    public asIAnnotations(filename: string): IAnnotation<IRectShapeData>[] | undefined {
        const objects = this.items.get(filename);

        if (objects === undefined || objects.annotations.success !== true) return undefined;

        return objects.annotations.value.map(
            (annotation, index) => {
                return {
                    comment: annotation.label,
                    id: index.toString(),
                    mark: {
                        type: "RECT",
                        x: annotation.x,
                        y: annotation.y,
                        width: annotation.width,
                        height: annotation.height
                    }
                }
            }
        )
    }

    protected uploadAnnotationsForDataset(
        annotations: ReadonlyMap<string, DetectedObjects>
    ): Map<string, Promise<DetectedObjects>> {
        return mapMap(
            annotations,
            (filename, objects) => {

                return [[
                    filename,
                    this.uploadObjectsForImage(filename, objects).then(constantInitialiser(objects))
                ]]
            }
        );
    }

    private async uploadObjectsForImage(
        filename: string,
        objects: DetectedObjects
    ): Promise<unknown> {
        return ODDataset.set_annotations_for_image(
            this.serverContext,
            this.pk.asNumber,
            filename,
            objects
        )
    }

}