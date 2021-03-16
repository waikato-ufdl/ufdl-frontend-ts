import {Observable} from "rxjs";
import {rendezvous} from "./typescript/async/rendezvous";

export function selectFiles(multiple: true): Promise<File[] | null>;
export function selectFiles(multiple: false): Promise<File | null>;
export async function selectFiles(
    multiple: boolean
): Promise<File[] | File | null> {
    const [promise, resolve] = rendezvous<File[] | File | null>();

    const inputElement: HTMLInputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.multiple = multiple === undefined ? true : multiple;

    inputElement.onchange = (_) => {
        if (inputElement.files !== null) {
            if (!multiple) {
                if (inputElement.files.length === 1)
                    resolve(inputElement.files[0]);
                else
                    resolve(null);
            } else {
                resolve(new Array(...inputElement.files));
            }
        } else {
            resolve(null);
        }
    };

    inputElement.click();

    return promise;
}

export async function selectFolders(
    // No parameters
): Promise<File[] | null> {
    const [promise, resolve] = rendezvous<File[] | null>();

    const inputElement: HTMLInputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.setAttribute("webkitDirectory", "true");

    inputElement.onchange = (_) => {
        if (inputElement.files !== null) {
            resolve(new Array(...inputElement.files));
        } else {
            resolve(null);
        }
    };

    inputElement.click();

    return promise;
}

export function readFiles(
    readData: boolean = true,
    multiple: boolean = true
): Observable<[File, ArrayBuffer | null]> | null {
    return new Observable<[File, (ArrayBuffer|null)]>((subscriber) => {
        const inputElement: HTMLInputElement = document.createElement("input");
        inputElement.type = "file";
        inputElement.multiple = multiple;

        inputElement.onchange = async (_) => {
            const files = inputElement.files;

            if (files === null) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                let data: ArrayBuffer | null = null;
                if (readData) data = await readFile(file);

                subscriber.next([file, data]);
            }
        };

        inputElement.click();

        subscriber.complete();
    });
}

export async function readFile(
    file: File
): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (_) => {
            if (reader.error !== null)
                reject(reader.error);
            else if (reader.result instanceof String) {
                reject(new Error("Reader read string instead of ArrayBuffer"));
            } else if (reader.result === null) {
                resolve(null);
            } else {
                resolve(new Uint8Array(reader.result as ArrayBuffer));
            }
        };

        reader.readAsArrayBuffer(file);
    });
}

export function getPathFromFile(file: File): string[] {
    const fileObject = file as any;

    if (!("webkitRelativePath" in fileObject)) return [];

    const relativePath = fileObject.webkitRelativePath as string;

    return relativePath.split("/");
}
