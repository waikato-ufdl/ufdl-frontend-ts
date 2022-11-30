import {Controllable, useControllableState} from "../../util/react/hooks/useControllableState";
import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import Page from "./Page";
import {Form} from "../../util/react/component/Form";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {DEFAULT_HANDLED_ERROR_RESPONSE} from "../../server/error/DEFAULT_HANDLED_ERROR_RESPONSE";
import {handleErrorResponse} from "../../server/error/handleErrorResponse";
import logo from "../../logo.svg"
import "../../logo.css";
import {constantInitialiser} from "../../util/typescript/initialisers";
import asChangeEventHandler from "../../util/react/asChangeEventHandler";
import isPromise from "../../util/typescript/async/isPromise";
import {APP_SETTINGS_REACT_CONTEXT, AppSettingsDispatch, loadSettingsFromContext} from "../../useAppSettings";

export type LoginPageProps = {
    id: "Log In"
    username: Controllable<string>
    lockUsername?: boolean
    onLogin: () => void
}

export default function LoginPage(props: LoginPageProps) {

    const [username, setUsername] = useControllableState<string>(
        props.username,
        constantInitialiser("")
    );

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [, setSettings] = useContext(APP_SETTINGS_REACT_CONTEXT)

    const [password, setPassword] = useStateSafe<string>(constantInitialiser(""));

    return <Page className={"LoginPage"} id={props.id}>
        <div style={{position: "absolute", top: 0, left: 0}}>
            {"Powered by React "}
            <img src={logo} className="App-logo" alt="logo" />
        </div>
        <Form onSubmit={() => login(ufdlServerContext, username, password, props.onLogin, setSettings)}>
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
    onSuccess: () => void,
    settingsDispatch: AppSettingsDispatch
): Promise<void> {
    // Change the context to the specified user
    context.change_user(username, password);

    // Get the record for the new user
    const userRecord = context.record;

    // Ping the backend to validate the user
    const success = !isPromise(userRecord) || (await handleErrorResponse(userRecord)) !== DEFAULT_HANDLED_ERROR_RESPONSE;

    // Load the settings from the context
    await loadSettingsFromContext(context, settingsDispatch)

    // Run the success handler if succesfully
    if (success) onSuccess();
}
