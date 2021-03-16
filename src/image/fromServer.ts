import {BehaviorSubject} from "rxjs";
import {get_file} from "ufdl-js-client/functional/core/dataset";
import {map} from "rxjs/operators";
import {toBlob} from "../util/toBlob";
import {immediateBehaviourSubject} from "../util/rx/immediate";
import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import {DataStreamSubject, dataStreamSubject} from "../util/rx/dataStream";
import behaviourSubjectOperatorFunction from "../util/rx/behaviourSubjectOperatorFunction";

export function fromServer(
    context: UFDLServerContext,
    dataset: number,
    filename: string
): BehaviorSubject<Blob> {
    const fileStreamPromise: Promise<DataStreamSubject>
        = get_file(context, dataset, filename).then(dataStreamSubject);

    const fileStream: DataStreamSubject
        = immediateBehaviourSubject(fileStreamPromise, new Uint8Array());

    return behaviourSubjectOperatorFunction(
        map(toBlob as (arr: Uint8Array) => Blob)
    )(
        fileStream
    );
}
