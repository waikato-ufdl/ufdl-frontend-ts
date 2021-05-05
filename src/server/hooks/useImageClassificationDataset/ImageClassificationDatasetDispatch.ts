import DatasetDispatch from "../useDataset/DatasetDispatch";
import {Image} from "../../types/data";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import {mapMap} from "../../../util/map";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import {CategoriesFile} from "ufdl-ts-client/functional/image_classification/mixin_actions";

export default class ImageClassificationDatasetDispatch
    extends DatasetDispatch<Image, Classification, never> {

    protected addAnnotationsInternal(
        annotations: ReadonlyMap<string, Classification>
    ): Map<string, Promise<any>> {
        const categoriesFile: CategoriesFile = {}

        annotations.forEach(
            (classification, filename) => {
                categoriesFile[filename] = classification === NO_CLASSIFICATION
                    ? []
                    : [classification]
            }
        )

        const promise = ICDataset.set_categories(
            this.serverContext,
            this.pk.asNumber,
            categoriesFile
        )

        return mapMap(
            annotations,
            (filename) => {
                return [[
                    filename,
                    promise
                ]]
            }
        );
    }

}