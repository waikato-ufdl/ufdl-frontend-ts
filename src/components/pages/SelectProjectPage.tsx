import {ProjectPK, TeamPK} from "../../server/pk";
import {FunctionComponentReturnType} from "../../util/react/types";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {Optional} from "ufdl-ts-client/util";
import {Controllable, UNCONTROLLED_KEEP, useControllableState} from "../../util/react/hooks/useControllableState";
import Page from "./Page";
import SelectTeamPage from "./SelectTeamPage";
import {ProjectSelect} from "../ProjectSelect";
import NewProjectPage from "./NewProjectPage";
import {BackButton} from "../BackButton";
import React from "react";
import RenderSelectedChildren from "../../util/react/component/RenderSelectedChildren";
import ignoreFirstNArgs from "../../util/typescript/ignoreFirstNArgs";
import {constantInitialiser} from "../../util/typescript/initialisers";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {exactFilter} from "../../server/util/exactFilter";

export type SelectProjectPageProps = {
    onProjectSelected: (pk: ProjectPK) => void
    onTeamSelected?: (pk: TeamPK) => void
    onBack?: () => void
    team: Controllable<TeamPK | undefined>
    lockTeam?: boolean
}

export default function SelectProjectPage(
    props: SelectProjectPageProps
): FunctionComponentReturnType {

    const [team, setTeam, teamLocked] = useControllableState<Optional<TeamPK>>(
        props.team,
        constantInitialiser(undefined)
    );

    const projectTeamFilter = useDerivedState(
        ([team]) => team === undefined ? undefined : exactFilter("team", team?.asNumber),
        [team]
    );

    const [showNewProjectPage, setShowNewProjectPage] = useStateSafe(constantInitialiser(false));

    return <RenderSelectedChildren
        selector={team === undefined ? 0 : showNewProjectPage ? 1 : 2}
    >
        <SelectTeamPage
            onSelected={(pk) => {setTeam(pk); if (props.onTeamSelected !== undefined) props.onTeamSelected(pk);}}
            onBack={props.onBack}
        />
        <NewProjectPage
            teamPK={team?.asNumber}
            lockTeam={props.lockTeam}
            onCreate={(pk) => {
                if (team !== undefined) props.onProjectSelected(team.project(pk));
                setShowNewProjectPage(false)
            }}
            onBack={() => setShowNewProjectPage(false)}
        />
        <Page>
            <BackButton
                onBack={() => {
                    if (team !== undefined && !teamLocked)
                        setTeam(undefined);
                    else if (props.onBack !== undefined)
                        props.onBack()
                }}
                disabled={props.onBack === undefined}
            />
            Project:
            <ProjectSelect
                onChange={ignoreFirstNArgs(1, (pk?: number) => {
                    if (pk !== undefined && team !== undefined)
                        props.onProjectSelected(team.project(pk))
                })}
                forceEmpty={team === undefined}
                filter={projectTeamFilter}
                value={UNCONTROLLED_KEEP}
            />
            <button
                onClick={() => setShowNewProjectPage(true)}
            >
                New...
            </button>
        </Page>
    </RenderSelectedChildren>

}