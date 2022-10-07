import {FunctionComponentReturnType} from "../../util/react/types";
import Page from "./Page";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import NewTeamPage from "./NewTeamPage";
import {TeamPK} from "../../server/pk";
import React from "react";
import {constantInitialiser} from "../../util/typescript/initialisers";
import {UNCONTROLLED_KEEP} from "../../util/react/hooks/useControllableState";
import {BackButton} from "../../util/react/component/BackButton";
import {TeamSelect} from "../../server/components/TeamSelect";

export type SelectTeamPageProps = {
    onSelected: (pk: TeamPK) => void
    onBack?: () => void
}

export default function SelectTeamPage(
    props: SelectTeamPageProps
): FunctionComponentReturnType {

    const [showNewTeamPage, setShowNewTeamPage] = useStateSafe(constantInitialiser(false));

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
            value={UNCONTROLLED_KEEP}
            onChange={(_, pk) => {if (pk !== undefined) props.onSelected(new TeamPK(pk))}}
        />
        <button
            onClick={() => setShowNewTeamPage(true)}
        >
            New...
        </button>
    </Page>

}