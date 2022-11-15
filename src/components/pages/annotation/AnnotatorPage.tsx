import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import Page from "../Page";
import AnnotatorTopMenu, {
    AnnotatorTopMenuExtraControlsRenderer,
    ItemSelectFragmentRenderer
} from "../../../server/components/AnnotatorTopMenu";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import NewDatasetPage from "../NewDatasetPage";
import {AnyPK, DatasetPK, getProjectPK, getTeamPK, TeamPK} from "../../../server/pk";
import {Controllable, UNCONTROLLED_KEEP, useControllableState} from "../../../util/react/hooks/useControllableState";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {DEFAULT, WithDefault} from "../../../util/typescript/default";
import DatasetOverview from "../../../server/components/dataset/DatasetOverview";
import {
    DatasetDispatch,
    MutableDatasetDispatch,
    MutableDatasetDispatchItem
} from "../../../server/hooks/useDataset/DatasetDispatch";
import {DOMAIN_DATASET_METHODS, DomainAnnotationType, DomainDataType, DomainName} from "../../../server/domains";
import isDefined from "../../../util/typescript/isDefined";
import {Absent} from "../../../util/typescript/types/Possible";
import {DomainSortOrders} from "../../../server/components/types";
import {AnnotationComponent, DataComponent, ExpandedComponent} from "../../../server/components/dataset/types";
import {SubMenus} from "../../../server/components/AddFilesButton";
import {augmentClassName} from "../../../util/react/augmentClass";
import "./AnnotatorPage.css"
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../../../server/hooks/useDataset/types";
import {constantInitialiser} from "../../../util/typescript/initialisers";

export type AnnotatorPageProps<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
> = {
    domain: Domain,
    selectedPK: AnyPK
    lockedPK: AnyPK
    nextLabel: WithDefault<string>
    onNext: ((
        selectedPK: AnyPK,
        position: [number, number]
    ) => void) | undefined
    onBack: (() => void) | undefined
    dataset: MutableDatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>, Item> | undefined
    evalDataset: DatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>> | undefined
    sortOrders: WithDefault<DomainSortOrders<Domain>>
    selectedSortOrder: Controllable<WithDefault<string>>
    sortOrderLocked?: boolean
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<Domain>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<Domain>>>
    ExpandedComponent?: ExpandedComponent<Domain, Item>
    addFilesSubMenus: SubMenus<DomainDataType<Domain>, DomainAnnotationType<Domain>>
    extraControls: AnnotatorTopMenuExtraControlsRenderer | undefined
    itemSelectFragmentRenderer: ItemSelectFragmentRenderer<DomainDataType<Domain>, DomainAnnotationType<Domain>>
    className: string | undefined
    onSelectedPKChanged: ((selectedPK: AnyPK) => void) | undefined
    mode?: typeof DEFAULT | "Single" | "Multi"
}

