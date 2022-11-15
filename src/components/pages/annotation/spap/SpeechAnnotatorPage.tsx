import React, {Dispatch, useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import {
    AnnotatorTopMenuExtraControlsRenderer,
    ItemSelectFragmentRenderer
} from "../../../../server/components/AnnotatorTopMenu";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import {AnyPK, DatasetPK, getDatasetPK, getProjectPK, ProjectPK} from "../../../../server/pk";
import {NO_ANNOTATION, Transcription} from "../../../../server/types/annotations";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import {Audio} from "../../../../server/types/data";
import {DEFAULT, WithDefault} from "../../../../util/typescript/default";
import {addFilesRenderer} from "../../../../server/components/AddFilesButton";
import AnnotatorPage from "../AnnotatorPage";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import passOnUndefined from "../../../../util/typescript/functions/passOnUndefined";
import "./SpeechAnnotatorPage.css"
import {AnnotationComponent} from "../../../../server/components/dataset/types";
import {DatasetDispatchItemAnnotationType} from "../../../../server/hooks/useDataset/types";
import {Absent} from "../../../../util/typescript/types/Possible";
import SpeechDatasetDispatch from "../../../../server/hooks/useSpeechDataset/SpeechDatasetDispatch";
import useSpeechDataset from "../../../../server/hooks/useSpeechDataset/useSpeechDataset";
import {AudioRenderer} from "../../../../server/components/audio/AudioRenderer";
import hasData from "../../../../util/react/query/hasData";
import MinimumEditDistance from "./MinimumEditDistance";
import {Controllable, useControllableState} from "../../../../util/react/hooks/useControllableState";
import {DatasetSelect} from "../../../../server/components/DatasetSelect";

export type SPAPProps = {
    lockedPK?: AnyPK,
    evalPK: Controllable<DatasetPK | undefined>,
    nextLabel: WithDefault<string>
    onNext?: (
        selectedPK: AnyPK,
        dataset: SpeechDatasetDispatch | undefined,
        position: [number, number]
    ) => void
    onBack?: () => void,
    queryDependencies?: readonly unknown[],
    evalQueryDependencies?: readonly unknown[]
    selectedSortOrder: Controllable<WithDefault<string>>
    sortOrderLocked?: boolean
    heading?: string
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

    const [evalPK, setEvalPK, evalPKLocked] = useControllableState(
        props.evalPK,
        constantInitialiser(undefined)
    )

    const evalDataset = useSpeechDataset(
        ufdlServerContext,
        evalPK,
        props.evalQueryDependencies
    );

    const [itemSelectFragmentRenderer] = useStateSafe(createSpeechSelectFragmentRenderer)

    const extraControls = useDerivedState(
        ([selectedPK, evalPK, setEvalPK, evalPKLocked]) => createSpeechExtraControlsRenderer(
            getProjectPK(selectedPK),
            evalPK,
            setEvalPK,
            evalPKLocked
        ),
        [selectedPK, evalPK, setEvalPK, evalPKLocked] as const
    )

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

    // TODO: Extract to static component, as no dependencies
    const TranscriptionComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<Transcription>> = useDerivedState(
        () => {
            return (
                {
                    annotation,
                    comparisonAnnotation
                }
            ) => {
                if (hasData(annotation)) {
                    if (comparisonAnnotation !== Absent && hasData(comparisonAnnotation)) {
                        const targetString = comparisonAnnotation.data === NO_ANNOTATION?
                            ""
                            : comparisonAnnotation.data
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
        selectedSortOrder={props.selectedSortOrder}
        sortOrderLocked={props.sortOrderLocked}
        DataComponent={AudioRenderer}
        AnnotationComponent={TranscriptionComponent}
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
        heading={props.heading}
    />
}

function createSpeechExtraControlsRenderer(
    projectPK: ProjectPK | undefined,
    evalPK: Controllable<DatasetPK | undefined>,
    setEvalPK: Dispatch<DatasetPK | undefined>,
    evalPKLocked: boolean
    // No parameters
): AnnotatorTopMenuExtraControlsRenderer {
    return () => {
        return [
            <>
                <label>
                    Eval Dataset:
                    <DatasetSelect
                        domain={"Speech"}
                        projectPK={projectPK}
                        value={evalPK}
                        onChanged={setEvalPK}
                        disabled={evalPKLocked}
                    />
                </label>
            </>
        ]
    }
}

function createSpeechSelectFragmentRenderer(
    // No parameters
): ItemSelectFragmentRenderer<Audio, Transcription> {
    return () => {
        return [<></>]
    }
}


async function audioFromFile(
    file: Blob
): Promise<Audio> {
    return new Audio(file)
}