import React from "react";
import {DatasetPK, getDatasetPK, getProjectPK, getTeamPK, ProjectPK, TeamPK} from "../pk";
import {TeamInstance} from "ufdl-ts-client/types/core/team";
import {ProjectInstance} from "ufdl-ts-client/types/core/project";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {Controllable, useControllableState} from "../../util/react/hooks/useControllableState";
import {constantInitialiser} from "../../util/typescript/initialisers";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {exactFilter} from "../util/exactFilter";
import {BackButton} from "../../components/BackButton";
import {TeamSelect} from "../../components/TeamSelect";
import {ProjectSelect} from "../../components/ProjectSelect";
import {ListSelect} from "../../components/ListSelect";
import {Domain, DOMAIN_DATASET_METHODS} from "../domains";
import nameFromSignature from "../util/nameFromSignature";
import {augmentClassName} from "../../util/augmentClass";

export type AnnotatorTopMenuProps<D extends Domain> = {
    domain: D
    selectedPK: Controllable<DatasetPK | ProjectPK | TeamPK | undefined>
    lockedPK: DatasetPK | ProjectPK | TeamPK | undefined
    onTeamChanged: (team?: TeamInstance, pk?: number) => void
    onProjectChanged: (project?: ProjectInstance, pk?: number) => void
    onDatasetChanged: (dataset?: DatasetInstance, pk?: number) => void
    onRequestNewDataset: () => void
    nextLabel?: string
    onNext?: (position: [number, number]) => void
    nextDisabled?: boolean
    onBack?: () => void
    className?: string
}

export default function AnnotatorTopMenu<D extends Domain>(
    props: AnnotatorTopMenuProps<D>
) {
    const [selectedPK] = useControllableState(
        props.selectedPK,
        constantInitialiser(undefined)
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
            disabled={projectPK === undefined || lockDataset}
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
                {props.nextLabel === undefined ? "Next" : props.nextLabel}
            </button>

        }
    </div>;

}