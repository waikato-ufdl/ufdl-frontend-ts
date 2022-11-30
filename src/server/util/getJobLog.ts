import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DataStream} from "ufdl-ts-client/types/base";
import {dataStreamSubject} from "../../util/rx/data/DataStreamSubject";
import {get_output} from "ufdl-ts-client/functional/core/jobs/job";
import behaviourSubjectCompletionPromise from "../../util/rx/behaviourSubjectCompletionPromise";
import JSZip from "jszip";
import {JobLog} from "../types/JobLog";

export async function getJobLog(
    context: UFDLServerContext,
    jobPK: number
): Promise<JobLog> {
    // Request the data from the job's log output
    const logDataStream: DataStream
        = await get_output(context, jobPK, "log", "Compressed<JSON, 8>");

    // Buffer the log data into memory
    const logDataZipped: Uint8Array
        = await behaviourSubjectCompletionPromise(dataStreamSubject(logDataStream));

    // Interpret the data as a zip archive
    const logDataArchive: JSZip
        = await JSZip.loadAsync(logDataZipped);

    // Unzip the log JSON file
    const logData: JSZip.JSZipObject | null = logDataArchive.file('data');

    // Except on unzip failure
    if (logData === null) throw new Error(`Couldn't get log from archive for job #${jobPK}`);

    // Decode the log file as UTF-8 text
    const logString: string
        = new TextDecoder().decode(await logData.async('uint8array'));

    // Parse the log into JSON (comes as an array of singular entries)
    const logJSON: JobLog[] = JSON.parse(logString);

    // Combine the singular entries into one log object
    let formatted: JobLog = {};
    for (const entry of logJSON) {
        formatted = {
            ...formatted,
            ...entry
        }
    }

    return formatted;
}
