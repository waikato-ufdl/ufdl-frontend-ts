import React, {PropsWithChildren} from 'react';
import "./Window.css";

export type WindowProps = {
}

export default function Window(props: PropsWithChildren<WindowProps>) {
    return <div className={"Window"} style={{width: "100%", height: "100%", overflow: "hidden" }}>
        {props.children}
    </div>
}
