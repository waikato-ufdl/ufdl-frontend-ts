import React, {Dispatch, useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import {
    AnnotatorTopMenuExtraControlsRenderer,
    ItemSelectFragmentRenderer
} from "../../../../server/components/AnnotatorTopMenu";
import {mapAny, mapMap} from "../../../../util/map";
import useImageClassificationDataset
    from "../../../../server/hooks/useImageClassificationDataset/useImageClassificationDataset";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import "./ImageClassificationAnnotatorPage.css";
import {AnyPK, DatasetPK, getDatasetPK, getProjectPK, ProjectPK} from "../../../../server/pk";
import ImageClassificationDatasetDispatch
    from "../../../../server/hooks/useImageClassificationDataset/ImageClassificationDatasetDispatch";
import {Classification, NO_ANNOTATION, OptionalAnnotations} from "../../../../server/types/annotations";
import {ClassColour, ClassColours, storeColoursInContext} from "../../../../server/util/classification";
import useClassColours from "../../../../server/hooks/useClassColours";
import ClassColourPickerPage from "../../ClassColourPickerPage";
import {IC_SELECTIONS} from "../../../../server/hooks/useImageClassificationDataset/selection";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import {Image} from "../../../../server/types/data";
import {DEFAULT, WithDefault} from "../../../../util/typescript/default";
import {BY_FILENAME, BY_HASH} from "../../../../server/sorting";
import {BY_CLASSIFICATION} from "../../../../server/components/classification/sorting";
import createFileClassificationModalRenderer
    from "../../../../server/components/classification/createClassificationModalRenderer";
import createClassificationComponent from "../../../../server/components/classification/createClassificationComponent";
import useLocalModal from "../../../../util/react/hooks/useLocalModal";
import LocalModal from "../../../../util/react/component/LocalModal";
import PickClassForm from "../../../../server/components/classification/PickClassForm";
import ClassSelect from "../../../../server/components/classification/ClassSelect";
import getPathFromFile from "../../../../util/files/getPathFromFile";
import {addFilesRenderer} from "../../../../server/components/AddFilesButton";
import AnnotatorPage from "../AnnotatorPage";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import isDefined from "../../../../util/typescript/isDefined";
import {DatasetDispatch} from "../../../../server/hooks/useDataset/DatasetDispatch";
import hasData from "../../../../util/react/query/hasData";
import passOnUndefined from "../../../../util/typescript/functions/passOnUndefined";
import {DatasetDispatchItemAnnotationType} from "../../../../server/hooks/useDataset/types";
import {ImageOrVideoRenderer} from "../../../../server/components/image/ImageOrVideoRenderer";
import {Controllable, useControllableState} from "../../../../util/react/hooks/useControllableState";
import {DatasetSelect} from "../../../../server/components/DatasetSelect";

export const SORT_ORDERS = {
    "filename": BY_FILENAME,
    "label": BY_CLASSIFICATION,
    "random": BY_HASH
} as const

export type ICAPProps = {
    lockedPK?: AnyPK,
    evalPK: Controllable<DatasetPK | undefined>,
    initialColours?: ClassColours
    nextLabel: WithDefault<string>
    onNext?: (
        selectedPK: AnyPK,
        dataset: ImageClassificationDatasetDispatch | undefined,
        labelColours: ClassColours,
        position: [number, number]
    ) => void
    onBack?: () => void,
    queryDependencies?: readonly unknown[],
    evalQueryDependencies?: readonly unknown[]
    mode?: typeof DEFAULT | "Single" | "Multi"
    selectedSortOrder: Controllable<WithDefault<string>>
    sortOrderLocked?: boolean
    heading?: string
}

export default function ImageClassificationAnnotatorPage(
    props: ICAPProps
) {
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [selectedPK, setSelectedPK] = useStateSafe(constantInitialiser(props.lockedPK))

    const [evalPK, setEvalPK, evalPKLocked] = useControllableState(
        props.evalPK,
        constantInitialiser(undefined)
    )

    const dataset = useImageClassificationDataset(
        ufdlServerContext,
        getDatasetPK(selectedPK),
        props.queryDependencies
    );

    const evalDataset = useImageClassificationDataset(
        ufdlServerContext,
        evalPK,
        props.evalQueryDependencies
    );

    const classColoursDispatch = useClassColours(dataset, props.initialColours);

    // Sub-page displays
    const [showLabelColourPickerPage, setShowLabelColourPickerPage] = useStateSafe<boolean>(() => false);

    const datasetOverviewOnReclassify = useDerivedState(
        ([setAnnotationsForFile]) => (
            filename: string,
            _: OptionalAnnotations<Classification> | undefined,
            newLabel: OptionalAnnotations<Classification>
        ) => {
            if (isDefined(setAnnotationsForFile)) setAnnotationsForFile(filename, newLabel);
        },
        [dataset?.setAnnotationsForFile]
    )

    const classColourPickerPageOnColourChanged = useDerivedState(
        () => (changedLabel: string, _: ClassColour, newColour: ClassColour) => {
            const colourInUse = (label: string, colour: ClassColour) =>
                label !== changedLabel && colour === newColour;

            if (mapAny(classColoursDispatch.state, colourInUse)) {
                return;
            }

            classColoursDispatch.set(changedLabel, newColour);
        },
        [classColoursDispatch]
    )

    const classColourPickerPageOnNewClass = useDerivedState(
        () => (classification: string) => classColoursDispatch.add(classification),
        [classColoursDispatch]
    )

    const classColourPickerPageOnClassDeleted = useDerivedState(
        ([classColours, dataset]) => (classification: string) => {
            classColours.delete(classification);
            if (isDefined(dataset))
                dataset.setAnnotations(
                    mapMap(
                        dataset,
                        (filename, item) => {
                            if (item.annotations.isSuccess && item.annotations.data === classification)
                                return [[filename, NO_ANNOTATION]]
                            else
                                return []
                        }
                    )
                )
        },
        [classColoursDispatch, dataset] as const
    )

    const classColourPickerPageOnBack = useDerivedState(
        () => () => {
            storeColoursInContext(classColoursDispatch.state, ufdlServerContext);
            setShowLabelColourPickerPage(false)
        },
        [classColoursDispatch, ufdlServerContext, setShowLabelColourPickerPage]
    )

    const itemSelectFragmentRenderer = useDerivedState(
        ([classColours, evalDataset]) => createImageClassificationSelectFragmentRenderer(
            classColours,
            evalDataset
        ),
        [classColoursDispatch.state, evalDataset] as const
    )

    const extraControls = useDerivedState(
        () => createImageClassificationExtraControlsRenderer(
            dataset?.setAnnotationsForSelected?.bind(dataset),
            classColoursDispatch.state,
            () => setShowLabelColourPickerPage(true),
            getProjectPK(selectedPK),
            evalPK,
            setEvalPK,
            evalPKLocked
        ),
        [dataset, classColoursDispatch.state, setShowLabelColourPickerPage, selectedPK, evalPK, setEvalPK, evalPKLocked]
    )

    const filesClassificationModalRenderer = useDerivedState(
        ([classColours]) =>
            createFileClassificationModalRenderer(classColours, imageFromFile),
        [classColoursDispatch.state]
    )

    const [folderClassificationModalRenderer] = useStateSafe(
        () => addFilesRenderer(
            "folder",
            imageFromFile,
            (file) => {
                const pathElements = getPathFromFile(file);

                return pathElements.length > 1 ?
                    pathElements[pathElements.length - 2] :
                    NO_ANNOTATION;
            }
        )
    )

    const ClassificationComponent = useDerivedState(
        ([classColours, datasetOverviewOnReclassify]) =>
            createClassificationComponent(classColours, datasetOverviewOnReclassify),
        [classColoursDispatch.state, datasetOverviewOnReclassify] as const
    )

    const addFilesSubMenus = useDerivedState(
        ([filesClassificationModalRenderer, folderClassificationModalRenderer]) => {
            return {
                files: filesClassificationModalRenderer,
                folders: folderClassificationModalRenderer
            }
        },
        [filesClassificationModalRenderer, folderClassificationModalRenderer] as const
    )

    const onNext = useDerivedState(
        ([onNext, dataset, colours]) => {
            return (selectedPK: AnyPK, position: [number, number]) => passOnUndefined(onNext)(selectedPK, dataset, colours, position)
        },
        [props.onNext, dataset, classColoursDispatch.state] as const
    )

    if (showLabelColourPickerPage) {
        return <ClassColourPickerPage
            colours={classColoursDispatch.state}
            onColourChanged={classColourPickerPageOnColourChanged}
            onNewClass={classColourPickerPageOnNewClass}
            onClassDeleted={classColourPickerPageOnClassDeleted}
            onBack={classColourPickerPageOnBack}
        />
    }

    return <AnnotatorPage
        className={"ImageClassificationAnnotatorPage"}
        domain={"Image Classification"}
        nextLabel={props.nextLabel}
        sortOrders={SORT_ORDERS}
        selectedSortOrder={props.selectedSortOrder}
        sortOrderLocked={props.sortOrderLocked}
        DataComponent={ImageOrVideoRenderer}
        AnnotationComponent={ClassificationComponent}
        addFilesSubMenus={addFilesSubMenus}
        extraControls={extraControls}
        itemSelectFragmentRenderer={itemSelectFragmentRenderer}
        onSelectedPKChanged={setSelectedPK}
        selectedPK={selectedPK}
        dataset={dataset}
        evalDataset={evalDataset}
        lockedPK={props.lockedPK}
        onBack={props.onBack}
        onNext={onNext}
        mode={props.mode}
        heading={props.heading}
    />
}

function createImageClassificationExtraControlsRenderer(
    onRelabelSelected: ((label: OptionalAnnotations<Classification>) => void) | undefined,
    colours: ClassColours,
    onRequestLabelColourPickerOverlay: (() => void) | undefined,
    projectPK: ProjectPK | undefined,
    evalPK: Controllable<DatasetPK | undefined>,
    setEvalPK: Dispatch<DatasetPK | undefined>,
    evalPKLocked: boolean
): AnnotatorTopMenuExtraControlsRenderer {
    return () => {

        const labelModal = useLocalModal();

        return [
            <>
                <button
                    onClick={labelModal.onClick}
                    disabled={onRelabelSelected === undefined}
                >
                    Relabel
                </button>

                <LocalModal
                    position={labelModal.position}
                    onCancel={labelModal.hide}
                >
                    <PickClassForm
                        onSubmit={onRelabelSelected!}
                        colours={colours}
                        confirmText={"Relabel"}
                    />
                </LocalModal>

                <button
                    onClick={onRequestLabelColourPickerOverlay}
                    disabled={onRequestLabelColourPickerOverlay === undefined}
                >
                    Labels...
                </button>

                <label>
                    Eval Dataset:
                    <DatasetSelect
                        domain={"Image Classification"}
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

function extractClassificationForEval(
    annotation: DatasetDispatchItemAnnotationType<Classification>
): Classification | undefined {
    if (!hasData(annotation)) return undefined

    const classification = annotation.data

    if (classification === NO_ANNOTATION) return undefined

    return classification
}

function createImageClassificationSelectFragmentRenderer(
    classColours: ClassColours,
    evalDataset: DatasetDispatch<Image, Classification> | undefined
): ItemSelectFragmentRenderer<Image, Classification> {
    return (select) => {
        return [
            <>
                <ClassSelect
                    onReclassify={(_, classification) => {
                        select(IC_SELECTIONS.withClassification(classification))
                    }}
                    colours={classColours}
                    allowSelectNone
                    noAnnotationLabel={"[NONE]"}
                />
                <button
                    disabled={evalDataset === undefined}
                    onClick={() => select(IC_SELECTIONS.correctForEval(evalDataset!, extractClassificationForEval))}
                >
                    Correct
                </button>
                <button
                    disabled={evalDataset === undefined}
                    onClick={() => select(IC_SELECTIONS.incorrectForEval(evalDataset!, extractClassificationForEval))}
                >
                    Incorrect
                </button>
            </>
        ]
    }
}

function imageFromFile(
    file: File
): Image {
    return new Image(
        file,
        undefined,
        undefined
    )
}
