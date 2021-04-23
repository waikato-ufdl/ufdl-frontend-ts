import {LabelColour, LabelColours, sortedLabelColourArray} from "./LabelColours";
import React from "react";
import Page from "../../Page";
import LabelAndColourPicker from "./LabelAndColourPicker";
import {BackButton} from "../../../BackButton";
import useStateSafe from "../../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../../util/typescript/initialisers";
import {Form} from "../../../../util/react/component/Form";
import asChangeEventHandler from "../../../../util/react/asChangeEventHandler";

export type LabelColourPickerPageProps = {
    labelColours: LabelColours
    onColourChanged: (label: string, oldColour: LabelColour, newColour: LabelColour) => void
    onNewLabel: (label: string) => void
    onLabelDeleted: (label: string) => void
    onBack: () => void
}

export default function LabelColourPickerPage(props: LabelColourPickerPageProps) {

    const [adding, setAdding] = useStateSafe<string>(constantInitialiser(""));

    const labelAndColourPickers = sortedLabelColourArray(props.labelColours).map(
        ([label, colour]) => <LabelAndColourPicker
            label={label}
            colour={colour}
            onColourChanged={
                (newColour) => {
                    props.onColourChanged(label, colour, newColour);
                }
            }
            onLabelDeleted={() => props.onLabelDeleted(label)}
        />
    );

    return <Page
        className={"LabelColourPickerPage"}
        id={"Label Colour Picker"}
        onClick={(event) => event.stopPropagation()}
    >
        <BackButton onBack={props.onBack} />
        {labelAndColourPickers}
        <Form onSubmit={() => {props.onNewLabel(adding); setAdding("")}}>
            <input value={adding} onChange={asChangeEventHandler(setAdding)} autoFocus/>
        </Form>
    </Page>
}
