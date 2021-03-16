import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import {DatasetPK} from "../../../../server/pk";
import * as ICDataset from "ufdl-js-client/functional/image_classification/dataset";

export default async function copyDataset(
    context: UFDLServerContext,
    base: DatasetPK,
    clearFiles: boolean
): Promise<DatasetPK> {
    const newDataset = await ICDataset.copy(
        context,
        base.asNumber,
        undefined,
        clearFiles
    );

    return base.project.dataset(newDataset['pk'] as number);
}
