import {DatasetPK, ProjectPK, TeamPK} from "../../server/pk";
import {FunctionComponentReturnType} from "../../util/react/types";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {
    Controllable,
    UNCONTROLLED_KEEP,
    useControllableState
} from "../../util/react/hooks/useControllableState";
import Page from "./Page";
import SelectProjectPage from "./SelectProjectPage";
import NewDatasetPage from "./NewDatasetPage";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import {ListSelect} from "../ListSelect";
import React from "react";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {exactFilter} from "../../server/util/exactFilter";
import nameFromSignature from "../../server/util/nameFromSignature";
import {BackButton} from "../BackButton";
import RenderSelectedChildren from "../../util/react/component/RenderSelectedChildren";
import ignoreFirstNArgs from "../../util/typescript/ignoreFirstNArgs";
import {constantInitialiser} from "../../util/typescript/initialisers";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";

export type SelectDatasetPageProps = {
    onDatasetSelected: (pk: DatasetPK) => void
    onProjectSelected?: (pk: ProjectPK) => void
    onTeamSelected?: (pk: TeamPK) => void
    onBack?: () => void
    from: Controllable<ProjectPK | TeamPK | undefined>
    lock?: "team" | "project"
}

export default function SelectDatasetPage(
    props: SelectDatasetPageProps
): FunctionComponentReturnType {

    const [from, setFrom, fromLocked] = useControllableState<ProjectPK | TeamPK | undefined>(
        props.from,
        () => undefined
    );

    const datasetProjectFilter = useDerivedState(
        ([pk]) => pk instanceof ProjectPK ? exactFilter("project", pk.asNumber) : undefined,
        [from]
    );

    const [showNewDatasetPage, setShowNewDatasetPage] = useStateSafe(constantInitialiser(false));

    return <RenderSelectedChildren
        selector={from instanceof ProjectPK ? showNewDatasetPage ? 1 : 2 : 0}
    >
        <SelectProjectPage
            onProjectSelected={(pk) => {setFrom(pk); if (props.onProjectSelected !== undefined) props.onProjectSelected(pk)}}
            onTeamSelected={props.onTeamSelected}
            team={from instanceof ProjectPK ? from.team : from}
            lockTeam={props.lock !== undefined}
            onBack={props.onBack}
        />
        <NewDatasetPage
            domain={"ic"} lockDomain
            from={from} lockFrom={props.lock}
            onCreate={(pk) => {props.onDatasetSelected(pk); setShowNewDatasetPage(false)} }
            onBack={() => setShowNewDatasetPage(false)}
            licencePK={UNCONTROLLED_KEEP}
            isPublic={UNCONTROLLED_KEEP}
        />
        <Page>
            <BackButton
                onBack={() => {
                    if (!fromLocked && from !== undefined)
                        setFrom(from instanceof ProjectPK ? from.team : undefined);
                    else if (props.onBack !== undefined)
                        props.onBack()
                }}
                disabled={props.onBack === undefined}
            />
            Dataset:
            <ListSelect<DatasetInstance>
                list={ICDataset.list}
                labelFunction={nameFromSignature}
                onChange={ignoreFirstNArgs(1, (pk?: number) => {
                    if (pk !== undefined && from instanceof ProjectPK)
                        props.onDatasetSelected(from.dataset(pk))
                })}
                filter={datasetProjectFilter}
                value={UNCONTROLLED_KEEP}
            />
            <button
                onClick={() => setShowNewDatasetPage(true)}
            >
                New...
            </button>
        </Page>
    </RenderSelectedChildren>


}