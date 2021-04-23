import {FormEventHandler} from "react";

export type FormProps = React.FormHTMLAttributes<HTMLFormElement> & {
    disabled?: boolean
}


export function Form(props: FormProps) {
    let {onSubmit, ...formProps} = props;

    const onSubmitNoDefault: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if (onSubmit !== undefined) onSubmit(event);
    };

    return <form onSubmit={onSubmitNoDefault} {...formProps}>
        {props.children}
    </form>
}