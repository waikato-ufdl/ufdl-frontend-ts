import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import {DataStream, dataStreamSubject} from "../../util/rx/dataStream";
import {get_output} from "ufdl-js-client/functional/core/jobs/job";
import completionPromise from "../../util/rx/completionPromise";
import JSZip from "jszip";

export async function getJobLog(context: UFDLServerContext, jobPK: number) {

    const logDataStream: DataStream
        = await get_output(context, jobPK, "log", "json");

    const logDataZipped: Uint8Array
        = await completionPromise(dataStreamSubject(logDataStream));

    const logDataArchive: JSZip
        = await JSZip.loadAsync(logDataZipped);

    const logData: JSZip.JSZipObject | null = logDataArchive.file('log.json');

    if (logData === null) {
        throw new Error("Couldn't get log from archive")
    }

    const logString: string
        = new TextDecoder().decode(await logData.async('uint8array'));

    const logJSON: {[timestamp: string]: any}[] = JSON.parse(logString);

    let formatted = {};

    for (const entry of logJSON) {
        formatted = {
            ...formatted,
            ...entry
        }
    }

    return formatted;
}
