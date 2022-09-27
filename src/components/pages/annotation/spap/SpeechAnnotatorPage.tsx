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
import {Controllable, mapControllable, useControllableState} from "../../../../util/react/hooks/useControllableState";
import {ListSelect} from "../../../ListSelect";
import {DatasetInstance} from "../../../../../../ufdl-ts-client/dist/types/core/dataset";
import {DOMAIN_DATASET_METHODS, DomainName} from "../../../../server/domains";
import nameFromSignature from "../../../../server/util/nameFromSignature";
import {exactFilter} from "../../../../server/util/exactFilter";

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

    // Sub-page displays
    const [annotating, setAnnotating] = useStateSafe<string | undefined>(() => undefined);

    const imagesDisplayOnFileClicked = useDerivedState(
        () => (item: DatasetItem<unknown, unknown>) => {
            setAnnotating(item.filename)
        },
        [setAnnotating]
    )

    const [itemSelectFragmentRenderer] = useStateSafe(createSpeechSelectFragmentRenderer)

    const extraControls = useDerivedState(
        ([selectedPK, evalPK, setEvalPK, evalPKLocked]) => createSpeechExtraControlsRenderer(
            "Speech",
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

function createSpeechExtraControlsRenderer(
    domain: DomainName,
    projectPK: ProjectPK | undefined,
    evalPK: Controllable<DatasetPK | undefined>,
    setEvalPK: Dispatch<DatasetPK | undefined>,
    evalPKLocked: boolean
    // No parameters
): AnnotatorTopMenuExtraControlsRenderer {
    return () => {
        return <>
            <label>
                Eval Dataset:
                <ListSelect<DatasetInstance>
                    list={DOMAIN_DATASET_METHODS[domain].list}
                    labelFunction={nameFromSignature}
                    onChange={(_, pk) => setEvalPK(projectPK!.dataset(pk))}
                    filter={projectPK === undefined ? undefined : exactFilter("project", projectPK.asNumber)}
                    forceEmpty={projectPK === undefined}
                    value={mapControllable(evalPK, pk => pk?.asNumber ?? -1)}
                    disabled={evalPKLocked}
                />
            </label>
        </>
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