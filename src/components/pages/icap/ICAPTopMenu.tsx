import {TeamSelect} from "../../TeamSelect";
import {ProjectSelect} from "../../ProjectSelect";
import {ListSelect} from "../../ListSelect";
import * as ICDataset from "ufdl-js-client/functional/image_classification/dataset";
import {nameFromJSON} from "../../../server/util/nameFromJSON";
import React from "react";
import {BackButton} from "../../BackButton";
import {exactFilter} from "../../../server/util/exactFilter";
import {RawJSONObject} from "ufdl-js-client/types";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {DatasetPK, getDatasetPK, getProjectPK, getTeamPK, ProjectPK, TeamPK} from "../../../server/pk";
import nameFromSignature from "../../../server/util/nameFromSignature";

export type ICAPTopMenuProps = {
    selectedPK: DatasetPK | ProjectPK | TeamPK | undefined
    lockedPK: DatasetPK | ProjectPK | TeamPK | undefined
    onTeamChanged: (team?: RawJSONObject, pk?: number) => void
    onProjectChanged: (project?: RawJSONObject, pk?: number) => void
    onDatasetChanged: (dataset?: RawJSONObject, pk?: number) => void
    onRequestNewDataset: () => void
    nextLabel?: string
    onNext?: () => void
    nextDisabled?: boolean
    onBack?: () => void
}

export default function ICAPTopMenu(props: ICAPTopMenuProps) {

    const teamPK = getTeamPK(props.selectedPK);
    const projectPK = getProjectPK(props.selectedPK);
    const datasetPK = getDatasetPK(props.selectedPK);

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

    return <div id={"topMenu"} className={"menuBar"}>
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
            <ListSelect
                list={ICDataset.list}
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
                    onClick={props.onNext}
                    disabled={props.nextDisabled}
                >
                    {props.nextLabel === undefined ? "Next" : props.nextLabel}
                </button>

        }
    </div>;

}