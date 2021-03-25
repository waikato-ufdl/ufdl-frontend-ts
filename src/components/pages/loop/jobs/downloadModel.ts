import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import doAsync from "../../../../util/typescript/async/doAsync";
import {download} from "ufdl-js-client/functional/core/jobs/job_output";
import {saveFile} from "../../../../util/files";

export default function downloadModel(
    context: UFDLServerContext,
    modelOutputPK: number
) {
    doAsync(
        async () => {
            const dataStream = await download(context, modelOutputPK);

            await saveFile("model.zip", dataStream);
        }
    );
}