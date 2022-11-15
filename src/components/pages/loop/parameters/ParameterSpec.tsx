/**
 * Specification of the default value for optional/const parameters.
 *
 * @property value
 *          The JSON representation of the default value.
 * @property type
 *          The type-name of the default value.
 * @property schema
 *          The JSON schema describing values of the default type (should validate {@link value}).
 * @property const
 *          Whether this is an optional (false) or const (true) parameter.
 */
export type ParameterDefaultSpec = {
    value: any
    type: string
    schema: any
    const: boolean
}

/**
 * Specification of a parameter to a job-template.
 *
 * @property types
 *          Mapping from type-names to JSON schema describing the JSON representation of values of that type.
 * @property help
 *          A string describing what the parameter is used for.
 * @property default
 *          The specification of the default value if this is an optional/const parameter. If undefined,
 *          this is a required parameter.
 */
export type ParameterSpec = {
    types: { [type_string: string]: any }
    help: string
    default?: ParameterDefaultSpec
}