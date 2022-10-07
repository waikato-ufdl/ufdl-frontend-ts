import React, {Dispatch, ReactFragment} from "react";
import {DatasetPK, getDatasetPK, getProjectPK, getTeamPK, ProjectPK, TeamPK} from "../pk";
import {TeamInstance} from "ufdl-ts-client/types/core/team";
import {ProjectInstance} from "ufdl-ts-client/types/core/project";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {Controllable, useControllableState} from "../../util/react/hooks/useControllableState";
import {constantInitialiser} from "../../util/typescript/initialisers";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {exactFilter} from "../util/exactFilter";
import {DOMAIN_DATASET_METHODS, DomainAnnotationType, DomainDataType, DomainName} from "../domains";
import nameFromSignature from "../util/nameFromSignature";
import {augmentClassName} from "../../util/react/augmentClass";
import {handleSingleDefault, WithDefault} from "../../util/typescript/default";
import asChangeEventHandler from "../../util/react/asChangeEventHandler";
import useLocalModal from "../../util/react/hooks/useLocalModal";
import SelectionModal from "./SelectionModal";
import {Data} from "../types/data";
import {Possible} from "../../util/typescript/types/Possible";
import {BY_FILENAME} from "../sorting";
import {DomainSortOrderFunction, DomainSortOrders} from "./types";
import {DatasetDispatchItemSelector} from "../hooks/useDataset/types";
import {BackButton} from "../../util/react/component/BackButton";
import {TeamSelect} from "./TeamSelect";
import {ProjectSelect} from "./ProjectSelect";
import {ListSelect} from "./ListSelect";

export type ItemSelectFragmentRenderer<D extends Data, A> = (
    select: Dispatch<DatasetDispatchItemSelector<D, A>>
) => ReactFragment

export type AnnotatorTopMenuExtraControlsRenderer = (
    // No parameters
) => ReactFragment

export type AnnotatorTopMenuProps<D extends DomainName> = {
    /** The domain. */
    domain: D
    selectedPK: Controllable<DatasetPK | ProjectPK | TeamPK | undefined>
    lockedPK: DatasetPK | ProjectPK | TeamPK | undefined
    onTeamChanged: (team?: TeamInstance, pk?: number) => void
    onProjectChanged: (project?: ProjectInstance, pk?: number) => void
    onDatasetChanged: (dataset?: DatasetInstance, pk?: number) => void
    onRequestNewDataset: () => void
    nextLabel: WithDefault<string>
    onNext: ((position: [number, number]) => void) | undefined
    nextDisabled: boolean
    onBack: (() => void) | undefined
    className?: string
    sortOrders: WithDefault<DomainSortOrders<D>>
    onSortChanged: (name: Possible<string>, order: Possible<DomainSortOrderFunction<D>>) => void
    onSelect: ((select: DatasetDispatchItemSelector<DomainDataType<D>, DomainAnnotationType<D>>) => void) | undefined
    itemSelectFragmentRenderer: ItemSelectFragmentRenderer<DomainDataType<D>, DomainAnnotationType<D>>
    onDeleteSelected: (() => void) | undefined
    extraControls: AnnotatorTopMenuExtraControlsRenderer | undefined
    numSelected: readonly [number, number]
    onExtractSelected: (() => void) | undefined
}

export default function AnnotatorTopMenu<D extends DomainName>(
    props: AnnotatorTopMenuProps<D>
) {
    const [selectedPK] = useControllableState(
        props.selectedPK,
        constantInitialiser(undefined)
    )

    // Derive the available sort-orders from the props, handling the default
    const sortOrders = useDerivedState(
        ([sortOrders]) => {
            return handleSingleDefault(
                sortOrders,
                () => { return { "filename": BY_FILENAME } }
            )
        },
        [props.sortOrders] as const
    )

    const teamPK = getTeamPK(selectedPK);
    const projectPK = getProjectPK(selectedPK);
    const datasetPK = getDatasetPK(selectedPK);

    const lockTeam = getTeamPK(props.lockedPK) !== undefined;
    const lockProject = getProjectPK(props.lockedPK) !== undefined;
    const lockDataset = getDatasetPK(props.lockedPK) !== undefined;

    const projectTeamFilter = useDerivedState(
        ([pk]) => pk === undefined ? undefined : exactFilter("team", pk.asNumber),
        [teamPK] as const
    );

    const datasetProjectFilter = useDerivedState(
        ([pk]) => pk === undefined ? undefined : exactFilter("project", pk.asNumber),
        [projectPK]
    );

    const extraControls = useDerivedState(
        ([extraControls]) =>
            extraControls !== undefined
                ? extraControls()
                : undefined,
        [props.extraControls] as const
    )

    const selectModal = useLocalModal();

    const [numSelected, outOf] = props.numSelected;

    return <div className={augmentClassName(props.className, "AnnotatorTopMenu")}>
        {props.onBack && <BackButton onBack={props.onBack} />}
        <label>
            Team:
            <TeamSelect
                onChange={props.onTeamChanged}
                value={teamPK === undefined ? -1 : teamPK.asNumber}
                disabled={lockTeam}
            />
        </label>
        <label>
            Project:
            <ProjectSelect
                onChange={props.onProjectChanged}
                filter={projectTeamFilter}
                forceEmpty={teamPK === undefined}
                value={projectPK === undefined ? -1 : projectPK.asNumber}
                disabled={lockProject}
            />
        </label>
        <label>
            Dataset:
            <ListSelect<DatasetInstance>
                list={DOMAIN_DATASET_METHODS[props.domain].list}
                labelFunction={nameFromSignature}
                onChange={props.onDatasetChanged}
                filter={datasetProjectFilter}
                forceEmpty={projectPK === undefined}
                value={datasetPK === undefined ? -1 : datasetPK.asNumber}
                disabled={lockDataset}
            />
        </label>
        <button
            onClick={props.onRequestNewDataset}
            disabled={lockDataset}
        >
            New...
        </button>
        {
            props.onNext &&
            <button
                onClick={(event) => {
                    if (props.onNext !== undefined) props.onNext([event.clientX, event.clientY])
                }}
                disabled={props.nextDisabled}
            >
                {handleSingleDefault(props.nextLabel, constantInitialiser("Next"))}
            </button>

        }
        <select
            onChange={asChangeEventHandler((order) => props.onSortChanged(order, sortOrders[order]))}
        >
            {
                Object.getOwnPropertyNames(sortOrders).map(
                    (order) => {
                        return <option value={order}>{order}</option>
                    }
                )
            }
        </select>

        <button
            onClick={selectModal.onClick}
            disabled={props.onSelect === undefined}
        >
            Select
        </button>

        <SelectionModal<DomainDataType<D>, DomainAnnotationType<D>>
            position={selectModal.position}
            onSelect={props.onSelect!}
            onCancel={selectModal.hide}
            itemSelectFragmentRenderer={props.itemSelectFragmentRenderer}
            numItems={props.numSelected[1]}
        />

        <button
            onClick={props.onDeleteSelected}
            disabled={props.onDeleteSelected === undefined}
        >
            Delete
        </button>

        <button
            onClick={props.onExtractSelected}
            disabled={props.onExtractSelected === undefined}
        >
            Extract
        </button>

        {extraControls}

        <label>
            {`Selected (${numSelected}/${outOf}) `}
        </label>
    </div>;

}