import React, {ButtonHTMLAttributes, useContext} from "react";
import {ping} from "ufdl-ts-client/functional/core/nodes/node";
import {FunctionComponentReturnType} from "../../util/react/types";
import {UFDL_SERVER_REACT_CONTEXT} from "../UFDLServerContextProvider";
import {formatResponseError, withErrorResponseHandler} from "../util/responseError";
import {discard} from "../../util/typescript/discard";

export type PingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    onSuccess?: () => void,
    onFailure?: (reason: string) => void
}

export default function PingButton(
    props: PingButtonProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const {
        onClick,
        onSuccess,
        onFailure,
        ...buttonProps
    } = props;

    const pingActual = withErrorResponseHandler(
        async () => {
            await ping(ufdlServerContext);
            if (onSuccess !== undefined) onSuccess();
        },
        async (response) => {
            if (onFailure !== undefined) onFailure(await formatResponseError(response));
        }
    );

    const onClickActual: typeof onClick = onClick !== undefined
        ? (event) => {
            discard(pingActual());
            onClick(event);
        }
        : pingActual;

    return <button
        onClick={onClickActual}
        {...buttonProps}
    />
}