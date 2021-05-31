import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK} from "../../../../server/pk";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";

export default async function copyDataset(
    context: UFDLServerContext,
    base: DatasetPK,
    clearFiles: boolean
): Promise<DatasetPK> {
    const newDataset = await ICDataset.copy(
        context,
        base.asNumber,
        undefined,
        clearFiles ? [] : undefined
    );

    return base.project.dataset(newDataset['pk'] as number);
}
