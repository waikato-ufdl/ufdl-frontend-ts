import React, {ReactElement, useContext} from "react";
import {JSXFunctionElementConstructor} from "../../util/react/jsx/JSXFunctionElementConstructor";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import Page from "./Page";
import {BackButton} from "../BackButton";
import {Form} from "../Form";
import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import * as Team from "ufdl-js-client/functional/core/team";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {RawJSONObject} from "ufdl-js-client/types";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import asChangeEventHandler from "../../util/react/asChangeEventHandler";
import {TeamPK} from "../../server/pk";
import {DEFAULT_HANDLED_ERROR_RESPONSE, withErrorResponseHandler} from "../../server/util/responseError";

export type NewTeamPageProps = {
    onCreate?: (pk: TeamPK) => void
    onBack?: () => void
}

const createTeam = withErrorResponseHandler(Team.create);

export default function NewTeamPage(
    props: NewTeamPageProps
): ReactElement<NewTeamPageProps, JSXFunctionElementConstructor<NewTeamPageProps>> {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [name, setName] = useStateSafe<string>(() => "");

    const clearForm = useDerivedState(
        ([setName]) => () => {setName("")},
        [setName] as const
    );

    const onSuccess = useDerivedState(
        ([onCreate, clearForm]) => (team: RawJSONObject) => {
            if (onCreate !== undefined) onCreate(new TeamPK(team['pk'] as number));
            clearForm();
        },
        [props.onCreate, clearForm] as const
    );

    return <Page className={"NewTeamPage"}>
        {props.onBack && <BackButton onBack={props.onBack} />}
        <Form onSubmit={() => submitNewTeam(ufdlServerContext, name, onSuccess)}>
            <label>
                Name:
                <input
                    value={name}
                    onChange={asChangeEventHandler(setName)}
                />
            </label>
            <input type={"submit"} value={"Submit"} disabled={!canSubmit(name)} />
        </Form>
    </Page>
}

function canSubmit(
    name: string
): boolean {
    return name !== "";
}

async function submitNewTeam(
    context: UFDLServerContext,
    name: string,
    onSuccess: (project: RawJSONObject) => void
): Promise<void> {
    if (!canSubmit(name)) return;

    const response = await createTeam(context, name);

    if (response !== DEFAULT_HANDLED_ERROR_RESPONSE) onSuccess(response);
}