import React, {ReactElement, useContext} from "react";
import {JSXFunctionElementConstructor} from "../../util/react/jsx/JSXFunctionElementConstructor";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import {Controllable, useControllableState} from "../../util/react/hooks/useControllableState";
import Page from "./Page";
import {BackButton} from "../BackButton";
import {Form} from "../../util/react/component/Form";
import {TeamSelect} from "../TeamSelect";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import * as Project from "ufdl-ts-client/functional/core/project";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {ProjectInstance} from "ufdl-ts-client/types/core/project";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {DEFAULT_HANDLED_ERROR_RESPONSE, withErrorResponseHandler} from "../../server/util/responseError";
import {constantInitialiser} from "../../util/typescript/initialisers";

export type NewProjectPageProps = {
    teamPK: Controllable<number | undefined>
    lockTeam?: boolean
    onCreate?: (pk: number) => void
    onBack?: () => void
}

const createProject = withErrorResponseHandler(Project.create);

export default function NewProjectPage(
    props: NewProjectPageProps
): ReactElement<NewProjectPageProps, JSXFunctionElementConstructor<NewProjectPageProps>> {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [teamPK, setTeamPk, teamPKLocked] = useControllableState<number | undefined>(
        props.teamPK,
        constantInitialiser(undefined)
    );

    const [name, setName] = useStateSafe(() => "");

    const clearForm = useDerivedState(
        ([setTeamPk, setName]) => () => {setTeamPk(undefined); setName("")},
        [setTeamPk, setName] as const
    );

    const onSuccess = useDerivedState(
        ([onCreate, clearForm]) => (project: ProjectInstance) => {
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
                    value={teamPK === undefined ? -1 : teamPK}
                    disabled={props.lockTeam === true}
                />
            </label>
            <label>
                Name:
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoFocus
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
    onSuccess: (project: ProjectInstance) => void
): Promise<void> {
    if (!canSubmit(teamPK, name)) return;

    const response = await createProject(context, name, teamPK as number);

    if (response !== DEFAULT_HANDLED_ERROR_RESPONSE) onSuccess(response);
}