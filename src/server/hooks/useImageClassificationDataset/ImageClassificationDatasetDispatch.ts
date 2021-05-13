import DatasetDispatch from "../useDataset/DatasetDispatch";
import {Image} from "../../types/data";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import {mapMap} from "../../../util/map";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import {CategoriesFile} from "ufdl-ts-client/functional/image_classification/mixin_actions";
import {constantInitialiser} from "../../../util/typescript/initialisers";

export default class ImageClassificationDatasetDispatch
    extends DatasetDispatch<Image, Classification> {

    protected uploadAnnotationsForDataset(
        annotations: ReadonlyMap<string, Classification>
    ): Map<string, Promise<Classification>> {
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
            (filename, classification) => {
                return [[
                    filename,
                    promise.then(constantInitialiser(classification))
                ]]
            }
        );
    }

}