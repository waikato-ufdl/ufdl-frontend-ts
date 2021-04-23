import {Controllable, useControllableState} from "../../util/react/hooks/useControllableState";
import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import Page from "./Page";
import {Form} from "../../util/react/component/Form";
import {ping} from "ufdl-ts-client/functional/core/nodes/node";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {handleErrorResponse} from "../../server/util/responseError";
import logo from "../../logo.svg"
import "../../logo.css";
import {constantInitialiser} from "../../util/typescript/initialisers";
import asChangeEventHandler from "../../util/react/asChangeEventHandler";

export type LoginPageProps = {
    id: "Log In"
    username: Controllable<string>
    lockUsername?: boolean
    onLogin: () => void
}

export default function LoginPage(props: LoginPageProps) {

    const [username, setUsername, usernameLocked] = useControllableState<string>(
        props.username,
        constantInitialiser("")
    );

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [password, setPassword] = useStateSafe<string>(constantInitialiser(""));

    return <Page className={"LoginPage"} id={props.id}>
        <div style={{position: "absolute", top: 0, left: 0}}>
            {"Powered by React "}
            <img src={logo} className="App-logo" alt="logo" />
        </div>
        <Form onSubmit={() => login(ufdlServerContext, username, password, props.onLogin)}>
            <label>
                Username:
                <input
                    value={username}
                    onChange={asChangeEventHandler(setUsername)}
                    autoFocus={true}
                    disabled={props.lockUsername}
                />
            </label>
            <label>
                Password:
                <input
                    type={"password"}
                    value={password}
                    onChange={asChangeEventHandler(setPassword)}
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
