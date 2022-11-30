import {DataStream} from "ufdl-ts-client/types/base";
import {DataStreamSubject, dataStreamSubject} from "../rx/data/DataStreamSubject";
import behaviourSubjectCompletionPromise from "../rx/behaviourSubjectCompletionPromise";
import toBlob from "../typescript/data/toBlob";
import {BehaviorSubject} from "rxjs";
import isPromise from "../typescript/async/isPromise";
import saveURL from "./saveURL";

/**
 * Saves a file to disk with the given filename.
 *
 * @param filename
 *          The filename to save the data under.
 * @param fileData
 *          The file data.
 */
export default async function saveFile(
    filename: string,
    fileData:
        | DataStream
        | DataStreamSubject
        | Promise<Uint8Array>
        | Uint8Array
        | Blob
        | Promise<Blob>
) {
    // Process the file-data into a blob, depending on the supplied type
    if (fileData instanceof ReadableStream) fileData = dataStreamSubject(fileData);
    if (fileData instanceof BehaviorSubject) fileData = behaviourSubjectCompletionPromise(fileData);
    if (isPromise(fileData)) fileData = await fileData;
    if (fileData instanceof Uint8Array) fileData = toBlob(fileData);

    // Create a URL for the data
    const url = URL.createObjectURL(fileData);

    await saveURL(filename, url);
}
