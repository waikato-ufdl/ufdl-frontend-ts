import React, {ReactNode} from "react";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";

// Global context for components which don't receive one via a React context
const GLOBAL_UFDL_SERVER_CONTEXT: UFDLServerContext = UFDLServerContext.for_current_host(
    "",
    ""
);

/** The React context which specifies a UFDL server context. */
export const UFDL_SERVER_REACT_CONTEXT = React.createContext(GLOBAL_UFDL_SERVER_CONTEXT);

/**
 * The type of props passed to the UFDLServerContextProvider component.
 */
export type UFDLServerContextProviderProps = {
    context: UFDLServerContext
    children: ReactNode
}

/**
 * Component which provides a UFDL server-context to its children.
 *
 * @param props
 *          The props of the component.
 */
export function UFDLServerContextProvider(
    props: UFDLServerContextProviderProps
) {
    return <UFDL_SERVER_REACT_CONTEXT.Provider value={props.context}>
        {props.children}
    </UFDL_SERVER_REACT_CONTEXT.Provider>
}
