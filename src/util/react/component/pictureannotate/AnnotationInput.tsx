import React from "react";
import DeleteButton from "./DeleteButton";
import {FunctionComponentReturnType} from "../../types/FunctionComponentReturnType";

export type AnnotationInputProps = {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    onDelete: () => void;
    options?: string[]
}

export type AnnotationInputComponent = (
    props: AnnotationInputProps
) => Exclude<FunctionComponentReturnType, null>

export default function AnnotationInput(
    {
        value,
        onChange,
        onDelete,
        options,
        placeholder = "Label goes here...",
    }: AnnotationInputProps
): Exclude<FunctionComponentReturnType, null> {
    const optionSet = new Set(options)
    optionSet.delete(value)

    return <div className="AnnotationInput">
        <input
            type={"search"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            list={"AnnotationInputList"}
        />
        <datalist id={"AnnotationInputList"}>
            {
                [...optionSet].map(option => <option value={option}/>)
            }
        </datalist>
        <a
            onClick={() => onDelete()}
        >
            <DeleteButton />
        </a>
    </div>
};