import React, {MouseEventHandler, useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../../server/UFDLServerContextProvider";
import Page from "../../Page";
import ICAPTopMenu from "./ICAPTopMenu";
import ICDatasetOverview from "./ICDatasetOverview";
import ICAPBottomMenu, {SORT_ORDERS} from "./ICAPBottomMenu";
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
import {constantInitialiser} from "../../../../util/typescript/initialisers";
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
import useRenderNotify from "../../../../util/react/hooks/useRenderNotify";
import {DatasetItem} from "../../../../server/types/DatasetItem";
import {Image} from "../../../../server/types/data";

type AnyPK = DatasetPK | ProjectPK | TeamPK | undefined

export type ICAPProps = {
    lockedPK?: AnyPK,
    evalPK?: DatasetPK,
    initialColours?: ClassColours
    nextLabel?: string
    onNext?: (
        selectedPK: AnyPK,
        dataset: ImageClassificationDatasetDispatch | undefined,
        labelColours: ClassColours,
        position: [number, number]
    ) => void
    onBack?: () => void
}

const SELECTED_PK_REDUCER = createSimpleStateReducer<AnyPK>();

export default function ImageClassificationAnnotatorPage(
    props: ICAPProps
) {
    useRenderNotify("ImageClassificationAnnotatorPage", props);

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

    const [sortOrder, setSortOrder] = useStateSafe<keyof typeof SORT_ORDERS>(constantInitialiser("filename"));

    // Sub-page displays
    const [showNewDatasetPage, setShowNewDatasetPage] = useStateSafe<boolean>(() => false);
    const [showLabelColourPickerPage, setShowLabelColourPickerPage] = useStateSafe<boolean>(() => false);
    const [showLargeImageOverlay, setShowLargeImageOverlay] = useStateSafe<BehaviorSubject<string> | string | undefined>(() => undefined);

    const onReclassify = useDerivedState(
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

    if (showNewDatasetPage) {
        return <NewDatasetPage
            domain={"ic"}
            licencePK={UNCONTROLLED_KEEP}
            isPublic={UNCONTROLLED_KEEP}
            from={props.lockedPK instanceof DatasetPK ? undefined : props.lockedPK}
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
        <ICAPTopMenu
            selectedPK={selectedPK}
            lockedPK={props.lockedPK}
            onTeamChanged={icapTopMenuOnTeamChanged}
            onProjectChanged={icapTopMenuOnProjectChanged}
            onDatasetChanged={
                (_, pk) => {
                    const projectPK = getProjectPK(selectedPK);
                    setSelectedPK(pk === undefined ? projectPK : projectPK?.dataset(pk));
                }
            }
            onRequestNewDataset={() => setShowNewDatasetPage(true)}
            nextLabel={props.nextLabel}
            onNext={(position) => {
                if (props.onNext !== undefined) props.onNext(selectedPK, dataset, classColoursDispatch.state, position)
            }}
            nextDisabled={dataset === undefined || !dataset.synchronised}
            onBack={props.onBack}
        />

        <ICDatasetOverview
            dataset={dataset?.items}
            evalDataset={evalDataset?.items}
            onFileSelected={imagesDisplayOnFileSelected}
            onReclassify={onReclassify}
            onFileClicked={imagesDisplayOnFileClicked}
            onAddFiles={imagesDisplayOnAddFiles}
            colours={classColoursDispatch.state}
            sortFunction={SORT_ORDERS[sortOrder]}
        />

        <ICAPBottomMenu
            onDeleteSelect={dataset === undefined ? undefined : dataset.deleteSelectedFiles.bind(dataset)}
            onSelect={dataset === undefined ? undefined : dataset.selectOnly.bind(dataset)}
            onRequestLabelColourPickerOverlay={() => setShowLabelColourPickerPage(true)}
            onRelabelSelected={dataset?.setAnnotationsForSelected?.bind(dataset)}
            onSortChanged={setSortOrder}
            colours={classColoursDispatch.state}
            evalDataset={evalDataset?.items}
            numSelected={dataset === undefined ? [0, 0] : [dataset.numSelected, dataset.items.size]}
        />
    </Page>
}