export default function AnnotatorPage<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
>(
    props: AnnotatorPageProps<Domain, Item>
) {
    // Get the server context
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [sortOrder, setSortOrder] = useControllableState<WithDefault<string>>(
        props.selectedSortOrder,
        constantInitialiser(DEFAULT)
    )

    // Sub-page displays
    const [showNewDatasetPage, setShowNewDatasetPage] = useStateSafe<boolean>(() => false);

    const newDatasetPageOnCreate = useDerivedState(
        ([onSelectedPKChanged, setShowNewDatasetPage]) => (pk: DatasetPK) => {
            if (isDefined(onSelectedPKChanged)) onSelectedPKChanged(pk)
            setShowNewDatasetPage(false)
        },
        [props.onSelectedPKChanged, setShowNewDatasetPage] as const
    )

    const newDatasetPageOnBack = useDerivedState(
        () => () => setShowNewDatasetPage(false),
        [setShowNewDatasetPage]
    )

    const topMenuOnTeamChanged = useDerivedState(
        ([onSelectedPKChanged]) => (_: any, pk: number | undefined) => {
            if (isDefined(onSelectedPKChanged)) onSelectedPKChanged(pk === undefined ? undefined : new TeamPK(pk));
        },
        [props.onSelectedPKChanged] as const
    )

    const topMenuOnProjectChanged = useDerivedState(
        ([selectedPK, onSelectedPKChanged]) => (_: any, pk: number | undefined) => {
            const teamPK = getTeamPK(selectedPK);
            if (isDefined(onSelectedPKChanged)) onSelectedPKChanged(pk === undefined ? teamPK : teamPK?.project(pk));
        },
        [props.selectedPK, props.onSelectedPKChanged] as const
    )

    const topMenuOnDatasetChanged = useDerivedState(
        ([selectedPK, onSelectedPKChanged]) => (_: any, pk: number | undefined) => {
            const projectPK = getProjectPK(selectedPK);
            if (isDefined(onSelectedPKChanged)) onSelectedPKChanged(pk === undefined ? projectPK : projectPK?.dataset(pk));
        },
        [props.selectedPK, props.onSelectedPKChanged] as const
    )

    const topMenuOnRequestNewDataset = useDerivedState(
        () => () => setShowNewDatasetPage(true),
        [setShowNewDatasetPage]
    )

    const topMenuOnNext = useDerivedState(
        ([selectedPK, onNext]) => {
            if (!isDefined(onNext)) return undefined

            return (position: [number, number]) => {
                onNext(
                    selectedPK,
                    position
                )
            }
        },
        [props.selectedPK, props.onNext] as const
    )

    const topMenuOnSelect = useDerivedState(
        ([dataset]) => {
            if (!isDefined(dataset)) return undefined;
            return dataset.selectOnly.bind(dataset)
        },
        [props.dataset] as const
    )

    const topMenuNumSelected = useDerivedState(
        ([dataset]) => dataset === undefined
            ? [0, 0] as const
            : [dataset.numSelected, dataset.size] as const,
        [props.dataset] as const
    )

    const onExtractSelected = useDerivedState(
        ([dataset, domain, onSelectedPKChanged]) => {
            // Can't extract from an undefined dataset
            if (!isDefined(dataset)) return undefined

            return async () => {
                const copy = DOMAIN_DATASET_METHODS[domain].copy

                const newDataset = await copy(
                    ufdlServerContext,
                    dataset.pk.asNumber,
                    undefined,
                    [...dataset.iterateSelected()]
                )

                if (isDefined(onSelectedPKChanged)) onSelectedPKChanged(dataset.pk.project.dataset(newDataset.pk))
            }
        },
        [props.dataset, props.domain, props.onSelectedPKChanged] as const
    )

    if (showNewDatasetPage) {
        return <NewDatasetPage
            domain={props.domain} lockDomain
            licencePK={UNCONTROLLED_KEEP}
            isPublic={UNCONTROLLED_KEEP}
            from={props.selectedPK instanceof DatasetPK ? props.selectedPK.project : props.selectedPK}
            lockFrom={props.lockedPK === undefined ? undefined : props.lockedPK instanceof TeamPK ? "team" : "project"}
            onCreate={newDatasetPageOnCreate}
            onBack={newDatasetPageOnBack}
        />
    }

    const topMenu = <AnnotatorTopMenu
        domain={props.domain}
        selectedPK={props.selectedPK}
        lockedPK={props.lockedPK}
        onTeamChanged={topMenuOnTeamChanged}
        onProjectChanged={topMenuOnProjectChanged}
        onDatasetChanged={topMenuOnDatasetChanged}
        onRequestNewDataset={topMenuOnRequestNewDataset}
        nextLabel={props.nextLabel}
        onNext={topMenuOnNext}
        nextDisabled={!isDefined(props.dataset) || props.dataset.isError || !isDefined(props.onNext)}
        onBack={props.onBack}
        className={"menuBar"}
        sortOrders={props.sortOrders}
        onSortChanged={(order) => setSortOrder(order === Absent ? DEFAULT : order)}
        selectedSortOrder={sortOrder}
        sortOrderLocked={props.sortOrderLocked}
        onSelect={topMenuOnSelect}
        itemSelectFragmentRenderer={props.itemSelectFragmentRenderer}
        onDeleteSelected={isDefined(props.dataset) ? props.dataset.deleteSelectedFiles.bind(props.dataset) : undefined}
        extraControls={props.extraControls}
        numSelected={topMenuNumSelected}
        onExtractSelected={onExtractSelected}
    />

    const overview = <DatasetOverview<Domain, Item>
        dataset={props.dataset}
        comparisonDataset={props.evalDataset}
        DataComponent={props.DataComponent}
        AnnotationComponent={props.AnnotationComponent}
        ExpandedComponent={props.ExpandedComponent}
        sortFunction={sortOrder === DEFAULT || props.sortOrders === DEFAULT ? DEFAULT : props.sortOrders[sortOrder]}
        addFilesSubMenus={props.addFilesSubMenus}
        mode={props.mode}
    />

    return <Page className={augmentClassName(props.className, "AnnotatorPage")}>
        {topMenu}
        {overview}
    </Page>
}
