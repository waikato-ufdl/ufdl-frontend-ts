import useDataset from "../useDataset/useDataset";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {InTransit} from "../../InTransit";
import {DatasetPK} from "../../pk";
import {Audio} from "../../types/data";
import * as SPDataset from "ufdl-ts-client/functional/speech/dataset";
import SpeechDatasetDispatch, {SpeechDatasetDispatchItem} from "./SpeechDatasetDispatch";
import {NO_ANNOTATION, Transcription} from "../../types/annotations";
import {BlobSubject} from "../../../util/rx/data/BlobSubject";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {forEachOwnProperty} from "../../../util/typescript/object";
import {ParallelSubTasks, subTasksAsTask, taskFromPromise} from "../../../util/typescript/task/Task";
import {identity} from "../../../util/identity";


async function getData(
    _context: UFDLServerContext,
    _dataset: DatasetInstance,
    _filename: string,
    rawData: BlobSubject
): Promise<InTransit<Audio>> {

    return InTransit.fromBehaviourSubject(rawData).map(
        value => new Audio(value)
    )
}

function setData(
    _context: UFDLServerContext,
    _dataset: DatasetInstance,
    _filename: string,
    _data: Audio
) {
    // No additional work required
}

async function getAnnotations(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string
): Promise<Transcription | typeof NO_ANNOTATION> {
    const transcription = (await SPDataset.get_transcriptions_for_file(context, dataset.pk, filename)).transcription

    if (transcription === undefined || transcription === "") return NO_ANNOTATION

    return transcription
}

/*
TODO: Implement when server-side support is available
function setAnnotationsBulk(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    annotations: { [filename: string]: Transcription | typeof NO_ANNOTATION }
) {
    const categories: Parameters<typeof SPDataset.set_categories>[2] = {}

    forEachOwnProperty(
        annotations,
        (filename, annotation) => {
            categories[filename] = annotation === NO_ANNOTATION ? [] : [annotation]
        }
    )

    return taskFromPromise(
        ICDataset.set_categories(
            context,
            dataset.pk,
            categories
        )
    )
}
*/

function setAnnotationsOneByOne(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    annotations: { [filename: string]: Transcription | typeof NO_ANNOTATION }
) {
    const subTasks: ParallelSubTasks<string, void, string> = {}
    const keys: string[] = []

    forEachOwnProperty(
        annotations,
        (filename, annotation) => {
            keys.push(filename as string)
            subTasks[filename] = taskFromPromise(
                setAnnotationForFile(
                    context,
                    dataset,
                    filename as string,
                    annotation
                )
            )
        }
    )

    return subTasksAsTask(
        subTasks,
        keys,
        identity
    )
}

async function setAnnotationForFile(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    annotations: Transcription | typeof NO_ANNOTATION
) {
    await SPDataset.set_transcriptions_for_file(
        context,
        dataset.pk,
        filename,
        annotations === NO_ANNOTATION ? "" : annotations
    )
}

export default function useSpeechDataset(
    serverContext: UFDLServerContext,
    datasetPK?: DatasetPK,
    queryDependencies?: readonly unknown[]
): SpeechDatasetDispatch | undefined {
    return useDataset(
        serverContext,
        getData,
        setData,
        getAnnotations,
        setAnnotationsOneByOne,
        SpeechDatasetDispatchItem,
        SpeechDatasetDispatch,
        datasetPK,
        queryDependencies
    )
}
