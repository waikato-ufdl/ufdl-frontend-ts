import React, {MouseEvent} from "react";

export type BackButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onBack?: () => void
    children?: never
}

export function BackButton(props: BackButtonProps) {
    const {onClick, onBack, disabled, ...buttonProps} = props;

    const onClickActual = onBack === undefined ?
        onClick :
        onClick === undefined ?
            onBack :
            (event: MouseEvent<HTMLButtonElement>) => {
                onClick(event);
                onBack();
            };

    return <button onClick={onClickActual} disabled={onClickActual === undefined} {...buttonProps}>
        Back
    </button>
}