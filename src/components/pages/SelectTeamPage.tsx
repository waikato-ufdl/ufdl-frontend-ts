import {FunctionComponentReturnType} from "../../util/react/types";
import Page from "./Page";
import {TeamSelect} from "../TeamSelect";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import NewTeamPage from "./NewTeamPage";
import {TeamPK} from "../../server/pk";
import {BackButton} from "../BackButton";
import React from "react";

export type SelectTeamPageProps = {
    onSelected: (pk: TeamPK) => void
    onBack?: () => void
}

export default function SelectTeamPage(
    props: SelectTeamPageProps
): FunctionComponentReturnType {

    const [showNewTeamPage, setShowNewTeamPage] = useStateSafe(() => false);

    if (showNewTeamPage)
        return <NewTeamPage
            onCreate={(pk) => {props.onSelected(pk); setShowNewTeamPage(false)} }
            onBack={() => setShowNewTeamPage(false)}
        />;

    return <Page>
        <BackButton
            onBack={props.onBack}
        />
        Team:
        <TeamSelect
            onChange={(_, pk) => {if (pk !== undefined) props.onSelected(new TeamPK(pk))}}
        />
        <button
            onClick={() => setShowNewTeamPage(true)}
        >
            New...
        </button>
    </Page>

}