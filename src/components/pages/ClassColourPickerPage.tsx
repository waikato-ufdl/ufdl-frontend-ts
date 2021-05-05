import React from "react";
import Page from "./Page";
import {BackButton} from "../BackButton";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../util/typescript/initialisers";
import {Form} from "../../util/react/component/Form";
import asChangeEventHandler from "../../util/react/asChangeEventHandler";
import {ClassColour, ClassColours, sortedClassColourArray} from "../../server/util/classification";
import ClassAndColourPicker from "../../server/components/classification/ClassAndColourPicker";

export type ClassColourPickerPageProps = {
    colours: ClassColours
    onColourChanged: (label: string, oldColour: ClassColour, newColour: ClassColour) => void
    onNewClass: (classification: string) => void
    onClassDeleted: (classification: string) => void
    onBack: () => void
}

export default function ClassColourPickerPage(
    props: ClassColourPickerPageProps
) {

    const [adding, setAdding] = useStateSafe<string>(constantInitialiser(""));

    const classAndColourPickers = sortedClassColourArray(
        props.colours
    ).map(
        ([label, colour]) => <ClassAndColourPicker
            label={label}
            colour={colour}
            onColourChanged={
                (newColour) => {
                    props.onColourChanged(label, colour, newColour);
                }
            }
            onLabelDeleted={() => props.onClassDeleted(label)}
        />
    );

    return <Page
        className={"ClassColourPickerPage"}
        id={"Label Colour Picker"}
        onClick={(event) => event.stopPropagation()}
    >
        <BackButton onBack={props.onBack} />

        {classAndColourPickers}

        <Form
            onSubmit={() => {props.onNewClass(adding); setAdding("")}}
        >
            <input
                value={adding}
                onChange={asChangeEventHandler(setAdding)}
                autoFocus
            />
        </Form>
    </Page>
}
