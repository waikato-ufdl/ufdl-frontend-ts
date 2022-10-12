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
import {UNCONTROLLED_KEEP} from "../../../util/react/hooks/useControllableState";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {WithDefault} from "../../../util/typescript/default";
import DatasetOverview from "../../../server/components/DatasetOverview";
import {
    DatasetDispatch,
    DatasetDispatchItem,
    MutableDatasetDispatch
} from "../../../server/hooks/useDataset/DatasetDispatch";
import {DOMAIN_DATASET_METHODS, DomainAnnotationType, DomainDataType, DomainName} from "../../../server/domains";
import isDefined from "../../../util/typescript/isDefined";
import {Absent, Possible} from "../../../util/typescript/types/Possible";
import {DomainSortOrderFunction, DomainSortOrders} from "../../../server/components/types";
import {AnnotationComponent, DataComponent} from "../../../server/components/DatasetItem";
import {SubMenus} from "../../../server/components/AddFilesButton";
import {augmentClassName} from "../../../util/react/augmentClass";
import "./AnnotatorPage.css"
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../../../server/hooks/useDataset/types";

export type AnnotatorPageProps<D extends DomainName> = {
    domain: D,
    selectedPK: AnyPK
    lockedPK: AnyPK
    nextLabel: WithDefault<string>
    onNext: ((
        selectedPK: AnyPK,
        position: [number, number]
    ) => void) | undefined
    onBack: (() => void) | undefined
    dataset: MutableDatasetDispatch<DomainDataType<D>, DomainAnnotationType<D>> | undefined
    evalDataset: DatasetDispatch<DomainDataType<D>, DomainAnnotationType<D>> | undefined
    sortOrders: WithDefault<DomainSortOrders<D>>
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<D>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<D>>>
    onItemClicked: (item: DatasetDispatchItem<DomainDataType<D>, DomainAnnotationType<D>>) => void
    addFilesSubMenus: SubMenus<DomainDataType<D>, DomainAnnotationType<D>>
    extraControls: AnnotatorTopMenuExtraControlsRenderer | undefined
    itemSelectFragmentRenderer: ItemSelectFragmentRenderer<DomainDataType<D>, DomainAnnotationType<D>>
    className: string | undefined
    onSelectedPKChanged: ((selectedPK: AnyPK) => void) | undefined
}

export default function AnnotatorPage<D extends DomainName>(
    props: AnnotatorPageProps<D>
) {
    // Get the server context
    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [sortOrder, setSortOrder] = useStateSafe<Possible<DomainSortOrderFunction<D>>>(
        () => Absent
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
        onSortChanged={(_, order) => setSortOrder(order)}
        onSelect={topMenuOnSelect}
        itemSelectFragmentRenderer={props.itemSelectFragmentRenderer}
        onDeleteSelected={isDefined(props.dataset) ? props.dataset.deleteSelectedFiles.bind(props.dataset) : undefined}
        extraControls={props.extraControls}
        numSelected={topMenuNumSelected}
        onExtractSelected={onExtractSelected}
    />

    const overview = <DatasetOverview<D>
        dataset={props.dataset}
        evalDataset={props.evalDataset}
        DataComponent={props.DataComponent}
        AnnotationComponent={props.AnnotationComponent}
        onItemClicked={props.onItemClicked}
        sortFunction={sortOrder}
        addFilesSubMenus={props.addFilesSubMenus}
    />

    return <Page className={augmentClassName(props.className, "AnnotatorPage")}>
        {topMenu}
        {overview}
    </Page>
}
