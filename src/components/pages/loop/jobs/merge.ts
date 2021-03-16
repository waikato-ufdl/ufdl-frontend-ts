import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import {DatasetPK} from "../../../../server/pk";
import * as ICDataset from "ufdl-js-client/functional/image_classification/dataset";
import {throwOnError, handleErrorResponse} from "../../../../server/util/responseError";

export default async function merge(
    context: UFDLServerContext,
    primaryDatasetPK: DatasetPK,
    preLabelDatasetPK: DatasetPK
): Promise<void> {
    await handleErrorResponse(
        ICDataset.merge(context, primaryDatasetPK.asNumber, preLabelDatasetPK.asNumber, true),
        throwOnError
    );
}
