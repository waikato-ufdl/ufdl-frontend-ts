import {RecursivePartial} from "../../../util/typescript/types/RecursivePartial";
import {EASES_OF_USE, getPrelabelMode, QUESTION_2_MODES, Questionnaire} from "../../../EXPERIMENT";
import {FunctionComponentReturnType} from "../../../util/react/types";
import InterlatchedCheckboxes from "../../../util/react/component/InterlatchedCheckboxes";
import {identity} from "../../../util/identity";
import React from "react";

export function InterfaceSection(
    props: {
        index: number
        participantNumber: number,
        questionnaire: RecursivePartial<Questionnaire>,
        update: (questionnaire: RecursivePartial<Questionnaire>) => void
    }
): FunctionComponentReturnType{
    const iteration = props.index * 3 + 1
    const mode = getPrelabelMode(iteration, props.participantNumber % 6)
    let title: string;
    if (mode === "None")
        title = "Single image, unlabelled."
    else if (mode === "Single")
        title = "Single image, pre-labelled."
    else if (mode === "Example")
        title = "Pre-labelled image, with other examples for comparison"
    else
        throw new Error(`Bad prelabel mode: ${mode}`)
    const letter = ["A", "B", "C"][props.index]
    const ranking = props.questionnaire["2"]?.[mode]?.ranking ?? 0
    const easeOfUse = props.questionnaire["2"]?.[mode]?.easeOfUse
    const easeOfUseIndex = easeOfUse === undefined ? -1 : EASES_OF_USE.findIndex(value => value === easeOfUse)

    return <section>
        <label>{`${letter}. ${title}`}</label>
        <div>
            <span>Ranking:</span>
            <InterlatchedCheckboxes
                options={[1, 2, 3] as const}
                labelExtractor={n => n.toString()}
                canSelectNone
                selected={ranking - 1}
                onChanged={(newRanking) => {
                    console.log(`Mode '${mode}' ranking set to ${newRanking}`)

                    const modeWithNewRanking = QUESTION_2_MODES.find((mode) => {
                        if (newRanking === undefined) return undefined
                        return props.questionnaire["2"]?.[mode]?.ranking === newRanking
                    })

                    let newQuestionnaire: RecursivePartial<Questionnaire> = {
                        ...props.questionnaire,
                        2: {
                            ...props.questionnaire[2],
                            [mode]: {
                                ...props.questionnaire[2]?.[mode],
                                ranking: newRanking
                            }
                        }
                    }

                    if (modeWithNewRanking !== undefined) {
                        console.log(`Mode '${modeWithNewRanking}' already has this ranking`)
                        if (modeWithNewRanking === mode) return;
                        let newRankingForModeWithNewRanking: 1 | 2 | 3;
                        if (props.questionnaire[2]![mode]?.ranking !== undefined) {
                            console.log(`Swapping for ${mode}'s ranking of ${props.questionnaire[2]![mode]?.ranking}`)
                            newRankingForModeWithNewRanking = props.questionnaire[2]![mode]!.ranking!
                        } else {
                            const thirdMode = QUESTION_2_MODES.find(m => m !== mode && m !== modeWithNewRanking)!
                            const thirdModeRanking = newQuestionnaire[2]![thirdMode]?.ranking
                            newRankingForModeWithNewRanking = ([1, 2, 3] as const).find(value => {
                                return value !== newRanking && value !== thirdModeRanking
                            })!
                            console.log(`Remaining mode '${thirdMode}' has ranking ${thirdModeRanking}, so giving ranking ${newRankingForModeWithNewRanking}`)
                        }
                        newQuestionnaire[2]![modeWithNewRanking] = {
                            ...newQuestionnaire[2]![modeWithNewRanking]!,
                            ranking: newRankingForModeWithNewRanking
                        }
                    } else {
                        console.log("No other mode has this ranking")
                    }

                    props.update(newQuestionnaire)
                }}
            />
        </div>
        <div>
            <span>Ease of use:</span>
            <InterlatchedCheckboxes
                options={EASES_OF_USE}
                labelExtractor={identity}
                canSelectNone
                selected={easeOfUseIndex}
                onChanged={newEaseOfUse => {
                    let newQuestionnaire: RecursivePartial<Questionnaire> = {
                        ...props.questionnaire,
                        2: {
                            ...props.questionnaire[2],
                            [mode]: {
                                ...props.questionnaire[2]?.[mode],
                                easeOfUse: newEaseOfUse
                            }
                        }
                    }

                    props.update(newQuestionnaire)
                }}
            />
        </div>
        <div>
            <span>General comments:</span>
            <textarea
                value={props.questionnaire["2"]?.[mode]?.comments}
                placeholder={"Comments"}
                onChange={value => {
                    let newQuestionnaire: RecursivePartial<Questionnaire> = {
                        ...props.questionnaire,
                        2: {
                            ...props.questionnaire[2],
                            [mode]: {
                                ...props.questionnaire[2]?.[mode],
                                comments: value.target.value
                            }
                        }
                    }

                    props.update(newQuestionnaire)
                }}
                style={{ width: "80vw" }}
            />
        </div>

    </section>

}