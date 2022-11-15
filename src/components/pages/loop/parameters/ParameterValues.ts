import {ParameterValue} from "ufdl-ts-client/json/generated/CreateJobSpec";

/**
 * A set of parameter values, keyed by the parameters' names.
 */
export type ParameterValues = {
    [parameterName: string]: ParameterValue
}