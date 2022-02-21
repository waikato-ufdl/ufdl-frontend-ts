import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK} from "../../../../server/pk";
import {Domain, DOMAIN_DATASET_METHODS} from "../../../../server/domains";

export default async function copyDataset(
    context: UFDLServerContext,
    base: DatasetPK,
    clearFiles: boolean,
    domain: Domain
): Promise<DatasetPK> {
    const newDataset = await DOMAIN_DATASET_METHODS[domain].copy(
        context,
        base.asNumber,
        undefined,
        clearFiles ? [] : undefined
    );

    return base.project.dataset(newDataset['pk'] as number);
}
