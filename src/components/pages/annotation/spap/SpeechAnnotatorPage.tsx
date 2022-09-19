import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import {
    AnnotatorTopMenuExtraControlsRenderer,
    ItemSelectFragmentRenderer
} from "../../../../server/components/AnnotatorTopMenu";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import {AnyPK, getDatasetPK} from "../../../../server/pk";
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
import {Possible} from "../../../../util/typescript/types/Possible";
import SpeechDatasetDispatch from "../../../../server/hooks/useSpeechDataset/SpeechDatasetDispatch";
import useSpeechDataset from "../../../../server/hooks/useSpeechDataset/useSpeechDataset";
import {AudioRenderer} from "../../../../server/components/audio/AudioRenderer";
import hasData from "../../../../util/react/query/hasData";

export type SPAPProps = {
    lockedPK?: AnyPK,
    nextLabel: WithDefault<string>
    onNext?: (
        selectedPK: AnyPK,
        dataset: SpeechDatasetDispatch | undefined,
        position: [number, number]
    ) => void
    onBack?: () => void
}

export default function SpeechAnnotatorPage(
    props: SPAPProps
) {
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [selectedPK, setSelectedPK] = useStateSafe(constantInitialiser(props.lockedPK))

    const dataset = useSpeechDataset(
        ufdlServerContext,
        getDatasetPK(selectedPK)
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
                _evalAnnotation: Possible<DatasetDispatchItemAnnotationType<Transcription>>
            ) => {
                if (hasData(annotation))
                    return <>{annotation.data}</>

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
        evalDataset={undefined} // TODO: Implement eval datasets
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