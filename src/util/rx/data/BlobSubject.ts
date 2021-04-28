import {BehaviorSubject} from "rxjs";
import behaviourSubjectOperatorFunction from "../behaviourSubjectOperatorFunction";
import {map} from "rxjs/operators";
import toBlob from "../../typescript/data/toBlob";

export type BlobSubject = BehaviorSubject<Blob>

export const blobSubject = behaviourSubjectOperatorFunction(map(toBlob as (arr: Uint8Array) => Blob))
