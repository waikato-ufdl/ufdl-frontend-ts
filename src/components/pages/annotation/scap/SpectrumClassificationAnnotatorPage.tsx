import React, {Dispatch, useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import {
    AnnotatorTopMenuExtraControlsComponent,
    ItemSelectFragmentRenderer
} from "../../../../server/components/AnnotatorTopMenu";
import {mapAny, mapMap} from "../../../../util/map";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import "./SpectrumClassificationAnnotatorPage.css";
import {AnyPK, DatasetPK, getDatasetPK, getProjectPK, ProjectPK} from "../../../../server/pk";
import {NO_ANNOTATION} from "../../../../server/NO_ANNOTATION";
import {OptionalAnnotations} from "../../../../server/types/annotations/OptionalAnnotations";
import {Classification} from "../../../../server/types/annotations/Classification";
import {ClassColour, ClassColours, storeColoursInContext} from "../../../../server/util/classification";
import useClassColours from "../../../../server/hooks/useClassColours";
import ClassColourPickerPage from "../../ClassColourPickerPage";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
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
import {
    DatasetDispatchItemAnnotationType,
    DatasetDispatchItemDataType
} from "../../../../server/hooks/useDataset/types";
import {Controllable, useControllableState} from "../../../../util/react/hooks/useControllableState";
import {DatasetSelect} from "../../../../server/components/DatasetSelect";
import {FunctionComponentReturnType} from "../../../../util/react/types/FunctionComponentReturnType";
import SpectrumClassificationDatasetDispatch
    from "../../../../server/hooks/useSpectrumClassificationDataset/SpectrumClassificationDatasetDispatch";
import useSpectrumClassificationDataset
    from "../../../../server/hooks/useSpectrumClassificationDataset/useSpectrumClassificationDataset";
import {Spectrum} from "../../../../server/types/data";
import {IC_SELECTIONS} from "../../../../server/hooks/useImageClassificationDataset/selection";
import {DataComponent} from "../../../../server/components/dataset/types";
import {augmentClassName} from "../../../../util/react/augmentClass";
import "./SpectrumClassificationAnnotatorPage.css"

export const SORT_ORDERS = {
    "filename": BY_FILENAME,
    "label": BY_CLASSIFICATION,
    "random": BY_HASH
} as const

export type SCAPProps = {
    lockedPK?: AnyPK,
    evalPK: Controllable<DatasetPK | undefined>,
    initialColours?: ClassColours
    nextLabel: WithDefault<string>
    onNext?: (
        selectedPK: AnyPK,
        dataset: SpectrumClassificationDatasetDispatch | undefined,
        labelColours: ClassColours,
        position: [number, number]
    ) => void
    onBack?: () => void,
    queryDependencies?: {
        dataset?: readonly unknown[]
        fileData?: readonly unknown[]
        annotations?: readonly unknown[]
        onlyFetched?: boolean
    }
    evalQueryDependencies?: {
        dataset?: readonly unknown[]
        fileData?: readonly unknown[]
        annotations?: readonly unknown[]
        onlyFetched?: boolean
    }
    mode?: typeof DEFAULT | "Single" | "Multi"
    selectedSortOrder: Controllable<WithDefault<string>>
    sortOrderLocked?: boolean
    heading?: string
    ExtraControls?: AnnotatorTopMenuExtraControlsComponent
}

export default function SpectrumClassificationAnnotatorPage(
    props: SCAPProps
) {
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [selectedPK, setSelectedPK] = useStateSafe(constantInitialiser(props.lockedPK))

    const [evalPK, setEvalPK, evalPKLocked] = useControllableState(
        props.evalPK,
        constantInitialiser(undefined)
    )

    const dataset = useSpectrumClassificationDataset(
        ufdlServerContext,
        getDatasetPK(selectedPK),
        props.queryDependencies
    );

    const evalDataset = useSpectrumClassificationDataset(
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
        ([classColours, evalDataset]) => createSpectrumClassificationSelectFragmentRenderer(
            classColours,
            evalDataset
        ),
        [classColoursDispatch.state, evalDataset] as const
    )

    const ExtraControls = useDerivedState(
        ([dataset, colours, setShowLabelColourPickerPage, selectedPK, evalPK, setEvalPK, evalPKLocked, ExtraControls]) =>
            () => <>
                <SpectrumClassificationExtraControls
                    onRelabelSelected={dataset?.setAnnotationsForSelected?.bind(dataset)}
                    colours={colours}
                    onRequestLabelColourPickerOverlay={() => setShowLabelColourPickerPage(true)}
                    projectPK={getProjectPK(selectedPK)}
                    evalPK={evalPK}
                    setEvalPK={setEvalPK}
                    evalPKLocked={evalPKLocked}
                />
                {ExtraControls && <ExtraControls />}
            </>,
        [dataset, classColoursDispatch.state, setShowLabelColourPickerPage, selectedPK, evalPK, setEvalPK, evalPKLocked, props.ExtraControls] as const
    )

    const filesClassificationModalRenderer = useDerivedState(
        ([classColours]) =>
            createFileClassificationModalRenderer(classColours, file => new Spectrum(file)),
        [classColoursDispatch.state]
    )

    const [folderClassificationModalRenderer] = useStateSafe(
        () => addFilesRenderer(
            "folder",
            file => new Spectrum(file),
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
        className={"SpectrumClassificationAnnotatorPage"}
        domain={"Spectrum Classification"}
        nextLabel={props.nextLabel}
        sortOrders={SORT_ORDERS}
        selectedSortOrder={props.selectedSortOrder}
        sortOrderLocked={props.sortOrderLocked}
        DataComponent={SpectrumComponent}
        AnnotationComponent={ClassificationComponent}
        addFilesSubMenus={addFilesSubMenus}
        ExtraControls={ExtraControls}
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

const SpectrumComponent: DataComponent<DatasetDispatchItemDataType<Spectrum>> = (props) => {
    return <div className={augmentClassName(props.className, "SpectrumComponent")}>
        {props.filename}
    </div>
}

function SpectrumClassificationExtraControls(
    props: {
        onRelabelSelected: ((label: OptionalAnnotations<Classification>) => void) | undefined,
        colours: ClassColours,
        onRequestLabelColourPickerOverlay: (() => void) | undefined,
        projectPK: ProjectPK | undefined,
        evalPK: Controllable<DatasetPK | undefined>,
        setEvalPK: Dispatch<DatasetPK | undefined>,
        evalPKLocked: boolean
    }
): FunctionComponentReturnType {
    const labelModal = useLocalModal();

    return <>
        <button
            onClick={labelModal.onClick}
            disabled={props.onRelabelSelected === undefined}
        >
            Relabel
        </button>

        <LocalModal
            position={labelModal.position}
            onCancel={labelModal.hide}
        >
            <PickClassForm
                onSubmit={props.onRelabelSelected!}
                colours={props.colours}
                confirmText={"Relabel"}
            />
        </LocalModal>

        <button
            onClick={props.onRequestLabelColourPickerOverlay}
            disabled={props.onRequestLabelColourPickerOverlay === undefined}
        >
            Labels...
        </button>

        <label>
            Eval Dataset:
            <DatasetSelect
                domain={"Spectrum Classification"}
                projectPK={props.projectPK}
                value={props.evalPK}
                onChanged={props.setEvalPK}
                disabled={props.evalPKLocked}
            />
        </label>
    </>
}

function extractClassificationForEval(
    annotation: DatasetDispatchItemAnnotationType<Classification>
): Classification | undefined {
    if (!hasData(annotation)) return undefined

    const classification = annotation.data

    if (classification === NO_ANNOTATION) return undefined

    return classification
}

function createSpectrumClassificationSelectFragmentRenderer(
    classColours: ClassColours,
    evalDataset: DatasetDispatch<Spectrum, Classification> | undefined
): ItemSelectFragmentRenderer<Spectrum, Classification> {
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