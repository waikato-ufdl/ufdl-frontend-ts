import {immediateObservable} from "../util/rx/immediate";
import {readFile} from "../util/files";
import {BehaviorSubject, of} from "rxjs";
import {toBlob} from "../util/toBlob";

export function fromFile(file: File): BehaviorSubject<Blob> {
    const src = immediateObservable(
        readFile(file).then((value) => {
            if (value === null) {
                console.log(`Couldn't read file ${file}!`);
                value = new Uint8Array();
            }

            return of(toBlob(value));
        })
    );

    const subject = new BehaviorSubject(toBlob(new Uint8Array()));

    src.subscribe(subject);

    return subject;
}