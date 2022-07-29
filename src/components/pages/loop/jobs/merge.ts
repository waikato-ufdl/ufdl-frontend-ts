import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK} from "../../../../server/pk";
import {throwOnError, handleErrorResponse} from "../../../../server/util/responseError";
import {DomainName, DOMAIN_DATASET_METHODS} from "../../../../server/domains";

export default async function merge(
    context: UFDLServerContext,
    primaryDatasetPK: DatasetPK,
    preLabelDatasetPK: DatasetPK,
    domain: DomainName
): Promise<void> {
    await handleErrorResponse(
        DOMAIN_DATASET_METHODS[domain].merge(context, primaryDatasetPK.asNumber, preLabelDatasetPK.asNumber, true),
        throwOnError
    );
}
