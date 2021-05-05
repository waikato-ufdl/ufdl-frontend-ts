import useDataset from "../useDataset/useDataset";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import React from "react";
import {DataCache} from "../../DataCache";
import {DatasetPK} from "../../pk";
import {Image} from "../../types/data";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import ImageClassificationDatasetDispatch from "./ImageClassificationDatasetDispatch";

export default function useImageClassificationDataset(
    serverContext: UFDLServerContext,
    dataCacheContext: React.Context<DataCache<Image>>,
    datasetPK?: DatasetPK
): ImageClassificationDatasetDispatch | undefined {
    return useDataset(
        serverContext,
        dataCacheContext,
        getAnnotations,
        NO_CLASSIFICATION,
        ImageClassificationDatasetDispatch,
        datasetPK
    )
}

function getAnnotations(
    context: UFDLServerContext,
    pk: number
): (filename: string) => Promise<Classification> {
    const categoriesPromise = ICDataset.get_categories(context, pk)

    return async (filename) => {
        const categories = await categoriesPromise;

        const categoriesForFile = categories[filename];

        if (categoriesForFile === undefined || categoriesForFile.length === 0)
            return NO_CLASSIFICATION;

        return categoriesForFile[0];
    }
}
