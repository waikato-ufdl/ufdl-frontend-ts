import React, {PropsWithChildren} from 'react';
import "./Window.css";
import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import {UFDLServerContextProvider} from "../server/UFDLServerContextProvider";


export type WindowProps = {
    context: UFDLServerContext
}


export default function Window(props: PropsWithChildren<WindowProps>) {
    return <div className={"Window"} style={{width: "100%", height: "100%" }}>
        <UFDLServerContextProvider context={props.context}>
            {props.children}
        </UFDLServerContextProvider>
    </div>
}
