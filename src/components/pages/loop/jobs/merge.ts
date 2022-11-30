import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK} from "../../../../server/pk";
import {handleErrorResponse} from "../../../../server/error/handleErrorResponse";
import {ERROR_RESPONSE_HANDLERS} from "../../../../server/error/ERROR_RESPONSE_HANDLERS";
import {DomainName, DOMAIN_DATASET_METHODS} from "../../../../server/domains";

export default async function merge(
    context: UFDLServerContext,
    primaryDatasetPK: DatasetPK,
    preLabelDatasetPK: DatasetPK,
    domain: DomainName
): Promise<void> {
    await handleErrorResponse(
        DOMAIN_DATASET_METHODS[domain].merge(context, primaryDatasetPK.asNumber, preLabelDatasetPK.asNumber, true),
        ERROR_RESPONSE_HANDLERS.THROW
    );
}
