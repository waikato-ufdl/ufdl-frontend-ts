import {DataStream, DataStreamSubject, dataStreamSubject} from "../rx/dataStream";
import completionPromise from "../rx/completionPromise";
import toBlob from "../typescript/data/toBlob";
import {BehaviorSubject} from "rxjs";
import isPromise from "../typescript/async/isPromise";

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
    if (fileData instanceof BehaviorSubject) fileData = completionPromise(fileData);
    if (isPromise(fileData)) fileData = await fileData;
    if (fileData instanceof Uint8Array) fileData = toBlob(fileData);

    // Create a dummy anchor link to download the file-data
    const dummyLink: HTMLAnchorElement = document.createElement("a");

    // Add a URL to the file-data
    dummyLink.href = URL.createObjectURL(fileData);

    // Add the name to give the file
    dummyLink.download = filename;

    // Click the link to initiate download of the data
    dummyLink.click();
}
