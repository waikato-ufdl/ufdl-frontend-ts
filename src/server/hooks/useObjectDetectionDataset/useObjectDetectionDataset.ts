import useDataset from "../useDataset/useDataset";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import React from "react";
import {DataCache} from "../../DataCache";
import {DatasetPK} from "../../pk";
import {Image} from "../../types/data";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import ObjectDetectionDatasetDispatch from "./ObjectDetectionDatasetDispatch";
import {DetectedObjects} from "../../types/annotations";

export default function useObjectDetectionDataset(
    serverContext: UFDLServerContext,
    dataCacheContext: React.Context<DataCache<Image>>,
    datasetPK?: DatasetPK
): ObjectDetectionDatasetDispatch | undefined {
    return useDataset(
        serverContext,
        dataCacheContext,
        getAnnotations,
        [],
        ObjectDetectionDatasetDispatch,
        datasetPK
    )
}

function getAnnotations(
    context: UFDLServerContext,
    pk: number
): (filename: string) => Promise<DetectedObjects> {
    const objectsPromise = ODDataset.get_annotations(context, pk)

    return async (filename) => {
        const objects = await objectsPromise;

        const objectsForFile = objects[filename];

        if (objectsForFile === undefined)
            return [];

        return objectsForFile.annotations;
    }
}
