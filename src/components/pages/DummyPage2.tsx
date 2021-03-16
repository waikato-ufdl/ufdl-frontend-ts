import React, {ReactElement, useContext, useReducer} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import Page from "./Page";
import {BackButton} from "../BackButton";
import {PingButton} from "../PingButton";

export type DummyPage2Props = {
    pings: number
    onBack?: () => void
}

export default function DummyPage2(
    props: DummyPage2Props
): ReactElement | null {

    const [pings, incrementPings] = useReducer(
        (currentState: number) => currentState + 1,
        null,
        () => props.pings
    );

    const context = useContext(UFDL_SERVER_REACT_CONTEXT);

    return <Page className={"DummyPage"}>
        <p>Logged in to {context.host} as {context.username}</p>
        <div>
            <BackButton onBack={props.onBack} />
            <PingButton
                onSuccess={incrementPings}
                onFailure={(reason) => window.alert(reason)}
                onClick={(_) => window.alert("Ping!") }
            >
                {`Pings: ${pings.toString()}`}
            </PingButton>
        </div>
    </Page>

}
