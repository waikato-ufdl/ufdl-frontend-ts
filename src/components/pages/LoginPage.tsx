import {useInterlockedState} from "../../util/react/hooks/useInterlockedState";
import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import Page from "./Page";
import {Form} from "../Form";
import {ping} from "ufdl-ts-client/functional/core/nodes/node";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {handleErrorResponse} from "../../server/util/responseError";

export type LoginPageProps = {
    id: "Log In"
    username?: string
    onLogin: () => void
}

export default function LoginPage(props: LoginPageProps) {

    const [username, setUsername, usernameLocked] = useInterlockedState<string>(
        props.username,
        () => ""
    );

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [password, setPassword] = useStateSafe<string>(() => "");

    return <Page className={"LoginPage"} id={props.id}>
        <Form onSubmit={() => login(ufdlServerContext, username, password, props.onLogin)}>
            <label>
                Username:
                <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoFocus={true}
                    disabled={usernameLocked}
                />
            </label>
            <label>
                Password:
                <input
                    type={"password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </label>
            <input type={"submit"} value={"Log In"} />
        </Form>
    </Page>

}

async function login(
    context: UFDLServerContext,
    username: string,
    password: string,
    onSuccess: () => void
): Promise<void> {
    // Change the context to the specified user
    context.change_user(username, password);

    // Change to the landing page
    const success = await handleErrorResponse(() => ping(context));

    if (success === undefined) onSuccess();
}
