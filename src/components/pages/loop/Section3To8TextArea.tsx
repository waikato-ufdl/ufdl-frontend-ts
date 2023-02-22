import {FunctionComponentReturnType} from "../../../util/react/types";
import {RecursivePartial} from "../../../util/typescript/types/RecursivePartial";
import {Questionnaire} from "../../../EXPERIMENT";
import React from "react";

export function Section3To8TextArea(
    props: {
        section: 3|4|5|6|7|8,
        questionnaire: RecursivePartial<Questionnaire>,
        update: (questionnaire: RecursivePartial<Questionnaire>) => void
    }
): FunctionComponentReturnType {
    return <textarea
        value={props.questionnaire[props.section]}
        placeholder={"Answer"}
        onChange={value => {
            let newQuestionnaire: RecursivePartial<Questionnaire> = {
                ...props.questionnaire,
                [props.section]: value.target.value
            }

            props.update(newQuestionnaire)
        }}
        style={{ width: "80vw" }}
    />
}
