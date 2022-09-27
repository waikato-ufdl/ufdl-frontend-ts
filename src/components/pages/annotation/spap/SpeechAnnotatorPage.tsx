import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import {
    AnnotatorTopMenuExtraControlsRenderer,
    ItemSelectFragmentRenderer
} from "../../../../server/components/AnnotatorTopMenu";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import {AnyPK, DatasetPK, getDatasetPK} from "../../../../server/pk";
import {NO_ANNOTATION, Transcription} from "../../../../server/types/annotations";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import {DatasetItem} from "../../../../server/types/DatasetItem";
import {Audio} from "../../../../server/types/data";
import {DEFAULT, WithDefault} from "../../../../util/typescript/default";
import {addFilesRenderer} from "../../../../server/components/AddFilesButton";
import AnnotatorPage from "../AnnotatorPage";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import passOnUndefined from "../../../../util/typescript/functions/passOnUndefined";
import "./SpeechAnnotatorPage.css"
import {AnnotationRenderer} from "../../../../server/components/DatasetItem";
import {DatasetDispatchItemAnnotationType} from "../../../../server/hooks/useDataset/types";
import {Absent, Possible} from "../../../../util/typescript/types/Possible";
import SpeechDatasetDispatch from "../../../../server/hooks/useSpeechDataset/SpeechDatasetDispatch";
import useSpeechDataset from "../../../../server/hooks/useSpeechDataset/useSpeechDataset";
import {AudioRenderer} from "../../../../server/components/audio/AudioRenderer";
import hasData from "../../../../util/react/query/hasData";
import MinimumEditDistance from "./MinimumEditDistance";

export type SPAPProps = {
    lockedPK?: AnyPK,
    evalPK?: DatasetPK,
    nextLabel: WithDefault<string>
    onNext?: (
        selectedPK: AnyPK,
        dataset: SpeechDatasetDispatch | undefined,
        position: [number, number]
    ) => void
    onBack?: () => void,
    queryDependencies?: readonly unknown[],
    evalQueryDependencies?: readonly unknown[]
}

export default function SpeechAnnotatorPage(
    props: SPAPProps
) {
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [selectedPK, setSelectedPK] = useStateSafe(constantInitialiser(props.lockedPK))

    const dataset = useSpeechDataset(
        ufdlServerContext,
        getDatasetPK(selectedPK),
        props.queryDependencies
    );

    const evalDataset = useSpeechDataset(
        ufdlServerContext,
        props.evalPK,
        props.evalQueryDependencies
    );

    // Sub-page displays
    const [annotating, setAnnotating] = useStateSafe<string | undefined>(() => undefined);

    const imagesDisplayOnFileClicked = useDerivedState(
        () => (item: DatasetItem<unknown, unknown>) => {
            setAnnotating(item.filename)
        },
        [setAnnotating]
    )

    const [itemSelectFragmentRenderer] = useStateSafe(createSpeechSelectFragmentRenderer)

    const [extraControls] = useStateSafe(createObjectDetectionExtraControlsRenderer)

    const [filesDetectedObjectsModalRenderer] = useStateSafe(
        () => addFilesRenderer<Audio, Transcription>(
            "multiple",
            (file) => audioFromFile(file),
            () => NO_ANNOTATION
        )
    )

    const [folderDetectedObjectsModalRenderer] = useStateSafe(
        () => addFilesRenderer<Audio, Transcription>(
            "folder",
            async (file) => audioFromFile(file),
            () => NO_ANNOTATION
        )
    )

    const transcriptionRenderer: AnnotationRenderer<DatasetDispatchItemAnnotationType<Transcription>> = useDerivedState(
        () => {
            return (
                _filename: string,
                _selected: boolean,
                annotation: DatasetDispatchItemAnnotationType<Transcription>,
                evalAnnotation: Possible<DatasetDispatchItemAnnotationType<Transcription>>
            ) => {
                if (hasData(annotation)) {
                    if (evalAnnotation !== Absent && hasData(evalAnnotation)) {
                        const targetString = evalAnnotation.data === NO_ANNOTATION?
                            ""
                            : evalAnnotation.data
                        const startingString = annotation.data === NO_ANNOTATION?
                            ""
                            : annotation.data
                        return <MinimumEditDistance targetString={targetString} startingString={startingString}/>
                    }

                    return <>{annotation.data}</>
                }
                return <>...</>
            }
        },
        []
    )

    return <AnnotatorPage
        className={"SpeechAnnotatorPage"}
        domain={"Speech"}
        nextLabel={props.nextLabel}
        sortOrders={DEFAULT}
        renderData={AudioRenderer}
        renderAnnotation={transcriptionRenderer}
        onItemClicked={imagesDisplayOnFileClicked}
        addFilesSubMenus={{
            files: filesDetectedObjectsModalRenderer,
            folders: folderDetectedObjectsModalRenderer
        }}
        extraControls={extraControls}
        itemSelectFragmentRenderer={itemSelectFragmentRenderer}
        onSelectedPKChanged={setSelectedPK}
        selectedPK={selectedPK}
        dataset={dataset}
        evalDataset={evalDataset}
        lockedPK={props.lockedPK}
        onBack={props.onBack}
        onNext={(selectedPK, position) => passOnUndefined(props.onNext)(selectedPK, dataset, position)}
    />
}

function createObjectDetectionExtraControlsRenderer(
    // No parameters
): AnnotatorTopMenuExtraControlsRenderer {
    return () => {
        return <></>
    }
}

function createSpeechSelectFragmentRenderer(
    // No parameters
): ItemSelectFragmentRenderer<Audio, Transcription> {
    return () => {
        return <></>
    }
}


async function audioFromFile(
    file: Blob
): Promise<Audio> {
    return new Audio(file)
}