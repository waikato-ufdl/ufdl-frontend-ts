import * as User from "ufdl-ts-client/functional/core/user";
import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import {constantInitialiser} from "../../util/typescript/initialisers";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import Page from "./Page";
import {Form} from "../../util/react/component/Form";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {UserInstance} from "ufdl-ts-client/types/core/user";
import asChangeEventHandler from "../../util/react/asChangeEventHandler";
import {DEFAULT_HANDLED_ERROR_RESPONSE} from "../../server/error/DEFAULT_HANDLED_ERROR_RESPONSE";
import {withErrorResponseHandler} from "../../server/error/withErrorResponseHandler";
import isPromise from "../../util/typescript/async/isPromise";
import {BackButton} from "../../util/react/component/BackButton";

export type NewUserPageProps = {
    onCreate?: (user: UserInstance) => void
    onBack?: () => void
}

export default function NewUserPage(
    props: NewUserPageProps
) {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [username, setUsername] = useStateSafe<string>(constantInitialiser(""));
    const [password, setPassword] = useStateSafe<string>(constantInitialiser(""));
    const [email, setEmail] = useStateSafe<string>(constantInitialiser(""));
    const [firstName, setFirstName] = useStateSafe(constantInitialiser(""))
    const [lastName, setLastName] = useStateSafe(constantInitialiser(""))
    const [isAdmin, setIsAdmin] = useStateSafe(constantInitialiser(false))

    const clearForm = useDerivedState(
        () => () => {
            setUsername("");
            setPassword("");
            setEmail("");
            setFirstName("");
            setLastName("");
            setIsAdmin(false);
        },
        [setUsername, setPassword, setEmail, setFirstName, setLastName, setIsAdmin] as const
    );

    const onSubmit = () => submitNewUser(
        ufdlServerContext,
        username,
        password,
        email,
        firstName,
        lastName,
        isAdmin,
        (user) => {
            if (props.onCreate !== undefined) {
                props.onCreate(user);
            }
            clearForm();
        }
    );

    return <Page className={"NewUserPage"}>
        {props.onBack && <BackButton onBack={props.onBack} />}
        <Form onSubmit={onSubmit}>
            <label>
                Username:
                <input
                    onChange={asChangeEventHandler(setUsername)}
                    value={username}
                />
            </label>
            <label>
                Password:
                <input
                    type={"password"}
                    onChange={asChangeEventHandler(setPassword)}
                    value={password}
                />
            </label>
            <label>
                Email:
                <input
                    onChange={asChangeEventHandler(setEmail)}
                    value={email}
                />
            </label>
            <label>
                First Name:
                <input
                    onChange={asChangeEventHandler(setFirstName)}
                    value={firstName}
                />
            </label>
            <label>
                Last Name:
                <input
                    onChange={asChangeEventHandler(setLastName)}
                    value={lastName}
                />
            </label>
            <label>
                Admin?:
                <input
                    checked={isAdmin}
                    type={"checkbox"}
                    onClick={() => setIsAdmin(!isAdmin)}
                />
            </label>
            <input type={"submit"} value={"Submit"} disabled={!canSubmit(ufdlServerContext, username, password, email)}/>
        </Form>
    </Page>
}

function canSubmit(
    context: UFDLServerContext,
    username: string,
    password: string,
    email: string
): boolean {
    const user = context.record;

    return !isPromise(user) &&
        user.is_staff &&
        username !== "" &&
        password !== "" &&
        email !== ""
}

async function submitNewUser(
    context: UFDLServerContext,
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
    isAdmin: boolean,
    onSuccess: (user: UserInstance) => void
): Promise<void> {
    if (!canSubmit(context, username, password, email)) return;

    const response = await withErrorResponseHandler(User.create)(
        context,
        username,
        password,
        email,
        firstName,
        lastName,
        isAdmin
    );

    if (response !== DEFAULT_HANDLED_ERROR_RESPONSE) onSuccess(response);
}