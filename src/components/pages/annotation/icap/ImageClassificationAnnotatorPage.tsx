import React, {MouseEventHandler, useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import Page from "../../Page";
import AnnotatorTopMenu, {
    AnnotatorTopMenuExtraControlsRenderer,
    ItemSelectFragmentRenderer
} from "../../../../server/components/AnnotatorTopMenu";
import {mapAny, mapMap} from "../../../../util/map";
import useImageClassificationDataset
    from "../../../../server/hooks/useImageClassificationDataset/useImageClassificationDataset";
import DataImage from "../../../../util/react/component/DataImage";
import {BehaviorSubject} from "rxjs";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import NewDatasetPage from "../../NewDatasetPage";
import "./ImageClassificationAnnotatorPage.css";
import {DatasetPK, getDatasetPK, getProjectPK, getTeamPK, ProjectPK, TeamPK} from "../../../../server/pk";
import useDerivedReducer from "../../../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../../../util/react/hooks/SimpleStateReducer";
import {UNCONTROLLED_KEEP} from "../../../../util/react/hooks/useControllableState";
import ImageClassificationDatasetDispatch
    from "../../../../server/hooks/useImageClassificationDataset/ImageClassificationDatasetDispatch";
import {IMAGE_CACHE_CONTEXT} from "../../../../App";
import {Classification, NO_CLASSIFICATION} from "../../../../server/types/annotations";
import {ClassColour, ClassColours, storeColoursInContext} from "../../../../server/util/classification";
import useClassColours from "../../../../server/hooks/useClassColours";
import ClassColourPickerPage from "../../ClassColourPickerPage";
import {IC_SELECTIONS} from "../../../../server/hooks/useImageClassificationDataset/selection";
import doAsync from "../../../../util/typescript/async/doAsync";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import {DatasetItem} from "../../../../server/types/DatasetItem";
import {Image} from "../../../../server/types/data";
import {WithDefault} from "../../../../util/typescript/default";
import {BY_FILENAME} from "../../../../server/sorting";
import {BY_CLASSIFICATION} from "../../../../server/components/classification/sorting";
import {ItemSelector} from "../../../../server/hooks/useDataset/selection";
import createFileClassificationModalRenderer
    from "../../../../server/components/classification/createClassificationModalRenderer";
import createClassificationRenderer from "../../../../server/components/classification/createClassificationRenderer";
import {ImageRenderer} from "../../../../server/components/image/ImageRenderer";
import DatasetOverview from "../../../../server/components/DatasetOverview";
import useLocalModal from "../../../../util/react/hooks/useLocalModal";
import LocalModal from "../../../../util/react/component/LocalModal";
import PickClassForm from "../../../../server/components/classification/PickClassForm";
import {Dataset} from "../../../../server/types/Dataset";
import ClassSelect from "../../../../server/components/classification/ClassSelect";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import iteratorMap from "../../../../util/typescript/iterate/map";

type AnyPK = DatasetPK | ProjectPK | TeamPK | undefined

export const SORT_ORDERS = {
    "filename": BY_FILENAME,
    "label": BY_CLASSIFICATION
} as const

const SELECTED_PK_REDUCER = createSimpleStateReducer<AnyPK>();

export type ICAPProps = {
    lockedPK?: AnyPK,
    evalPK?: DatasetPK,
    initialColours?: ClassColours
    nextLabel: WithDefault<string>
    onNext?: (
        selectedPK: AnyPK,
        dataset: ImageClassificationDatasetDispatch | undefined,
        labelColours: ClassColours,
        position: [number, number]
    ) => void
    onBack?: () => void
}

export default function ImageClassificationAnnotatorPage(
    props: ICAPProps
) {
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [selectedPK, setSelectedPK] = useDerivedReducer(
        SELECTED_PK_REDUCER,
        ([pk]) => pk,
        [props.lockedPK] as const
    );

    const dataset = useImageClassificationDataset(
        ufdlServerContext,
        IMAGE_CACHE_CONTEXT,
        getDatasetPK(selectedPK)
    );

    const evalDataset = useImageClassificationDataset(
        ufdlServerContext,
        IMAGE_CACHE_CONTEXT,
        props.evalPK
    );

    const classColoursDispatch = useClassColours(dataset?.items, props.initialColours);

    const [sortFunction, setSortFunction] = useStateSafe<typeof SORT_ORDERS[keyof typeof SORT_ORDERS]>(
        () => SORT_ORDERS.filename
    );

    // Sub-page displays
    const [showNewDatasetPage, setShowNewDatasetPage] = useStateSafe<boolean>(() => false);
    const [showLabelColourPickerPage, setShowLabelColourPickerPage] = useStateSafe<boolean>(() => false);
    const [showLargeImageOverlay, setShowLargeImageOverlay] = useStateSafe<BehaviorSubject<string> | string | undefined>(() => undefined);

    const ICDatasetOverviewOnReclassify = useDerivedState(
        () => (filename: string, _: Classification, newLabel: Classification) => {
            if (dataset !== undefined) dataset.setAnnotation(filename, newLabel);
        },
        [dataset]
    )

    const newDatasetPageOnCreate = useDerivedState(
        () => (pk: DatasetPK) => {setSelectedPK(pk); setShowNewDatasetPage(false)},
        [setSelectedPK, setShowNewDatasetPage]
    )

    const newDatasetPageOnBack = useDerivedState(
        () => () => setShowNewDatasetPage(false),
        [setShowNewDatasetPage]
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
        () => (classification: string) => {
            classColoursDispatch.delete(classification);
            if (dataset !== undefined) dataset.setAnnotations(
                mapMap(
                    dataset.items,
                    (filename, item) => item.annotations.success && item.annotations.value === classification
                        ? [[filename, NO_CLASSIFICATION]]
                        : []
                )
            )
        },
        [classColoursDispatch, dataset]
    )

    const classColourPickerPageOnBack = useDerivedState(
        () => () => {
            storeColoursInContext(classColoursDispatch.state, ufdlServerContext);
            setShowLabelColourPickerPage(false)
        },
        [classColoursDispatch, ufdlServerContext, setShowLabelColourPickerPage]
    )

    const largeImageOverlayOnClick: MouseEventHandler<HTMLImageElement> = useDerivedState(
        () => (event) => {
            setShowLargeImageOverlay(undefined);
            event.stopPropagation()
        },
        [setShowLargeImageOverlay]
    )

    const icapTopMenuOnTeamChanged = useDerivedState(
        () => (_: any, pk: number | undefined) => {
            setSelectedPK(pk === undefined ? undefined : new TeamPK(pk));
        },
        [setSelectedPK]
    )

    const icapTopMenuOnProjectChanged = useDerivedState(
        () => (_: any, pk: number | undefined) => {
            const teamPK = getTeamPK(selectedPK);
            setSelectedPK(pk === undefined ? teamPK : teamPK?.project(pk));
        },
        [selectedPK, setSelectedPK]
    )

    const imagesDisplayOnFileClicked = useDerivedState(
        () => (item: DatasetItem<Image, Classification>) => {
            const data = item.data.value?.cache?.getConverted(item.data.value.handle);
            if (data !== undefined) setShowLargeImageOverlay(data)
        },
        [setShowLargeImageOverlay]
    )

    const imagesDisplayOnFileSelected = useDerivedState(
        () => (item: DatasetItem<Image, Classification>) => {
            if (dataset !== undefined) dataset.toggleSelection(IC_SELECTIONS.isFile(item.filename))
        },
        [dataset]
    )

    const imagesDisplayOnAddFiles = useDerivedState(
        () => (files: ReadonlyMap<string, [Blob, Classification]>) => {
            if (dataset !== undefined) doAsync(() => dataset.addFiles(files))
        },
        [dataset]
    )

    const annotatorTopMenuOnSelect = useDerivedState(
        () => {
            if (dataset === undefined) return undefined;
            return (select: ItemSelector<Image, Classification>) => {
                dataset.selectOnly(select)
            }
        },
        [dataset]
    )

    const itemSelectFragmentRenderer = useDerivedState(
        () => createImageClassificationSelectFragmentRenderer(
            classColoursDispatch.state,
            evalDataset?.items
        ),
        [classColoursDispatch.state, evalDataset]
    )

    const extraControls = useDerivedState(
        () => createImageClassificationExtraControlsRenderer(
            dataset?.setAnnotationsForSelected?.bind(dataset),
            classColoursDispatch.state,
            () => setShowLabelColourPickerPage(true)
        ),
        [dataset, classColoursDispatch.state, setShowLabelColourPickerPage]
    )

    const fileClassificationModalRenderer = useDerivedState(
        createFileClassificationModalRenderer,
        [classColoursDispatch.state]
    )

    const classificationRenderer = useDerivedState(
        () => createClassificationRenderer(classColoursDispatch.state, ICDatasetOverviewOnReclassify),
        [classColoursDispatch.state, ICDatasetOverviewOnReclassify]
    )

    const annotatorTopMenuOnDatasetChanged = useDerivedState(
        () => (_: any, pk: number | undefined) => {
            const projectPK = getProjectPK(selectedPK);
            setSelectedPK(pk === undefined ? projectPK : projectPK?.dataset(pk));
        },
        [selectedPK, setSelectedPK]
    )

    const annotatorTopMenuOnRequestNewDataset = useDerivedState(
        () => () => setShowNewDatasetPage(true),
        [setShowNewDatasetPage]
    )

    const annotatorTopMenuOnNext = useDerivedState(
        () => (position: [number, number]) => {
            if (props.onNext !== undefined) props.onNext(selectedPK, dataset, classColoursDispatch.state, position)
        },
        [selectedPK, dataset, classColoursDispatch.state]
    )

    const annotatorTopMenuNumSelected = useDerivedState(
        () => dataset === undefined
            ? [0, 0] as const
            : [dataset.numSelected, dataset.items.size] as const,
        [dataset?.items]
    )

    const onExtractSelected = useDerivedState(
        () => dataset !== undefined
            ? async () => {
                const newDataset = await ICDataset.copy(
                    ufdlServerContext,
                    dataset!.pk.asNumber,
                    undefined,
                    Array(
                        ...iteratorMap(
                            dataset!.selected,
                            (value) => value[0]
                        )
                    )
                )

                setSelectedPK(dataset!.pk.project.dataset(newDataset.pk))
            }
            :undefined,
        [dataset]
    )

    if (showNewDatasetPage) {
        return <NewDatasetPage
            domain={"ic"} lockDomain
            licencePK={UNCONTROLLED_KEEP}
            isPublic={UNCONTROLLED_KEEP}
            from={selectedPK instanceof DatasetPK ? selectedPK.project : selectedPK}
            lockFrom={props.lockedPK === undefined ? undefined : props.lockedPK instanceof TeamPK ? "team" : "project"}
            onCreate={newDatasetPageOnCreate}
            onBack={newDatasetPageOnBack}
        />
    } else if (showLabelColourPickerPage) {
        return <ClassColourPickerPage
            colours={classColoursDispatch.state}
            onColourChanged={classColourPickerPageOnColourChanged}
            onNewClass={classColourPickerPageOnNewClass}
            onClassDeleted={classColourPickerPageOnClassDeleted}
            onBack={classColourPickerPageOnBack}
        />
    } else if (showLargeImageOverlay !== undefined) {
        return <DataImage
            src={showLargeImageOverlay}
            onClick={largeImageOverlayOnClick}
        />
    }

    return <Page className={"ImageClassificationAnnotatorPage"}>
        <AnnotatorTopMenu
            domain={"ic"}
            selectedPK={selectedPK}
            lockedPK={props.lockedPK}
            onTeamChanged={icapTopMenuOnTeamChanged}
            onProjectChanged={icapTopMenuOnProjectChanged}
            onDatasetChanged={annotatorTopMenuOnDatasetChanged}
            onRequestNewDataset={annotatorTopMenuOnRequestNewDataset}
            nextLabel={props.nextLabel}
            onNext={annotatorTopMenuOnNext}
            nextDisabled={dataset === undefined || !dataset.synchronised || props.onNext === undefined}
            onBack={props.onBack}
            className={"menuBar"}
            sortOrders={SORT_ORDERS}
            onSortChanged={setSortFunction}
            onSelect={annotatorTopMenuOnSelect}
            itemSelectFragmentRenderer={itemSelectFragmentRenderer}
            onDeleteSelected={dataset === undefined ? undefined : dataset.deleteSelectedFiles.bind(dataset)}
            extraControls={extraControls}
            numSelected={annotatorTopMenuNumSelected}
            onExtractSelected={onExtractSelected}
        />

        <DatasetOverview<Image, Classification>
            className={"ICDatasetOverview"}
            dataset={dataset?.items}
            evalDataset={evalDataset?.items}
            renderData={ImageRenderer}
            renderAnnotation={classificationRenderer}
            onItemSelected={imagesDisplayOnFileSelected}
            onItemClicked={imagesDisplayOnFileClicked}
            onAddFiles={imagesDisplayOnAddFiles}
            sortFunction={sortFunction}
            itemClass={"ICDatasetItem"}
            fileAnnotationModalRenderer={fileClassificationModalRenderer}
        />
    </Page>
}

function createImageClassificationExtraControlsRenderer(
    onRelabelSelected: ((label: Classification) => void) | undefined,
    colours: ClassColours,
    onRequestLabelColourPickerOverlay: (() => void) | undefined
): AnnotatorTopMenuExtraControlsRenderer {
    return () => {

        const labelModal = useLocalModal();

        return <>
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
        </>
    }
}

function createImageClassificationSelectFragmentRenderer(
    classColours: ClassColours,
    evalDataset: Dataset<Image, Classification> | undefined
): ItemSelectFragmentRenderer<Image, Classification> {
    return (select) => {
        return <>
            <ClassSelect
                onReclassify={(_, classification) => {
                    select(IC_SELECTIONS.withClassification(classification))
                }}
                classification={NO_CLASSIFICATION}
                colours={classColours}
                allowSelectNone
            />
            <button
                disabled={evalDataset === undefined}
                onClick={() => select(IC_SELECTIONS.correctForEval(evalDataset!))}
            >
                Correct
            </button>
            <button
                disabled={evalDataset === undefined}
                onClick={() => select(IC_SELECTIONS.incorrectForEval(evalDataset!))}
            >
                Incorrect
            </button>
        </>
    }
}