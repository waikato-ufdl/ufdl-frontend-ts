import React, {ButtonHTMLAttributes} from 'react';
import {ping} from "ufdl-js-client/functional/core/nodes/node";
import {UFDL_SERVER_REACT_CONTEXT} from "../server/UFDLServerContextProvider";
import {Empty} from "../util/typescript/types/Empty";
import {formatResponseError, handleErrorResponse} from "../server/util/responseError";

export interface PingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    onSuccess?: () => void,
    onFailure?: (reason: string) => void
}

type OnClickType = PingButtonProps['onClick'];

export class PingButton extends React.Component<PingButtonProps, Empty> {

    static contextType = UFDL_SERVER_REACT_CONTEXT;
    context!: React.ContextType<typeof UFDL_SERVER_REACT_CONTEXT>;

    private augmentOnClick(onClick: OnClickType): OnClickType {
        if (onClick !== undefined) {
            return async (event) => {
                this.ping();
                onClick(event);
            }
        } else {
            return async (_) => {
                await this.ping();
            }
        }
    }

    async ping(): Promise<void> {
         await handleErrorResponse(
            async () => {
                await ping(this.context);
                if (this.props.onSuccess !== undefined) this.props.onSuccess();
            },
            async (response) => {
                if (this.props.onFailure !== undefined) this.props.onFailure(await formatResponseError(response));
            }
        );
    }

    render() {
        return <button {...this.props} onClick={this.augmentOnClick(this.props.onClick)} />;
    }
}
