import React, {ReactElement, useContext, useReducer} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import Page from "./Page";
import {BackButton} from "../BackButton";
import PingButton from "../PingButton";

export type DummyPageProps = {
    pings: number
    onBack?: () => void
}

export default function DummyPage(
    props: DummyPageProps
): ReactElement | null {

    const [pings, incrementPings] = useReducer(
        (currentState: number) => currentState + 1,
        null,
        () => props.pings
    );

    const context = useContext(UFDL_SERVER_REACT_CONTEXT);

    return <Page className={"DummyPage"}>
        {`Logged in to ${context.host} as ${context.username}`}
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
