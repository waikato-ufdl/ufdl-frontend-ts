import React, {ReactElement, useContext} from "react";
import {JSXFunctionElementConstructor} from "../../util/react/jsx/JSXFunctionElementConstructor";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import {useInterlockedState} from "../../util/react/hooks/useInterlockedState";
import Page from "./Page";
import {BackButton} from "../BackButton";
import {Form} from "../Form";
import {TeamSelect} from "../TeamSelect";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import * as Project from "ufdl-ts-client/functional/core/project";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {RawJSONObject} from "ufdl-ts-client/types";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {DEFAULT_HANDLED_ERROR_RESPONSE, withErrorResponseHandler} from "../../server/util/responseError";
import {constantInitialiser} from "../../util/typescript/initialisers";

export type NewProjectPageProps = {
    team_pk?: number
    onCreate?: (pk: number) => void
    onBack?: () => void
}

const createProject = withErrorResponseHandler(Project.create);

export default function NewProjectPage(
    props: NewProjectPageProps
): ReactElement<NewProjectPageProps, JSXFunctionElementConstructor<NewProjectPageProps>> {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [teamPK, setTeamPk, teamPKLocked] = useInterlockedState<number | undefined>(
        props.team_pk,
        constantInitialiser(undefined)
    );

    const [name, setName] = useStateSafe(() => "");

    const clearForm = useDerivedState(
        ([setTeamPk, setName]) => () => {setTeamPk(undefined); setName("")},
        [setTeamPk, setName] as const
    );

    const onSuccess = useDerivedState(
        ([onCreate, clearForm]) => (project: RawJSONObject) => {
            if (onCreate !== undefined) onCreate(project['pk'] as number);
            clearForm();
        },
        [props.onCreate, clearForm] as const
    );

    return <Page className={"NewProjectPage"}>
        {props.onBack && <BackButton onBack={props.onBack} />}
        <Form onSubmit={() => submitNewProject(ufdlServerContext, teamPK, name, onSuccess)}>
            <label>
                Team:
                <TeamSelect
                    onChange={(_, pk) => setTeamPk(pk)}
                    value={teamPK}
                    disabled={teamPKLocked}
                />
            </label>
            <label>
                Name:
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
            </label>
            <input type={"submit"} value={"Submit"} disabled={!canSubmit(teamPK, name)} />
        </Form>
    </Page>
}

function canSubmit(
    teamPK: number | undefined,
    name: string
): boolean {
    return teamPK !== undefined && name !== "";
}

async function submitNewProject(
    context: UFDLServerContext,
    teamPK: number | undefined,
    name: string,
    onSuccess: (project: RawJSONObject) => void
): Promise<void> {
    if (!canSubmit(teamPK, name)) return;

    const response = await createProject(context, name, teamPK as number);

    if (response !== DEFAULT_HANDLED_ERROR_RESPONSE) onSuccess(response);
}