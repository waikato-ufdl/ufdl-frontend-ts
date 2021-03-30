import {ProjectPK, TeamPK} from "../../server/pk";
import {FunctionComponentReturnType} from "../../util/react/types";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {Optional} from "ufdl-ts-client/util";
import {useInterlockedState} from "../../util/react/hooks/useInterlockedState";
import Page from "./Page";
import SelectTeamPage from "./SelectTeamPage";
import {ProjectSelect} from "../ProjectSelect";
import NewProjectPage from "./NewProjectPage";
import {BackButton} from "../BackButton";
import React from "react";
import RenderSelectedChildren from "../../util/react/component/RenderSelectedChildren";
import ignoreFirstNArgs from "../../util/typescript/ignoreFirstNArgs";

export type SelectProjectPageProps = {
    onSelected: (pk: ProjectPK) => void
    onBack?: () => void
    team?: TeamPK
}

export default function SelectProjectPage(
    props: SelectProjectPageProps
): FunctionComponentReturnType {

    const [team, setTeam, teamLocked] = useInterlockedState<Optional<TeamPK>>(
        props.team,
        () => undefined
    );

    const [showNewProjectPage, setShowNewProjectPage] = useStateSafe(() => false);

    return <RenderSelectedChildren
        selector={team === undefined ? 0 : showNewProjectPage ? 1 : 2}
    >
        <SelectTeamPage
            onSelected={(pk) => setTeam(pk)}
            onBack={props.onBack}
        />
        <NewProjectPage
            team_pk={team?.asNumber}
            onCreate={(pk) => {
                if (team !== undefined) props.onSelected(team.project(pk));
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
                        props.onSelected(team.project(pk))
                })}
            />
            <button
                onClick={() => setShowNewProjectPage(true)}
            >
                New...
            </button>
        </Page>
    </RenderSelectedChildren>

}