import {DataStream} from "ufdl-ts-client/types/base";
import withPromiseParameters, {PromiseParameters} from "../util/typescript/async/withPromiseParameters";
import {blobSubject, BlobSubject} from "../util/rx/data/BlobSubject";
import {dataStreamSubject} from "../util/rx/data/DataStreamSubject";
import {immediateBehaviourSubject} from "../util/rx/immediate";

/**
 * Converts the actions that download data from the server into
 * functions which return blob-subjects.
 *
 * @param action
 *          The action.
 * @return
 *          A function which returns a blob-subject.
 */
export default function forDownload<P extends unknown[]>(
    action: (...args: P) => Promise<DataStream>
): (...args: PromiseParameters<P>) => BlobSubject {
    return (...args) => {
        const dataStream = withPromiseParameters(action)(...args);
        const dsSubject = withPromiseParameters(dataStreamSubject)(dataStream);
        const subjectImmediate = immediateBehaviourSubject(dsSubject, new Uint8Array());
        return blobSubject(subjectImmediate);
    }
}
