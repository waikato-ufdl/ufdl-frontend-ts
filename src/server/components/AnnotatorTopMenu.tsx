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
import {DEFAULT, handleSingleDefault, WithDefault} from "../../util/typescript/default";
import useLocalModal from "../../util/react/hooks/useLocalModal";
import SelectionModal from "./SelectionModal";
import {Data} from "../types/data";
import {Absent, Possible} from "../../util/typescript/types/Possible";
import {BY_FILENAME} from "../sorting";
import {DomainSortOrderFunction, DomainSortOrders} from "./types";
import {DatasetDispatchItemSelector} from "../hooks/useDataset/types";
import {BackButton} from "../../util/react/component/BackButton";
import {TeamSelect} from "./TeamSelect";
import {ProjectSelect} from "./ProjectSelect";
import {ListSelect} from "./ListSelect";
import {ArraySelect} from "../../util/react/component/ArraySelect";
import {mapOwnProperties} from "../../util/typescript/object";
import "./AnnotatorTopMenu.css"
import {FunctionComponentReturnType} from "../../util/react/types";

export type ItemSelectFragmentRenderer<D extends Data, A> = (
    select: Dispatch<DatasetDispatchItemSelector<D, A>>
) => ReactFragment

export type AnnotatorTopMenuExtraControlsComponent = (
    // No parameters
) => FunctionComponentReturnType

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
    selectedSortOrder: Controllable<WithDefault<string>>
    sortOrderLocked?: boolean
    onSelect: ((select: DatasetDispatchItemSelector<DomainDataType<D>, DomainAnnotationType<D>>) => void) | undefined
    itemSelectFragmentRenderer: ItemSelectFragmentRenderer<DomainDataType<D>, DomainAnnotationType<D>>
    onDeleteSelected: (() => void) | undefined
    ExtraControls?: AnnotatorTopMenuExtraControlsComponent
    numSelected: readonly [number, number]
    onExtractSelected: (() => void) | undefined
    heading?: string
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
            const sortOrdersDefaulted = handleSingleDefault(
                sortOrders,
                () => { return { "filename": BY_FILENAME } }
            )

            return mapOwnProperties(
                sortOrdersDefaulted,
                (sortName, sortOrderFunction) => [sortName as string, sortOrderFunction] as const
            )
        },
        [props.sortOrders] as const
    )

    const [selectedSortOrder, setSelectedSortOrder] = useControllableState(props.selectedSortOrder, constantInitialiser(DEFAULT))

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

    // Can't cache the extra controls as they may rely on hooks
    const ExtraControls = props.ExtraControls

    const selectModal = useLocalModal();

    const [numSelected, outOf] = props.numSelected;

    return <div className={augmentClassName(props.className, "AnnotatorTopMenu")}>
        {props.heading && <span className={"AnnotatorTopMenuHeading"}>{props.heading}</span>}
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
    </div>;

}