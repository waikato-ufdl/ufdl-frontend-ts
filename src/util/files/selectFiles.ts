import {rendezvous} from "../typescript/async/rendezvous";

export type SelectFilesMethod = "folder" | "multiple" | "single"

export default async function selectFiles(method: "folder" | "multiple"): Promise<File[] | null>;
export default async function selectFiles(method: "single"): Promise<File | null>;
export default async function selectFiles(method: SelectFilesMethod): Promise<File[] | File | null>;

/**
 * Selects files from the user's file-system.
 *
 * @param method
 *          - "single" to select a single file
 *          - "multiple" to select multiple files by file
 *          - "folder" to select multiple files by folder
 * @return
 *          A promise of the files, or null if none were
 */
export default async function selectFiles(
    method: SelectFilesMethod
): Promise<File[] | File | null> {
    // Create a rendezvous between the file-selector and the resulting files
    const [promise, resolve, reject] = rendezvous<File[] | File | null>();

    // Create a dummy input element to host the file-selection dialog
    const inputElement: HTMLInputElement = document.createElement("input");
    inputElement.type = "file";

    // Alter the element to select files in the chosen fashion
    if (method === "folder")
        inputElement.setAttribute("webkitDirectory", "true");
    else
        inputElement.multiple = method === "multiple";

    // Create a change handler to resolve the rendezvous when the file/s are selected
    inputElement.onchange = () => {
        if (inputElement.files !== null) {
            if (method === "single") {
                if (inputElement.files.length !== 1)
                    return reject(["Single-file mode did not return exactly one file", inputElement.files])
                resolve(inputElement.files[0]);
            } else {
                resolve(new Array(...inputElement.files));
            }
        } else {
            resolve(null);
        }
    };

    // Initiate the file-selection dialog
    inputElement.click();

    return promise;
}
