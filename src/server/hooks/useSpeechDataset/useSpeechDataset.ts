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

async function setAnnotations(
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
        setAnnotations,
        SpeechDatasetDispatchItem,
        SpeechDatasetDispatch,
        datasetPK,
        queryDependencies
    )
}
