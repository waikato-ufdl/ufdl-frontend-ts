/* Experiment-specific settings. */
import {ClassColours} from "./server/util/classification";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {responseForDownload} from "./server/forDownload";
import completionPromise from "./util/rx/completionPromise";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import {RecursiveReadonly} from "./util/typescript/types/RecursiveReadonly";
import {RecursivePartial} from "./util/typescript/types/RecursivePartial";

/** The username the participant will act under. */
export const EXPERIMENT_LOGIN_USERNAME = "admin"

/** The participant's log-in password. */
export const EXPERIMENT_LOGIN_PASSWORD = "admin"

/** The name of the team to run the experiment under. */
export const EXPERIMENT_TEAM_NAME = "ui-ex-team"

/** The name of the project to run the experiment under. */
export const EXPERIMENT_PROJECT_NAME = "ui-ex-proj"

/** The name of the dataset to run the experiment under. */
export const EXPERIMENT_DATASET_NAME = "ui-ex-dogs"

/** The prelabel modes being tested. */
export const EXPERIMENT_PRELABEL_MODES = ["Default", "None", "Single", "Multi", "Example"] as const

/** The number of iterations being performed. */
export const EXPERIMENT_MAX_ITERATION = 9

/** The type of prelabel modes being tested. */
export type PrelabelMode = (typeof EXPERIMENT_PRELABEL_MODES)[number]

/* The participants answers to the questionnaire questions. */
export const QUESTION_1_OPTIONS = ["Almost none", "A little knowledge", "Moderate knowledge", "Quite good knowledge", "Excellent knowledge"] as const
export const QUESTION_2_MODES = ["None", "Single", "Example"] as const
export const EASES_OF_USE = ["Very Hard", "Moderately Hard", "OK", "Easy", "Very Easy"] as const
export type Questionnaire = {
    1: (typeof QUESTION_1_OPTIONS)[number]
    2: {
        [mode in (typeof QUESTION_2_MODES)[number]]: {
            ranking: 1|2|3,
            easeOfUse: (typeof EASES_OF_USE)[number],
            comments?: string
        }
    }
    3?: string,
    4?: string,
    5?: string,
    6?: string,
    7?: string,
    8?: string,
}

export function questionnaire_is_complete(
    questionnaire: RecursivePartial<Questionnaire>
):  questionnaire is Questionnaire {
    for (const question of [1, 2] as const) {
        if (questionnaire[question] === undefined) return false
    }

    for (const mode of ["None", "Single", "Example"] as const) {
        const modeAnswer = questionnaire[2]![mode]
        if (modeAnswer === undefined) return false
        for (const key of ["ranking", "easeOfUse"] as const) {
            if (modeAnswer[key] === undefined) return false
        }
    }

    return true
}

/**
 * Checks if a string is a valid prelabel mode.
 *
 * @param mode
 *          The string to check.
 * @return
 *          Whether the string is a valid prelabel mode.
 */
export function isPrelabelMode(mode: string): mode is PrelabelMode {
    return (EXPERIMENT_PRELABEL_MODES as readonly string[]).includes(mode)
}

/** The classes of the experimental dog-breeds dataset. */
export const CLASSES = [
    "beagle",
    "boxer",
    "German_shepherd",
    "golden_retriever",
    "Irish_setter",
    "pug",
    "Siberian_husky",
    "standard_poodle",
    "whippet",
    "Yorkshire_terrier"
]

/**
 * Class-colours for the dog breeds.
 *
 * The "muted qualitative" colour scheme @ https://personal.sron.nl/~pault/#sec:qualitative
 */
export const CLASS_COLOURS: ClassColours = new Map([
   ["beagle", "#328"],
   ["boxer", "#8CE"],
   ["German_shepherd", "#4A9"],
   ["golden_retriever", "#173"],
   ["Irish_setter", "#993"],
   ["pug", "#DC7"],
   ["Siberian_husky", "#C67"],
   ["standard_poodle", "#825"],
   ["whippet", "#A49"],
   ["Yorkshire_terrier", "#DDD"]
])

/**
 * Gets the numeric index of the interface that the user should be shown for this iteration.
 *
 * @param iteration
 *          The iteration number.
 * @return
 *          The interface index.
 */
export function getInterfaceNumber(iteration: number): number {
    // Make sure the iteration is a number in [0, EXPERIMENT_MAX_ITERATION]
    if (!Number.isInteger(iteration) || iteration < 0 || iteration > EXPERIMENT_MAX_ITERATION) {
        throw new Error(`iteration must be an integer in [0, ${EXPERIMENT_MAX_ITERATION}], got ${iteration}`)
    }

    if (iteration === 0) return 0

    return Math.floor(1 + ((iteration - 1) / 3))
}

function getOrdering(ordering: number): readonly [PrelabelMode, PrelabelMode, PrelabelMode] {
    // Make sure the ordering is a number in [0, 6)
    if (!Number.isInteger(ordering) || ordering < 0 || ordering >= 6) {
        throw new Error(`ordering must be an integer in [0, 6), got ${ordering}`)
    }

    const orderings: { [ordering: number]: readonly [PrelabelMode, PrelabelMode, PrelabelMode] } = {
        0: ["None", "Single", "Example"],
        1: ["None", "Example", "Single"],
        2: ["Single", "None", "Example"],
        3: ["Single", "Example", "None"],
        4: ["Example", "None", "Single"],
        5: ["Example", "Single", "None"],
    }

    return orderings[ordering]
}

export function getPrelabelMode(iteration: number, ordering: number): PrelabelMode {
    const interface_number = getInterfaceNumber(iteration)

    if (interface_number === 0) return "Default"

    return getOrdering(ordering)[interface_number - 1]
}

export function getIndexOfPrelabelMode(
    prelabelMode: "None" | "Single" | "Example",
    ordering: number
): number {
    return getOrdering(ordering).indexOf(prelabelMode);
}

/**
 * Gets the path that a specific iteration of images is stored under on the server.
 *
 * @param iteration
 *          The iteration of images to get the path for, in [1, EXPERIMENT_MAX_ITERATION].
 * @return
 *          The path where the images for the given iteration are stored.
 */
export function getIterationPath(iteration: number): string {
    const interface_number = getInterfaceNumber(iteration)

    if (interface_number === 0) return "initial"

    const set_number = iteration % 3 === 0 ? 3 : iteration % 3

    return `i${interface_number}s${set_number}`
}

/**
 * Gets the files of a particular iteration.
 *
 * @param iteration
 *          The iteration, in [1, 20].
 * @return
 *          An array of objects describing the files in that iteration.
 */
export function getIterationFiles(iteration: number): {
    path: string,
    filename: string,
    label: string
}[] {
    const iterationPath = getIterationPath(iteration)

    const result: {
        path: string,
        filename: string,
        label: string
    }[] = []

    for (const label of CLASSES) {
        for (const filename of FILES[`${iterationPath}/${label}`]) {
            result.push(
                {
                    path: `${iterationPath}/${label}/${filename}`,
                    filename,
                    label
                }
            )
        }
    }

    return result
}

/**
 * Adds the files for the given iteration to a dataset.
 *
 * @param context
 *          The server to add the files to.
 * @param datasetPK
 *          The PK of the dataset to add the files to.
 * @param iteration
 *          The iteration of files.
 * @param stripLabels
 *          Whether to add the labels to the files as well.
 */
export async function addIterationFilesToDataset(
    context: UFDLServerContext,
    datasetPK: number,
    iteration: number,
    stripLabels: boolean = true
) {
    // Must be sequential as server can't handle concurrent
    await Promise.all(
        getIterationFiles(iteration).map(
            ({path, filename, label}) => {
                return addFileToDataset(
                    context,
                    path,
                    datasetPK,
                    filename,
                    stripLabels ? undefined : label
                )
            }
        )
    )
}

/**
 * Corrects the labels
 * @param context
 * @param datasetPK
 * @param iteration
 */
export async function correctIterationLabels(
    context: UFDLServerContext,
    datasetPK: number,
    iteration: number
) {
    await Promise.all(
        getIterationFiles(iteration).map(
            ({filename, label}) => {
                return ICDataset.set_categories(
                    context,
                    datasetPK,
                    {[filename]: [label]}
                )
            }
        )
    )
}

/**
 * Adds a specific dog file to a dataset.
 *
 * @param context
 *          The server to add the file to.
 * @param path
 *          The path from which to get the file.
 * @param datasetPK
 *          The dataset to add the file to.
 * @param filename
 *          The filename under which to add the file.
 * @param label
 *          The label to give the file, or undefined for no label.
 */
export async function addFileToDataset(
    context: UFDLServerContext,
    path: string,
    datasetPK: number,
    filename: string,
    label?: string
) {
    const imageSubject = responseForDownload(context.get.bind(context))(
        `v1/html/extra/dogs/${path}`,
        false
    )
    const imageData = await completionPromise(imageSubject)
    while (true) {
        try {
            await ICDataset.add_file(
                context,
                datasetPK,
                filename,
                imageData
            )
            break
        } catch {
            await new Promise(r => setTimeout(
                r,
                2000
            ));
        }
    }

    if (label === undefined) return

    while (true) {
        try {
            await ICDataset.set_categories(
                context,
                datasetPK,
                {[filename]: [label]}
            )
            break
        } catch {
            await new Promise(r => setTimeout(
                r,
                2000
            ));
        }
    }
}

/**
 * The files in the dataset, keyed by directory.
 */
export const FILES: { readonly [filepath: string]: readonly string[] } = {
"i1s1/beagle": [
"n02088364_15111.jpg",
"n02088364_6358.jpg"],

"i1s1/boxer": [
"n02108089_7259.jpg",
"n02108089_922.jpg"],

"i1s1/German_shepherd": [
"n02106662_22245.jpg",
"n02106662_590.jpg"],

"i1s1/golden_retriever": [
"n02099601_2359.jpg",
"n02099601_3360.jpg"],

"i1s1/Irish_setter": [
"n02100877_6417.jpg",
"n02100877_6436.jpg"],

"i1s1/pug": [
"n02110958_340.jpg",
"n02110958_8627.jpg"],

"i1s1/Siberian_husky": [
"n02110185_1497.jpg",
"n02110185_2604.jpg"],

"i1s1/standard_poodle": [
"n02113799_2068.jpg",
"n02113799_2333.jpg"],

"i1s1/whippet": [
"n02091134_13957.jpg",
"n02091134_9433.jpg"],

"i1s1/Yorkshire_terrier": [
"n02094433_6338.jpg",
"n02094433_8580.jpg"],

"i1s2/beagle": [
"n02088364_13428.jpg",
"n02088364_2415.jpg"],

"i1s2/boxer": [
"n02108089_540.jpg",
"n02108089_625.jpg"],

"i1s2/German_shepherd": [
"n02106662_16129.jpg",
"n02106662_18922.jpg"],

"i1s2/golden_retriever": [
"n02099601_1442.jpg",
"n02099601_7930.jpg"],

"i1s2/Irish_setter": [
"n02100877_585.jpg",
"n02100877_6462.jpg"],

"i1s2/pug": [
"n02110958_16471.jpg",
"n02110958_2410.jpg"],

"i1s2/Siberian_husky": [
"n02110185_6775.jpg",
"n02110185_7044.jpg"],

"i1s2/standard_poodle": [
"n02113799_300.jpg",
"n02113799_7448.jpg"],

"i1s2/whippet": [
"n02091134_3522.jpg",
"n02091134_732.jpg"],

"i1s2/Yorkshire_terrier": [
"n02094433_2564.jpg",
"n02094433_2685.jpg"],

"i1s3/beagle": [
"n02088364_12816.jpg",
"n02088364_17258.jpg"],

"i1s3/boxer": [
"n02108089_122.jpg",
"n02108089_9724.jpg"],

"i1s3/German_shepherd": [
"n02106662_2659.jpg",
"n02106662_695.jpg"],

"i1s3/golden_retriever": [
"n02099601_1324.jpg",
"n02099601_7993.jpg"],

"i1s3/Irish_setter": [
"n02100877_18.jpg",
"n02100877_384.jpg"],

"i1s3/pug": [
"n02110958_10.jpg",
"n02110958_14711.jpg"],

"i1s3/Siberian_husky": [
"n02110185_2672.jpg",
"n02110185_699.jpg"],

"i1s3/standard_poodle": [
"n02113799_3945.jpg",
"n02113799_525.jpg"],

"i1s3/whippet": [
"n02091134_4777.jpg",
"n02091134_7310.jpg"],

"i1s3/Yorkshire_terrier": [
"n02094433_3392.jpg",
"n02094433_5868.jpg"],

"i2s1/beagle": [
"n02088364_11136.jpg",
"n02088364_16165.jpg"],

"i2s1/boxer": [
"n02108089_1353.jpg",
"n02108089_268.jpg"],

"i2s1/German_shepherd": [
"n02106662_16014.jpg",
"n02106662_7545.jpg"],

"i2s1/golden_retriever": [
"n02099601_215.jpg",
"n02099601_3111.jpg"],

"i2s1/Irish_setter": [
"n02100877_4259.jpg",
"n02100877_4724.jpg"],

"i2s1/pug": [
"n02110958_12149.jpg",
"n02110958_12934.jpg"],

"i2s1/Siberian_husky": [
"n02110185_10175.jpg",
"n02110185_6263.jpg"],

"i2s1/standard_poodle": [
"n02113799_2733.jpg",
"n02113799_3278.jpg"],

"i2s1/whippet": [
"n02091134_12023.jpg",
"n02091134_14932.jpg"],

"i2s1/Yorkshire_terrier": [
"n02094433_1269.jpg",
"n02094433_1824.jpg"],

"i2s2/beagle": [
"n02088364_14690.jpg",
"n02088364_2502.jpg"],

"i2s2/boxer": [
"n02108089_10901.jpg",
"n02108089_1560.jpg"],

"i2s2/German_shepherd": [
"n02106662_6088.jpg",
"n02106662_7122.jpg"],

"i2s2/golden_retriever": [
"n02099601_2076.jpg",
"n02099601_3853.jpg"],

"i2s2/Irish_setter": [
"n02100877_229.jpg",
"n02100877_2824.jpg"],

"i2s2/pug": [
"n02110958_15014.jpg",
"n02110958_2745.jpg"],

"i2s2/Siberian_husky": [
"n02110185_2736.jpg",
"n02110185_8162.jpg"],

"i2s2/standard_poodle": [
"n02113799_2017.jpg",
"n02113799_2650.jpg"],

"i2s2/whippet": [
"n02091134_14579.jpg",
"n02091134_2235.jpg"],

"i2s2/Yorkshire_terrier": [
"n02094433_2537.jpg",
"n02094433_967.jpg"],

"i2s3/beagle": [
"n02088364_12291.jpg",
"n02088364_7784.jpg"],

"i2s3/boxer": [
"n02108089_2056.jpg",
"n02108089_836.jpg"],

"i2s3/German_shepherd": [
"n02106662_15666.jpg",
"n02106662_26549.jpg"],

"i2s3/golden_retriever": [
"n02099601_1743.jpg",
"n02099601_5160.jpg"],

"i2s3/Irish_setter": [
"n02100877_1965.jpg",
"n02100877_6747.jpg"],

"i2s3/pug": [
"n02110958_15351.jpg",
"n02110958_5069.jpg"],

"i2s3/Siberian_husky": [
"n02110185_14056.jpg",
"n02110185_5628.jpg"],

"i2s3/standard_poodle": [
"n02113799_253.jpg",
"n02113799_283.jpg"],

"i2s3/whippet": [
"n02091134_14090.jpg",
"n02091134_7528.jpg"],

"i2s3/Yorkshire_terrier": [
"n02094433_1177.jpg",
"n02094433_1376.jpg"],

"i3s1/beagle": [
"n02088364_10585.jpg",
"n02088364_14613.jpg"],

"i3s1/boxer": [
"n02108089_2653.jpg",
"n02108089_69.jpg"],

"i3s1/German_shepherd": [
"n02106662_7313.jpg",
"n02106662_7960.jpg"],

"i3s1/golden_retriever": [
"n02099601_2796.jpg",
"n02099601_5642.jpg"],

"i3s1/Irish_setter": [
"n02100877_370.jpg",
"n02100877_5998.jpg"],

"i3s1/pug": [
"n02110958_10842.jpg",
"n02110958_483.jpg"],

"i3s1/Siberian_husky": [
"n02110185_1439.jpg",
"n02110185_7936.jpg"],

"i3s1/standard_poodle": [
"n02113799_298.jpg",
"n02113799_311.jpg"],

"i3s1/whippet": [
"n02091134_15865.jpg",
"n02091134_19354.jpg"],

"i3s1/Yorkshire_terrier": [
"n02094433_3192.jpg",
"n02094433_3848.jpg"],

"i3s2/beagle": [
"n02088364_10206.jpg",
"n02088364_12131.jpg"],

"i3s2/boxer": [
"n02108089_1104.jpg",
"n02108089_5753.jpg"],

"i3s2/German_shepherd": [
"n02106662_10676.jpg",
"n02106662_1841.jpg"],

"i3s2/golden_retriever": [
"n02099601_447.jpg",
"n02099601_9153.jpg"],

"i3s2/Irish_setter": [
"n02100877_1062.jpg",
"n02100877_2298.jpg"],

"i3s2/pug": [
"n02110958_14265.jpg",
"n02110958_6598.jpg"],

"i3s2/Siberian_husky": [
"n02110185_12380.jpg",
"n02110185_4133.jpg"],

"i3s2/standard_poodle": [
"n02113799_333.jpg",
"n02113799_6447.jpg"],

"i3s2/whippet": [
"n02091134_15713.jpg",
"n02091134_524.jpg"],

"i3s2/Yorkshire_terrier": [
"n02094433_3400.jpg",
"n02094433_800.jpg"],

"i3s3/beagle": [
"n02088364_14548.jpg",
"n02088364_5826.jpg"],

"i3s3/boxer": [
"n02108089_2741.jpg",
"n02108089_4119.jpg"],

"i3s3/German_shepherd": [
"n02106662_1094.jpg",
"n02106662_4201.jpg"],

"i3s3/golden_retriever": [
"n02099601_345.jpg",
"n02099601_7227.jpg"],

"i3s3/Irish_setter": [
"n02100877_306.jpg",
"n02100877_5861.jpg"],

"i3s3/pug": [
"n02110958_25.jpg",
"n02110958_5621.jpg"],

"i3s3/Siberian_husky": [
"n02110185_13434.jpg",
"n02110185_1532.jpg"],

"i3s3/standard_poodle": [
"n02113799_3978.jpg",
"n02113799_5023.jpg"],

"i3s3/whippet": [
"n02091134_13334.jpg",
"n02091134_3562.jpg"],

"i3s3/Yorkshire_terrier": [
"n02094433_10126.jpg",
"n02094433_2328.jpg"],

"initial/beagle": [
"n02088364_14055.jpg",
"n02088364_15082.jpg"],

"initial/boxer": [
"n02108089_1003.jpg",
"n02108089_13738.jpg"],

"initial/German_shepherd": [
"n02106662_16817.jpg",
"n02106662_4402.jpg"],

"initial/golden_retriever": [
"n02099601_3004.jpg",
"n02099601_3388.jpg"],

"initial/Irish_setter": [
"n02100877_1453.jpg",
"n02100877_3804.jpg"],

"initial/pug": [
"n02110958_13581.jpg",
"n02110958_2611.jpg"],

"initial/Siberian_husky": [
"n02110185_1289.jpg",
"n02110185_1614.jpg"],

"initial/standard_poodle": [
"n02113799_1962.jpg",
"n02113799_936.jpg"],

"initial/whippet": [
"n02091134_4078.jpg",
"n02091134_4273.jpg"],

"initial/Yorkshire_terrier": [
"n02094433_194.jpg",
"n02094433_2340.jpg"]
}

/**
 * The true label for each file in the dataset.
 */
export const CORRECT_LABELS = {
    "n02106662_6443.jpg": "German_shepherd",
    "n02106662_17449.jpg": "German_shepherd",
    "n02106662_29517.jpg": "German_shepherd",
    "n02106662_5169.jpg": "German_shepherd",
    "n02106662_21715.jpg": "German_shepherd",
    "n02106662_22394.jpg": "German_shepherd",
    "n02106662_22456.jpg": "German_shepherd",
    "n02106662_22854.jpg": "German_shepherd",
    "n02106662_2358.jpg": "German_shepherd",
    "n02106662_19791.jpg": "German_shepherd",
    "n02106662_18405.jpg": "German_shepherd",
    "n02106662_20036.jpg": "German_shepherd",
    "n02106662_13050.jpg": "German_shepherd",
    "n02106662_22730.jpg": "German_shepherd",
    "n02106662_16418.jpg": "German_shepherd",
    "n02106662_2740.jpg": "German_shepherd",
    "n02106662_13912.jpg": "German_shepherd",
    "n02106662_3815.jpg": "German_shepherd",
    "n02106662_6966.jpg": "German_shepherd",
    "n02106662_26335.jpg": "German_shepherd",
    "n02106662_13178.jpg": "German_shepherd",
    "n02106662_20732.jpg": "German_shepherd",
    "n02106662_15813.jpg": "German_shepherd",
    "n02106662_7212.jpg": "German_shepherd",
    "n02106662_24110.jpg": "German_shepherd",
    "n02106662_597.jpg": "German_shepherd",
    "n02106662_11808.jpg": "German_shepherd",
    "n02106662_1451.jpg": "German_shepherd",
    "n02106662_10490.jpg": "German_shepherd",
    "n02106662_2631.jpg": "German_shepherd",
    "n02106662_13904.jpg": "German_shepherd",
    "n02106662_104.jpg": "German_shepherd",
    "n02106662_16891.jpg": "German_shepherd",
    "n02106662_12969.jpg": "German_shepherd",
    "n02106662_9735.jpg": "German_shepherd",
    "n02106662_4402.jpg": "German_shepherd",
    "n02106662_10552.jpg": "German_shepherd",
    "n02106662_22245.jpg": "German_shepherd",
    "n02106662_16129.jpg": "German_shepherd",
    "n02106662_21348.jpg": "German_shepherd",
    "n02106662_695.jpg": "German_shepherd",
    "n02106662_27186.jpg": "German_shepherd",
    "n02106662_16014.jpg": "German_shepherd",
    "n02106662_8870.jpg": "German_shepherd",
    "n02106662_6088.jpg": "German_shepherd",
    "n02106662_15666.jpg": "German_shepherd",
    "n02106662_9292.jpg": "German_shepherd",
    "n02106662_7313.jpg": "German_shepherd",
    "n02106662_1841.jpg": "German_shepherd",
    "n02106662_24786.jpg": "German_shepherd",
    "n02106662_4201.jpg": "German_shepherd",
    "n02106662_9994.jpg": "German_shepherd",
    "n02106662_10715.jpg": "German_shepherd",
    "n02106662_3431.jpg": "German_shepherd",
    "n02106662_16342.jpg": "German_shepherd",
    "n02106662_2810.jpg": "German_shepherd",
    "n02106662_18065.jpg": "German_shepherd",
    "n02106662_4498.jpg": "German_shepherd",
    "n02106662_5795.jpg": "German_shepherd",
    "n02106662_24774.jpg": "German_shepherd",
    "n02106662_2753.jpg": "German_shepherd",
    "n02106662_14247.jpg": "German_shepherd",
    "n02106662_17240.jpg": "German_shepherd",
    "n02106662_5929.jpg": "German_shepherd",
    "n02106662_3781.jpg": "German_shepherd",
    "n02106662_15647.jpg": "German_shepherd",
    "n02106662_1637.jpg": "German_shepherd",
    "n02106662_15429.jpg": "German_shepherd",
    "n02106662_23360.jpg": "German_shepherd",
    "n02106662_15398.jpg": "German_shepherd",
    "n02106662_9625.jpg": "German_shepherd",
    "n02106662_24758.jpg": "German_shepherd",
    "n02106662_7885.jpg": "German_shepherd",
    "n02106662_27393.jpg": "German_shepherd",
    "n02106662_9556.jpg": "German_shepherd",
    "n02106662_1812.jpg": "German_shepherd",
    "n02106662_18113.jpg": "German_shepherd",
    "n02106662_3953.jpg": "German_shepherd",
    "n02106662_855.jpg": "German_shepherd",
    "n02106662_20546.jpg": "German_shepherd",
    "n02106662_8246.jpg": "German_shepherd",
    "n02106662_2924.jpg": "German_shepherd",
    "n02106662_21432.jpg": "German_shepherd",
    "n02106662_15858.jpg": "German_shepherd",
    "n02106662_13368.jpg": "German_shepherd",
    "n02106662_466.jpg": "German_shepherd",
    "n02106662_2058.jpg": "German_shepherd",
    "n02106662_24577.jpg": "German_shepherd",
    "n02106662_22764.jpg": "German_shepherd",
    "n02106662_7238.jpg": "German_shepherd",
    "n02106662_25917.jpg": "German_shepherd",
    "n02106662_4059.jpg": "German_shepherd",
    "n02106662_13380.jpg": "German_shepherd",
    "n02106662_13123.jpg": "German_shepherd",
    "n02106662_10858.jpg": "German_shepherd",
    "n02106662_248.jpg": "German_shepherd",
    "n02106662_19641.jpg": "German_shepherd",
    "n02106662_9936.jpg": "German_shepherd",
    "n02106662_12116.jpg": "German_shepherd",
    "n02106662_16149.jpg": "German_shepherd",
    "n02106662_6931.jpg": "German_shepherd",
    "n02106662_19720.jpg": "German_shepherd",
    "n02106662_9481.jpg": "German_shepherd",
    "n02106662_27251.jpg": "German_shepherd",
    "n02106662_3260.jpg": "German_shepherd",
    "n02106662_19801.jpg": "German_shepherd",
    "n02106662_10338.jpg": "German_shepherd",
    "n02106662_25775.jpg": "German_shepherd",
    "n02106662_17446.jpg": "German_shepherd",
    "n02106662_14842.jpg": "German_shepherd",
    "n02106662_16817.jpg": "German_shepherd",
    "n02106662_25986.jpg": "German_shepherd",
    "n02106662_590.jpg": "German_shepherd",
    "n02106662_15107.jpg": "German_shepherd",
    "n02106662_18922.jpg": "German_shepherd",
    "n02106662_7168.jpg": "German_shepherd",
    "n02106662_2659.jpg": "German_shepherd",
    "n02106662_4522.jpg": "German_shepherd",
    "n02106662_7545.jpg": "German_shepherd",
    "n02106662_20711.jpg": "German_shepherd",
    "n02106662_7122.jpg": "German_shepherd",
    "n02106662_26549.jpg": "German_shepherd",
    "n02106662_320.jpg": "German_shepherd",
    "n02106662_7960.jpg": "German_shepherd",
    "n02106662_662.jpg": "German_shepherd",
    "n02106662_10676.jpg": "German_shepherd",
    "n02106662_12906.jpg": "German_shepherd",
    "n02106662_1094.jpg": "German_shepherd",
    "n02106662_16163.jpg": "German_shepherd",
    "n02106662_8002.jpg": "German_shepherd",
    "n02106662_23996.jpg": "German_shepherd",
    "n02106662_808.jpg": "German_shepherd",
    "n02106662_23691.jpg": "German_shepherd",
    "n02106662_11620.jpg": "German_shepherd",
    "n02106662_18268.jpg": "German_shepherd",
    "n02106662_10122.jpg": "German_shepherd",
    "n02106662_2884.jpg": "German_shepherd",
    "n02106662_9226.jpg": "German_shepherd",
    "n02106662_4021.jpg": "German_shepherd",
    "n02106662_146.jpg": "German_shepherd",
    "n02106662_684.jpg": "German_shepherd",
    "n02106662_24768.jpg": "German_shepherd",
    "n02106662_21094.jpg": "German_shepherd",
    "n02106662_3116.jpg": "German_shepherd",
    "n02106662_23196.jpg": "German_shepherd",
    "n02106662_12028.jpg": "German_shepherd",
    "n02106662_13599.jpg": "German_shepherd",
    "n02106662_6889.jpg": "German_shepherd",
    "n02110958_11732.jpg": "pug",
    "n02110958_13002.jpg": "pug",
    "n02110958_11675.jpg": "pug",
    "n02110958_2154.jpg": "pug",
    "n02110958_12025.jpg": "pug",
    "n02110958_7698.jpg": "pug",
    "n02110958_15216.jpg": "pug",
    "n02110958_15626.jpg": "pug",
    "n02110958_8979.jpg": "pug",
    "n02110958_11256.jpg": "pug",
    "n02110958_6792.jpg": "pug",
    "n02110958_2144.jpg": "pug",
    "n02110958_11870.jpg": "pug",
    "n02110958_11359.jpg": "pug",
    "n02110958_15527.jpg": "pug",
    "n02110958_15015.jpg": "pug",
    "n02110958_12275.jpg": "pug",
    "n02110958_237.jpg": "pug",
    "n02110958_7027.jpg": "pug",
    "n02110958_1108.jpg": "pug",
    "n02110958_4043.jpg": "pug",
    "n02110958_15422.jpg": "pug",
    "n02110958_13256.jpg": "pug",
    "n02110958_10186.jpg": "pug",
    "n02110958_2041.jpg": "pug",
    "n02110958_13276.jpg": "pug",
    "n02110958_14311.jpg": "pug",
    "n02110958_13597.jpg": "pug",
    "n02110958_16150.jpg": "pug",
    "n02110958_16087.jpg": "pug",
    "n02110958_4993.jpg": "pug",
    "n02110958_5555.jpg": "pug",
    "n02110958_14449.jpg": "pug",
    "n02110958_14984.jpg": "pug",
    "n02110958_12350.jpg": "pug",
    "n02110958_6627.jpg": "pug",
    "n02110958_16082.jpg": "pug",
    "n02110958_1639.jpg": "pug",
    "n02110958_15734.jpg": "pug",
    "n02110958_3644.jpg": "pug",
    "n02110958_13581.jpg": "pug",
    "n02110958_11239.jpg": "pug",
    "n02110958_8627.jpg": "pug",
    "n02110958_11825.jpg": "pug",
    "n02110958_16471.jpg": "pug",
    "n02110958_5834.jpg": "pug",
    "n02110958_10.jpg": "pug",
    "n02110958_14683.jpg": "pug",
    "n02110958_12149.jpg": "pug",
    "n02110958_13342.jpg": "pug",
    "n02110958_15014.jpg": "pug",
    "n02110958_15351.jpg": "pug",
    "n02110958_13469.jpg": "pug",
    "n02110958_10842.jpg": "pug",
    "n02110958_15932.jpg": "pug",
    "n02110958_14265.jpg": "pug",
    "n02110958_12625.jpg": "pug",
    "n02110958_25.jpg": "pug",
    "n02110958_15217.jpg": "pug",
    "n02110958_353.jpg": "pug",
    "n02110958_3938.jpg": "pug",
    "n02110958_1636.jpg": "pug",
    "n02110958_13364.jpg": "pug",
    "n02110958_16492.jpg": "pug",
    "n02110958_14179.jpg": "pug",
    "n02110958_4036.jpg": "pug",
    "n02110958_13993.jpg": "pug",
    "n02110958_10378.jpg": "pug",
    "n02110958_11083.jpg": "pug",
    "n02110958_5788.jpg": "pug",
    "n02110958_12807.jpg": "pug",
    "n02110958_15364.jpg": "pug",
    "n02110958_9008.jpg": "pug",
    "n02110958_13263.jpg": "pug",
    "n02110958_771.jpg": "pug",
    "n02110958_8814.jpg": "pug",
    "n02110958_11977.jpg": "pug",
    "n02110958_11979.jpg": "pug",
    "n02110958_3795.jpg": "pug",
    "n02110958_12080.jpg": "pug",
    "n02110958_8075.jpg": "pug",
    "n02110958_15120.jpg": "pug",
    "n02110958_12130.jpg": "pug",
    "n02110958_11261.jpg": "pug",
    "n02110958_12761.jpg": "pug",
    "n02110958_15969.jpg": "pug",
    "n02110958_12120.jpg": "pug",
    "n02110958_15129.jpg": "pug",
    "n02110958_14111.jpg": "pug",
    "n02110958_8583.jpg": "pug",
    "n02110958_9929.jpg": "pug",
    "n02110958_12819.jpg": "pug",
    "n02110958_15550.jpg": "pug",
    "n02110958_16178.jpg": "pug",
    "n02110958_326.jpg": "pug",
    "n02110958_14549.jpg": "pug",
    "n02110958_12589.jpg": "pug",
    "n02110958_9505.jpg": "pug",
    "n02110958_8513.jpg": "pug",
    "n02110958_1975.jpg": "pug",
    "n02110958_15171.jpg": "pug",
    "n02110958_14154.jpg": "pug",
    "n02110958_14768.jpg": "pug",
    "n02110958_14142.jpg": "pug",
    "n02110958_13051.jpg": "pug",
    "n02110958_12781.jpg": "pug",
    "n02110958_12260.jpg": "pug",
    "n02110958_13812.jpg": "pug",
    "n02110958_12447.jpg": "pug",
    "n02110958_14654.jpg": "pug",
    "n02110958_16433.jpg": "pug",
    "n02110958_13439.jpg": "pug",
    "n02110958_2777.jpg": "pug",
    "n02110958_6966.jpg": "pug",
    "n02110958_481.jpg": "pug",
    "n02110958_13930.jpg": "pug",
    "n02110958_476.jpg": "pug",
    "n02110958_14996.jpg": "pug",
    "n02110958_16426.jpg": "pug",
    "n02110958_2611.jpg": "pug",
    "n02110958_340.jpg": "pug",
    "n02110958_152.jpg": "pug",
    "n02110958_2410.jpg": "pug",
    "n02110958_3338.jpg": "pug",
    "n02110958_14711.jpg": "pug",
    "n02110958_2009.jpg": "pug",
    "n02110958_12934.jpg": "pug",
    "n02110958_16434.jpg": "pug",
    "n02110958_2745.jpg": "pug",
    "n02110958_6274.jpg": "pug",
    "n02110958_5069.jpg": "pug",
    "n02110958_15130.jpg": "pug",
    "n02110958_483.jpg": "pug",
    "n02110958_6598.jpg": "pug",
    "n02110958_609.jpg": "pug",
    "n02110958_5621.jpg": "pug",
    "n02110958_6098.jpg": "pug",
    "n02110958_8887.jpg": "pug",
    "n02110958_5912.jpg": "pug",
    "n02110958_13391.jpg": "pug",
    "n02110958_15873.jpg": "pug",
    "n02110958_12224.jpg": "pug",
    "n02110958_9642.jpg": "pug",
    "n02110958_13794.jpg": "pug",
    "n02110958_14536.jpg": "pug",
    "n02110958_15352.jpg": "pug",
    "n02110958_5976.jpg": "pug",
    "n02110958_7801.jpg": "pug",
    "n02110958_14017.jpg": "pug",
    "n02110958_16330.jpg": "pug",
    "n02110958_12808.jpg": "pug",
    "n02110958_8724.jpg": "pug",
    "n02110958_10193.jpg": "pug",
    "n02110958_14594.jpg": "pug",
    "n02110958_13995.jpg": "pug",
    "n02110958_15877.jpg": "pug",
    "n02110958_15449.jpg": "pug",
    "n02110958_14927.jpg": "pug",
    "n02110958_12432.jpg": "pug",
    "n02110958_15981.jpg": "pug",
    "n02110958_589.jpg": "pug",
    "n02110958_16447.jpg": "pug",
    "n02110958_11209.jpg": "pug",
    "n02110958_13455.jpg": "pug",
    "n02110958_11958.jpg": "pug",
    "n02110958_11306.jpg": "pug",
    "n02110958_11458.jpg": "pug",
    "n02110958_14563.jpg": "pug",
    "n02110958_4189.jpg": "pug",
    "n02110958_11288.jpg": "pug",
    "n02110958_16132.jpg": "pug",
    "n02110958_16334.jpg": "pug",
    "n02110958_14832.jpg": "pug",
    "n02110958_12860.jpg": "pug",
    "n02110958_16337.jpg": "pug",
    "n02110958_630.jpg": "pug",
    "n02110958_15538.jpg": "pug",
    "n02110958_15663.jpg": "pug",
    "n02110958_7255.jpg": "pug",
    "n02110958_4030.jpg": "pug",
    "n02110958_15722.jpg": "pug",
    "n02108089_3669.jpg": "boxer",
    "n02108089_2106.jpg": "boxer",
    "n02108089_4730.jpg": "boxer",
    "n02108089_1410.jpg": "boxer",
    "n02108089_1859.jpg": "boxer",
    "n02108089_813.jpg": "boxer",
    "n02108089_117.jpg": "boxer",
    "n02108089_1626.jpg": "boxer",
    "n02108089_1072.jpg": "boxer",
    "n02108089_125.jpg": "boxer",
    "n02108089_11032.jpg": "boxer",
    "n02108089_2723.jpg": "boxer",
    "n02108089_1575.jpg": "boxer",
    "n02108089_1355.jpg": "boxer",
    "n02108089_1159.jpg": "boxer",
    "n02108089_4076.jpg": "boxer",
    "n02108089_13738.jpg": "boxer",
    "n02108089_8739.jpg": "boxer",
    "n02108089_7259.jpg": "boxer",
    "n02108089_5977.jpg": "boxer",
    "n02108089_625.jpg": "boxer",
    "n02108089_1912.jpg": "boxer",
    "n02108089_122.jpg": "boxer",
    "n02108089_995.jpg": "boxer",
    "n02108089_1353.jpg": "boxer",
    "n02108089_1560.jpg": "boxer",
    "n02108089_2796.jpg": "boxer",
    "n02108089_836.jpg": "boxer",
    "n02108089_1418.jpg": "boxer",
    "n02108089_69.jpg": "boxer",
    "n02108089_11074.jpg": "boxer",
    "n02108089_5753.jpg": "boxer",
    "n02108089_12738.jpg": "boxer",
    "n02108089_4119.jpg": "boxer",
    "n02108089_2355.jpg": "boxer",
    "n02108089_3899.jpg": "boxer",
    "n02108089_149.jpg": "boxer",
    "n02108089_13340.jpg": "boxer",
    "n02108089_11687.jpg": "boxer",
    "n02108089_14074.jpg": "boxer",
    "n02108089_5043.jpg": "boxer",
    "n02108089_11001.jpg": "boxer",
    "n02108089_12232.jpg": "boxer",
    "n02108089_8969.jpg": "boxer",
    "n02108089_485.jpg": "boxer",
    "n02108089_1675.jpg": "boxer",
    "n02108089_1511.jpg": "boxer",
    "n02108089_4865.jpg": "boxer",
    "n02108089_3258.jpg": "boxer",
    "n02108089_4440.jpg": "boxer",
    "n02108089_3395.jpg": "boxer",
    "n02108089_2367.jpg": "boxer",
    "n02108089_3269.jpg": "boxer",
    "n02108089_1672.jpg": "boxer",
    "n02108089_3400.jpg": "boxer",
    "n02108089_3028.jpg": "boxer",
    "n02108089_849.jpg": "boxer",
    "n02108089_1956.jpg": "boxer",
    "n02108089_522.jpg": "boxer",
    "n02108089_5423.jpg": "boxer",
    "n02108089_2953.jpg": "boxer",
    "n02108089_11122.jpg": "boxer",
    "n02108089_1571.jpg": "boxer",
    "n02108089_13526.jpg": "boxer",
    "n02108089_1619.jpg": "boxer",
    "n02108089_2831.jpg": "boxer",
    "n02108089_15432.jpg": "boxer",
    "n02108089_2917.jpg": "boxer",
    "n02108089_4486.jpg": "boxer",
    "n02108089_3248.jpg": "boxer",
    "n02108089_13898.jpg": "boxer",
    "n02108089_14719.jpg": "boxer",
    "n02108089_6429.jpg": "boxer",
    "n02108089_10774.jpg": "boxer",
    "n02108089_6418.jpg": "boxer",
    "n02108089_2360.jpg": "boxer",
    "n02108089_9778.jpg": "boxer",
    "n02108089_2432.jpg": "boxer",
    "n02108089_1367.jpg": "boxer",
    "n02108089_2815.jpg": "boxer",
    "n02108089_1690.jpg": "boxer",
    "n02108089_7456.jpg": "boxer",
    "n02108089_395.jpg": "boxer",
    "n02108089_6583.jpg": "boxer",
    "n02108089_3547.jpg": "boxer",
    "n02108089_4989.jpg": "boxer",
    "n02108089_2608.jpg": "boxer",
    "n02108089_959.jpg": "boxer",
    "n02108089_3412.jpg": "boxer",
    "n02108089_2791.jpg": "boxer",
    "n02108089_931.jpg": "boxer",
    "n02108089_12827.jpg": "boxer",
    "n02108089_5614.jpg": "boxer",
    "n02108089_7319.jpg": "boxer",
    "n02108089_1003.jpg": "boxer",
    "n02108089_5266.jpg": "boxer",
    "n02108089_922.jpg": "boxer",
    "n02108089_11154.jpg": "boxer",
    "n02108089_540.jpg": "boxer",
    "n02108089_2740.jpg": "boxer",
    "n02108089_9724.jpg": "boxer",
    "n02108089_200.jpg": "boxer",
    "n02108089_268.jpg": "boxer",
    "n02108089_15702.jpg": "boxer",
    "n02108089_10901.jpg": "boxer",
    "n02108089_5599.jpg": "boxer",
    "n02108089_2056.jpg": "boxer",
    "n02108089_4158.jpg": "boxer",
    "n02108089_2653.jpg": "boxer",
    "n02108089_1104.jpg": "boxer",
    "n02108089_7853.jpg": "boxer",
    "n02108089_2741.jpg": "boxer",
    "n02108089_1031.jpg": "boxer",
    "n02108089_9045.jpg": "boxer",
    "n02108089_6295.jpg": "boxer",
    "n02108089_12739.jpg": "boxer",
    "n02108089_6008.jpg": "boxer",
    "n02108089_1654.jpg": "boxer",
    "n02108089_10229.jpg": "boxer",
    "n02108089_770.jpg": "boxer",
    "n02108089_4002.jpg": "boxer",
    "n02108089_13839.jpg": "boxer",
    "n02108089_3557.jpg": "boxer",
    "n02108089_2482.jpg": "boxer",
    "n02108089_530.jpg": "boxer",
    "n02108089_1357.jpg": "boxer",
    "n02108089_2670.jpg": "boxer",
    "n02108089_3365.jpg": "boxer",
    "n02108089_78.jpg": "boxer",
    "n02108089_5301.jpg": "boxer",
    "n02108089_2718.jpg": "boxer",
    "n02108089_2526.jpg": "boxer",
    "n02108089_11616.jpg": "boxer",
    "n02108089_1775.jpg": "boxer",
    "n02108089_14659.jpg": "boxer",
    "n02108089_1748.jpg": "boxer",
    "n02108089_9076.jpg": "boxer",
    "n02108089_7431.jpg": "boxer",
    "n02108089_3162.jpg": "boxer",
    "n02108089_926.jpg": "boxer",
    "n02108089_2007.jpg": "boxer",
    "n02108089_11875.jpg": "boxer",
    "n02108089_4042.jpg": "boxer",
    "n02108089_1757.jpg": "boxer",
    "n02108089_1.jpg": "boxer",
    "n02108089_4681.jpg": "boxer",
    "n02108089_14112.jpg": "boxer",
    "n02108089_3236.jpg": "boxer",
    "n02094433_2125.jpg": "Yorkshire_terrier",
    "n02094433_259.jpg": "Yorkshire_terrier",
    "n02094433_3480.jpg": "Yorkshire_terrier",
    "n02094433_2223.jpg": "Yorkshire_terrier",
    "n02094433_4028.jpg": "Yorkshire_terrier",
    "n02094433_3043.jpg": "Yorkshire_terrier",
    "n02094433_5176.jpg": "Yorkshire_terrier",
    "n02094433_3766.jpg": "Yorkshire_terrier",
    "n02094433_7445.jpg": "Yorkshire_terrier",
    "n02094433_3905.jpg": "Yorkshire_terrier",
    "n02094433_3088.jpg": "Yorkshire_terrier",
    "n02094433_4181.jpg": "Yorkshire_terrier",
    "n02094433_1324.jpg": "Yorkshire_terrier",
    "n02094433_2596.jpg": "Yorkshire_terrier",
    "n02094433_2483.jpg": "Yorkshire_terrier",
    "n02094433_2782.jpg": "Yorkshire_terrier",
    "n02094433_1772.jpg": "Yorkshire_terrier",
    "n02094433_2740.jpg": "Yorkshire_terrier",
    "n02094433_2127.jpg": "Yorkshire_terrier",
    "n02094433_3335.jpg": "Yorkshire_terrier",
    "n02094433_3655.jpg": "Yorkshire_terrier",
    "n02094433_6328.jpg": "Yorkshire_terrier",
    "n02094433_621.jpg": "Yorkshire_terrier",
    "n02094433_4198.jpg": "Yorkshire_terrier",
    "n02094433_2006.jpg": "Yorkshire_terrier",
    "n02094433_2340.jpg": "Yorkshire_terrier",
    "n02094433_2882.jpg": "Yorkshire_terrier",
    "n02094433_6338.jpg": "Yorkshire_terrier",
    "n02094433_2609.jpg": "Yorkshire_terrier",
    "n02094433_2564.jpg": "Yorkshire_terrier",
    "n02094433_199.jpg": "Yorkshire_terrier",
    "n02094433_3392.jpg": "Yorkshire_terrier",
    "n02094433_1269.jpg": "Yorkshire_terrier",
    "n02094433_962.jpg": "Yorkshire_terrier",
    "n02094433_2537.jpg": "Yorkshire_terrier",
    "n02094433_1030.jpg": "Yorkshire_terrier",
    "n02094433_1177.jpg": "Yorkshire_terrier",
    "n02094433_708.jpg": "Yorkshire_terrier",
    "n02094433_3848.jpg": "Yorkshire_terrier",
    "n02094433_5350.jpg": "Yorkshire_terrier",
    "n02094433_800.jpg": "Yorkshire_terrier",
    "n02094433_3812.jpg": "Yorkshire_terrier",
    "n02094433_2328.jpg": "Yorkshire_terrier",
    "n02094433_1211.jpg": "Yorkshire_terrier",
    "n02094433_10123.jpg": "Yorkshire_terrier",
    "n02094433_1868.jpg": "Yorkshire_terrier",
    "n02094433_716.jpg": "Yorkshire_terrier",
    "n02094433_4091.jpg": "Yorkshire_terrier",
    "n02094433_2973.jpg": "Yorkshire_terrier",
    "n02094433_3947.jpg": "Yorkshire_terrier",
    "n02094433_1483.jpg": "Yorkshire_terrier",
    "n02094433_515.jpg": "Yorkshire_terrier",
    "n02094433_7464.jpg": "Yorkshire_terrier",
    "n02094433_9618.jpg": "Yorkshire_terrier",
    "n02094433_4005.jpg": "Yorkshire_terrier",
    "n02094433_1539.jpg": "Yorkshire_terrier",
    "n02094433_6258.jpg": "Yorkshire_terrier",
    "n02094433_4588.jpg": "Yorkshire_terrier",
    "n02094433_2197.jpg": "Yorkshire_terrier",
    "n02094433_2519.jpg": "Yorkshire_terrier",
    "n02094433_1634.jpg": "Yorkshire_terrier",
    "n02094433_1765.jpg": "Yorkshire_terrier",
    "n02094433_7495.jpg": "Yorkshire_terrier",
    "n02094433_6672.jpg": "Yorkshire_terrier",
    "n02094433_4916.jpg": "Yorkshire_terrier",
    "n02094433_2643.jpg": "Yorkshire_terrier",
    "n02094433_795.jpg": "Yorkshire_terrier",
    "n02094433_8669.jpg": "Yorkshire_terrier",
    "n02094433_4248.jpg": "Yorkshire_terrier",
    "n02094433_1770.jpg": "Yorkshire_terrier",
    "n02094433_2229.jpg": "Yorkshire_terrier",
    "n02094433_3202.jpg": "Yorkshire_terrier",
    "n02094433_7827.jpg": "Yorkshire_terrier",
    "n02094433_7191.jpg": "Yorkshire_terrier",
    "n02094433_2105.jpg": "Yorkshire_terrier",
    "n02094433_2041.jpg": "Yorkshire_terrier",
    "n02094433_63.jpg": "Yorkshire_terrier",
    "n02094433_2022.jpg": "Yorkshire_terrier",
    "n02094433_2903.jpg": "Yorkshire_terrier",
    "n02094433_3604.jpg": "Yorkshire_terrier",
    "n02094433_5155.jpg": "Yorkshire_terrier",
    "n02094433_1849.jpg": "Yorkshire_terrier",
    "n02094433_2824.jpg": "Yorkshire_terrier",
    "n02094433_1219.jpg": "Yorkshire_terrier",
    "n02094433_2838.jpg": "Yorkshire_terrier",
    "n02094433_1525.jpg": "Yorkshire_terrier",
    "n02094433_10184.jpg": "Yorkshire_terrier",
    "n02094433_2748.jpg": "Yorkshire_terrier",
    "n02094433_3279.jpg": "Yorkshire_terrier",
    "n02094433_8419.jpg": "Yorkshire_terrier",
    "n02094433_4710.jpg": "Yorkshire_terrier",
    "n02094433_3010.jpg": "Yorkshire_terrier",
    "n02094433_2776.jpg": "Yorkshire_terrier",
    "n02094433_2759.jpg": "Yorkshire_terrier",
    "n02094433_719.jpg": "Yorkshire_terrier",
    "n02094433_9739.jpg": "Yorkshire_terrier",
    "n02094433_2349.jpg": "Yorkshire_terrier",
    "n02094433_5384.jpg": "Yorkshire_terrier",
    "n02094433_923.jpg": "Yorkshire_terrier",
    "n02094433_785.jpg": "Yorkshire_terrier",
    "n02094433_4167.jpg": "Yorkshire_terrier",
    "n02094433_96.jpg": "Yorkshire_terrier",
    "n02094433_4399.jpg": "Yorkshire_terrier",
    "n02094433_194.jpg": "Yorkshire_terrier",
    "n02094433_2919.jpg": "Yorkshire_terrier",
    "n02094433_8580.jpg": "Yorkshire_terrier",
    "n02094433_889.jpg": "Yorkshire_terrier",
    "n02094433_2685.jpg": "Yorkshire_terrier",
    "n02094433_730.jpg": "Yorkshire_terrier",
    "n02094433_5868.jpg": "Yorkshire_terrier",
    "n02094433_266.jpg": "Yorkshire_terrier",
    "n02094433_1824.jpg": "Yorkshire_terrier",
    "n02094433_701.jpg": "Yorkshire_terrier",
    "n02094433_967.jpg": "Yorkshire_terrier",
    "n02094433_5500.jpg": "Yorkshire_terrier",
    "n02094433_1376.jpg": "Yorkshire_terrier",
    "n02094433_3704.jpg": "Yorkshire_terrier",
    "n02094433_3192.jpg": "Yorkshire_terrier",
    "n02094433_3400.jpg": "Yorkshire_terrier",
    "n02094433_3117.jpg": "Yorkshire_terrier",
    "n02094433_10126.jpg": "Yorkshire_terrier",
    "n02094433_1301.jpg": "Yorkshire_terrier",
    "n02094433_668.jpg": "Yorkshire_terrier",
    "n02094433_3198.jpg": "Yorkshire_terrier",
    "n02094433_2901.jpg": "Yorkshire_terrier",
    "n02094433_4624.jpg": "Yorkshire_terrier",
    "n02094433_1210.jpg": "Yorkshire_terrier",
    "n02094433_2114.jpg": "Yorkshire_terrier",
    "n02094433_7394.jpg": "Yorkshire_terrier",
    "n02094433_3296.jpg": "Yorkshire_terrier",
    "n02094433_3983.jpg": "Yorkshire_terrier",
    "n02094433_1312.jpg": "Yorkshire_terrier",
    "n02094433_3878.jpg": "Yorkshire_terrier",
    "n02094433_8535.jpg": "Yorkshire_terrier",
    "n02094433_2401.jpg": "Yorkshire_terrier",
    "n02094433_745.jpg": "Yorkshire_terrier",
    "n02094433_7702.jpg": "Yorkshire_terrier",
    "n02094433_3640.jpg": "Yorkshire_terrier",
    "n02094433_2115.jpg": "Yorkshire_terrier",
    "n02094433_2417.jpg": "Yorkshire_terrier",
    "n02094433_3526.jpg": "Yorkshire_terrier",
    "n02094433_3560.jpg": "Yorkshire_terrier",
    "n02094433_478.jpg": "Yorkshire_terrier",
    "n02094433_4990.jpg": "Yorkshire_terrier",
    "n02094433_5356.jpg": "Yorkshire_terrier",
    "n02094433_3431.jpg": "Yorkshire_terrier",
    "n02094433_126.jpg": "Yorkshire_terrier",
    "n02094433_2678.jpg": "Yorkshire_terrier",
    "n02094433_4214.jpg": "Yorkshire_terrier",
    "n02094433_540.jpg": "Yorkshire_terrier",
    "n02094433_8977.jpg": "Yorkshire_terrier",
    "n02094433_2053.jpg": "Yorkshire_terrier",
    "n02094433_3613.jpg": "Yorkshire_terrier",
    "n02094433_3881.jpg": "Yorkshire_terrier",
    "n02094433_2375.jpg": "Yorkshire_terrier",
    "n02094433_225.jpg": "Yorkshire_terrier",
    "n02094433_2474.jpg": "Yorkshire_terrier",
    "n02094433_1869.jpg": "Yorkshire_terrier",
    "n02094433_1490.jpg": "Yorkshire_terrier",
    "n02091134_2568.jpg": "whippet",
    "n02091134_4099.jpg": "whippet",
    "n02091134_18472.jpg": "whippet",
    "n02091134_755.jpg": "whippet",
    "n02091134_125.jpg": "whippet",
    "n02091134_17638.jpg": "whippet",
    "n02091134_13376.jpg": "whippet",
    "n02091134_19124.jpg": "whippet",
    "n02091134_11307.jpg": "whippet",
    "n02091134_7748.jpg": "whippet",
    "n02091134_835.jpg": "whippet",
    "n02091134_1425.jpg": "whippet",
    "n02091134_4784.jpg": "whippet",
    "n02091134_232.jpg": "whippet",
    "n02091134_969.jpg": "whippet",
    "n02091134_14094.jpg": "whippet",
    "n02091134_17567.jpg": "whippet",
    "n02091134_7736.jpg": "whippet",
    "n02091134_10107.jpg": "whippet",
    "n02091134_14828.jpg": "whippet",
    "n02091134_15245.jpg": "whippet",
    "n02091134_13348.jpg": "whippet",
    "n02091134_18590.jpg": "whippet",
    "n02091134_4273.jpg": "whippet",
    "n02091134_15360.jpg": "whippet",
    "n02091134_9433.jpg": "whippet",
    "n02091134_15398.jpg": "whippet",
    "n02091134_732.jpg": "whippet",
    "n02091134_14047.jpg": "whippet",
    "n02091134_4777.jpg": "whippet",
    "n02091134_14932.jpg": "whippet",
    "n02091134_13143.jpg": "whippet",
    "n02091134_14579.jpg": "whippet",
    "n02091134_12375.jpg": "whippet",
    "n02091134_7528.jpg": "whippet",
    "n02091134_16336.jpg": "whippet",
    "n02091134_15865.jpg": "whippet",
    "n02091134_5630.jpg": "whippet",
    "n02091134_524.jpg": "whippet",
    "n02091134_16794.jpg": "whippet",
    "n02091134_13334.jpg": "whippet",
    "n02091134_13401.jpg": "whippet",
    "n02091134_12142.jpg": "whippet",
    "n02091134_17950.jpg": "whippet",
    "n02091134_18069.jpg": "whippet",
    "n02091134_14567.jpg": "whippet",
    "n02091134_16033.jpg": "whippet",
    "n02091134_13743.jpg": "whippet",
    "n02091134_7862.jpg": "whippet",
    "n02091134_11765.jpg": "whippet",
    "n02091134_7794.jpg": "whippet",
    "n02091134_5047.jpg": "whippet",
    "n02091134_6616.jpg": "whippet",
    "n02091134_13109.jpg": "whippet",
    "n02091134_17467.jpg": "whippet",
    "n02091134_12017.jpg": "whippet",
    "n02091134_9398.jpg": "whippet",
    "n02091134_14465.jpg": "whippet",
    "n02091134_12272.jpg": "whippet",
    "n02091134_12537.jpg": "whippet",
    "n02091134_2193.jpg": "whippet",
    "n02091134_3472.jpg": "whippet",
    "n02091134_12318.jpg": "whippet",
    "n02091134_4197.jpg": "whippet",
    "n02091134_12827.jpg": "whippet",
    "n02091134_9793.jpg": "whippet",
    "n02091134_16062.jpg": "whippet",
    "n02091134_16890.jpg": "whippet",
    "n02091134_16337.jpg": "whippet",
    "n02091134_9.jpg": "whippet",
    "n02091134_3685.jpg": "whippet",
    "n02091134_16201.jpg": "whippet",
    "n02091134_4470.jpg": "whippet",
    "n02091134_145.jpg": "whippet",
    "n02091134_17872.jpg": "whippet",
    "n02091134_842.jpg": "whippet",
    "n02091134_16904.jpg": "whippet",
    "n02091134_7145.jpg": "whippet",
    "n02091134_17608.jpg": "whippet",
    "n02091134_11956.jpg": "whippet",
    "n02091134_39.jpg": "whippet",
    "n02091134_15846.jpg": "whippet",
    "n02091134_10618.jpg": "whippet",
    "n02091134_9806.jpg": "whippet",
    "n02091134_2339.jpg": "whippet",
    "n02091134_20065.jpg": "whippet",
    "n02091134_14842.jpg": "whippet",
    "n02091134_15251.jpg": "whippet",
    "n02091134_2626.jpg": "whippet",
    "n02091134_12476.jpg": "whippet",
    "n02091134_6699.jpg": "whippet",
    "n02091134_7935.jpg": "whippet",
    "n02091134_17675.jpg": "whippet",
    "n02091134_6057.jpg": "whippet",
    "n02091134_7796.jpg": "whippet",
    "n02091134_14646.jpg": "whippet",
    "n02091134_682.jpg": "whippet",
    "n02091134_11775.jpg": "whippet",
    "n02091134_2665.jpg": "whippet",
    "n02091134_7661.jpg": "whippet",
    "n02091134_10395.jpg": "whippet",
    "n02091134_7606.jpg": "whippet",
    "n02091134_4078.jpg": "whippet",
    "n02091134_13957.jpg": "whippet",
    "n02091134_15827.jpg": "whippet",
    "n02091134_3522.jpg": "whippet",
    "n02091134_3263.jpg": "whippet",
    "n02091134_7310.jpg": "whippet",
    "n02091134_4149.jpg": "whippet",
    "n02091134_12023.jpg": "whippet",
    "n02091134_10521.jpg": "whippet",
    "n02091134_2235.jpg": "whippet",
    "n02091134_7567.jpg": "whippet",
    "n02091134_14090.jpg": "whippet",
    "n02091134_18392.jpg": "whippet",
    "n02091134_19354.jpg": "whippet",
    "n02091134_15713.jpg": "whippet",
    "n02091134_689.jpg": "whippet",
    "n02091134_3562.jpg": "whippet",
    "n02091134_9671.jpg": "whippet",
    "n02091134_15784.jpg": "whippet",
    "n02091134_6159.jpg": "whippet",
    "n02091134_13467.jpg": "whippet",
    "n02091134_14506.jpg": "whippet",
    "n02091134_11875.jpg": "whippet",
    "n02091134_16005.jpg": "whippet",
    "n02091134_14002.jpg": "whippet",
    "n02091134_12581.jpg": "whippet",
    "n02091134_15038.jpg": "whippet",
    "n02091134_1268.jpg": "whippet",
    "n02091134_738.jpg": "whippet",
    "n02091134_1129.jpg": "whippet",
    "n02091134_9740.jpg": "whippet",
    "n02091134_1131.jpg": "whippet",
    "n02091134_12138.jpg": "whippet",
    "n02091134_15210.jpg": "whippet",
    "n02091134_15876.jpg": "whippet",
    "n02091134_10219.jpg": "whippet",
    "n02091134_392.jpg": "whippet",
    "n02091134_18905.jpg": "whippet",
    "n02091134_13244.jpg": "whippet",
    "n02091134_10548.jpg": "whippet",
    "n02091134_16086.jpg": "whippet",
    "n02091134_14374.jpg": "whippet",
    "n02091134_10242.jpg": "whippet",
    "n02091134_13940.jpg": "whippet",
    "n02110185_9086.jpg": "Siberian_husky",
    "n02110185_5159.jpg": "Siberian_husky",
    "n02110185_14479.jpg": "Siberian_husky",
    "n02110185_10902.jpg": "Siberian_husky",
    "n02110185_10967.jpg": "Siberian_husky",
    "n02110185_8005.jpg": "Siberian_husky",
    "n02110185_5030.jpg": "Siberian_husky",
    "n02110185_7117.jpg": "Siberian_husky",
    "n02110185_6438.jpg": "Siberian_husky",
    "n02110185_12748.jpg": "Siberian_husky",
    "n02110185_11287.jpg": "Siberian_husky",
    "n02110185_8216.jpg": "Siberian_husky",
    "n02110185_56.jpg": "Siberian_husky",
    "n02110185_7210.jpg": "Siberian_husky",
    "n02110185_1511.jpg": "Siberian_husky",
    "n02110185_9712.jpg": "Siberian_husky",
    "n02110185_8749.jpg": "Siberian_husky",
    "n02110185_10898.jpg": "Siberian_husky",
    "n02110185_7379.jpg": "Siberian_husky",
    "n02110185_9177.jpg": "Siberian_husky",
    "n02110185_4677.jpg": "Siberian_husky",
    "n02110185_11626.jpg": "Siberian_husky",
    "n02110185_5871.jpg": "Siberian_husky",
    "n02110185_8397.jpg": "Siberian_husky",
    "n02110185_11114.jpg": "Siberian_husky",
    "n02110185_14906.jpg": "Siberian_husky",
    "n02110185_11409.jpg": "Siberian_husky",
    "n02110185_9334.jpg": "Siberian_husky",
    "n02110185_2593.jpg": "Siberian_husky",
    "n02110185_7888.jpg": "Siberian_husky",
    "n02110185_4294.jpg": "Siberian_husky",
    "n02110185_12478.jpg": "Siberian_husky",
    "n02110185_353.jpg": "Siberian_husky",
    "n02110185_6850.jpg": "Siberian_husky",
    "n02110185_1289.jpg": "Siberian_husky",
    "n02110185_13197.jpg": "Siberian_husky",
    "n02110185_1497.jpg": "Siberian_husky",
    "n02110185_9855.jpg": "Siberian_husky",
    "n02110185_7044.jpg": "Siberian_husky",
    "n02110185_58.jpg": "Siberian_husky",
    "n02110185_699.jpg": "Siberian_husky",
    "n02110185_7762.jpg": "Siberian_husky",
    "n02110185_10175.jpg": "Siberian_husky",
    "n02110185_2736.jpg": "Siberian_husky",
    "n02110185_4694.jpg": "Siberian_husky",
    "n02110185_14056.jpg": "Siberian_husky",
    "n02110185_14061.jpg": "Siberian_husky",
    "n02110185_7936.jpg": "Siberian_husky",
    "n02110185_11396.jpg": "Siberian_husky",
    "n02110185_4133.jpg": "Siberian_husky",
    "n02110185_6409.jpg": "Siberian_husky",
    "n02110185_1532.jpg": "Siberian_husky",
    "n02110185_184.jpg": "Siberian_husky",
    "n02110185_9429.jpg": "Siberian_husky",
    "n02110185_5973.jpg": "Siberian_husky",
    "n02110185_7329.jpg": "Siberian_husky",
    "n02110185_3328.jpg": "Siberian_husky",
    "n02110185_7246.jpg": "Siberian_husky",
    "n02110185_1794.jpg": "Siberian_husky",
    "n02110185_1178.jpg": "Siberian_husky",
    "n02110185_1748.jpg": "Siberian_husky",
    "n02110185_10116.jpg": "Siberian_husky",
    "n02110185_13855.jpg": "Siberian_husky",
    "n02110185_11636.jpg": "Siberian_husky",
    "n02110185_14650.jpg": "Siberian_husky",
    "n02110185_14283.jpg": "Siberian_husky",
    "n02110185_9975.jpg": "Siberian_husky",
    "n02110185_5624.jpg": "Siberian_husky",
    "n02110185_11635.jpg": "Siberian_husky",
    "n02110185_13282.jpg": "Siberian_husky",
    "n02110185_3406.jpg": "Siberian_husky",
    "n02110185_12441.jpg": "Siberian_husky",
    "n02110185_7980.jpg": "Siberian_husky",
    "n02110185_6746.jpg": "Siberian_husky",
    "n02110185_4906.jpg": "Siberian_husky",
    "n02110185_3540.jpg": "Siberian_husky",
    "n02110185_388.jpg": "Siberian_husky",
    "n02110185_14766.jpg": "Siberian_husky",
    "n02110185_13942.jpg": "Siberian_husky",
    "n02110185_9396.jpg": "Siberian_husky",
    "n02110185_12678.jpg": "Siberian_husky",
    "n02110185_5716.jpg": "Siberian_husky",
    "n02110185_8966.jpg": "Siberian_husky",
    "n02110185_3589.jpg": "Siberian_husky",
    "n02110185_12120.jpg": "Siberian_husky",
    "n02110185_14560.jpg": "Siberian_husky",
    "n02110185_2701.jpg": "Siberian_husky",
    "n02110185_14597.jpg": "Siberian_husky",
    "n02110185_11131.jpg": "Siberian_husky",
    "n02110185_13794.jpg": "Siberian_husky",
    "n02110185_8923.jpg": "Siberian_husky",
    "n02110185_4186.jpg": "Siberian_husky",
    "n02110185_8154.jpg": "Siberian_husky",
    "n02110185_698.jpg": "Siberian_husky",
    "n02110185_1552.jpg": "Siberian_husky",
    "n02110185_5495.jpg": "Siberian_husky",
    "n02110185_4115.jpg": "Siberian_husky",
    "n02110185_8748.jpg": "Siberian_husky",
    "n02110185_4522.jpg": "Siberian_husky",
    "n02110185_3291.jpg": "Siberian_husky",
    "n02110185_11773.jpg": "Siberian_husky",
    "n02110185_13127.jpg": "Siberian_husky",
    "n02110185_3808.jpg": "Siberian_husky",
    "n02110185_2614.jpg": "Siberian_husky",
    "n02110185_5622.jpg": "Siberian_husky",
    "n02110185_4030.jpg": "Siberian_husky",
    "n02110185_10273.jpg": "Siberian_husky",
    "n02110185_9846.jpg": "Siberian_husky",
    "n02110185_9194.jpg": "Siberian_husky",
    "n02110185_1469.jpg": "Siberian_husky",
    "n02110185_14289.jpg": "Siberian_husky",
    "n02110185_11580.jpg": "Siberian_husky",
    "n02110185_2820.jpg": "Siberian_husky",
    "n02110185_1614.jpg": "Siberian_husky",
    "n02110185_2604.jpg": "Siberian_husky",
    "n02110185_4060.jpg": "Siberian_husky",
    "n02110185_6775.jpg": "Siberian_husky",
    "n02110185_11445.jpg": "Siberian_husky",
    "n02110185_2672.jpg": "Siberian_husky",
    "n02110185_9461.jpg": "Siberian_husky",
    "n02110185_6263.jpg": "Siberian_husky",
    "n02110185_6473.jpg": "Siberian_husky",
    "n02110185_8162.jpg": "Siberian_husky",
    "n02110185_6780.jpg": "Siberian_husky",
    "n02110185_5628.jpg": "Siberian_husky",
    "n02110185_13704.jpg": "Siberian_husky",
    "n02110185_1439.jpg": "Siberian_husky",
    "n02110185_12380.jpg": "Siberian_husky",
    "n02110185_10875.jpg": "Siberian_husky",
    "n02110185_13434.jpg": "Siberian_husky",
    "n02110185_8708.jpg": "Siberian_husky",
    "n02110185_5143.jpg": "Siberian_husky",
    "n02110185_6351.jpg": "Siberian_husky",
    "n02110185_5392.jpg": "Siberian_husky",
    "n02110185_7564.jpg": "Siberian_husky",
    "n02110185_8564.jpg": "Siberian_husky",
    "n02110185_14594.jpg": "Siberian_husky",
    "n02110185_15019.jpg": "Siberian_husky",
    "n02110185_1164.jpg": "Siberian_husky",
    "n02110185_1534.jpg": "Siberian_husky",
    "n02110185_120.jpg": "Siberian_husky",
    "n02110185_13187.jpg": "Siberian_husky",
    "n02110185_11783.jpg": "Siberian_husky",
    "n02110185_10955.jpg": "Siberian_husky",
    "n02110185_13821.jpg": "Siberian_husky",
    "n02110185_2941.jpg": "Siberian_husky",
    "n02110185_1338.jpg": "Siberian_husky",
    "n02110185_15063.jpg": "Siberian_husky",
    "n02110185_11841.jpg": "Siberian_husky",
    "n02110185_7879.jpg": "Siberian_husky",
    "n02110185_13423.jpg": "Siberian_husky",
    "n02110185_8360.jpg": "Siberian_husky",
    "n02110185_7413.jpg": "Siberian_husky",
    "n02110185_2446.jpg": "Siberian_husky",
    "n02110185_10047.jpg": "Siberian_husky",
    "n02110185_519.jpg": "Siberian_husky",
    "n02110185_712.jpg": "Siberian_husky",
    "n02110185_248.jpg": "Siberian_husky",
    "n02110185_1598.jpg": "Siberian_husky",
    "n02110185_14523.jpg": "Siberian_husky",
    "n02110185_10171.jpg": "Siberian_husky",
    "n02110185_1066.jpg": "Siberian_husky",
    "n02110185_2728.jpg": "Siberian_husky",
    "n02110185_725.jpg": "Siberian_husky",
    "n02110185_12498.jpg": "Siberian_husky",
    "n02110185_10849.jpg": "Siberian_husky",
    "n02110185_8600.jpg": "Siberian_husky",
    "n02110185_8860.jpg": "Siberian_husky",
    "n02110185_8327.jpg": "Siberian_husky",
    "n02110185_2368.jpg": "Siberian_husky",
    "n02110185_10597.jpg": "Siberian_husky",
    "n02113799_448.jpg": "standard_poodle",
    "n02113799_2187.jpg": "standard_poodle",
    "n02113799_1922.jpg": "standard_poodle",
    "n02113799_336.jpg": "standard_poodle",
    "n02113799_895.jpg": "standard_poodle",
    "n02113799_4046.jpg": "standard_poodle",
    "n02113799_4491.jpg": "standard_poodle",
    "n02113799_4904.jpg": "standard_poodle",
    "n02113799_4248.jpg": "standard_poodle",
    "n02113799_5009.jpg": "standard_poodle",
    "n02113799_2600.jpg": "standard_poodle",
    "n02113799_1864.jpg": "standard_poodle",
    "n02113799_1532.jpg": "standard_poodle",
    "n02113799_2746.jpg": "standard_poodle",
    "n02113799_1444.jpg": "standard_poodle",
    "n02113799_1316.jpg": "standard_poodle",
    "n02113799_6727.jpg": "standard_poodle",
    "n02113799_2096.jpg": "standard_poodle",
    "n02113799_4143.jpg": "standard_poodle",
    "n02113799_273.jpg": "standard_poodle",
    "n02113799_1962.jpg": "standard_poodle",
    "n02113799_1646.jpg": "standard_poodle",
    "n02113799_2068.jpg": "standard_poodle",
    "n02113799_2729.jpg": "standard_poodle",
    "n02113799_7448.jpg": "standard_poodle",
    "n02113799_3356.jpg": "standard_poodle",
    "n02113799_525.jpg": "standard_poodle",
    "n02113799_2478.jpg": "standard_poodle",
    "n02113799_3278.jpg": "standard_poodle",
    "n02113799_2650.jpg": "standard_poodle",
    "n02113799_1976.jpg": "standard_poodle",
    "n02113799_253.jpg": "standard_poodle",
    "n02113799_4458.jpg": "standard_poodle",
    "n02113799_298.jpg": "standard_poodle",
    "n02113799_341.jpg": "standard_poodle",
    "n02113799_6447.jpg": "standard_poodle",
    "n02113799_153.jpg": "standard_poodle",
    "n02113799_5023.jpg": "standard_poodle",
    "n02113799_5514.jpg": "standard_poodle",
    "n02113799_5227.jpg": "standard_poodle",
    "n02113799_7121.jpg": "standard_poodle",
    "n02113799_7130.jpg": "standard_poodle",
    "n02113799_6382.jpg": "standard_poodle",
    "n02113799_4557.jpg": "standard_poodle",
    "n02113799_4499.jpg": "standard_poodle",
    "n02113799_815.jpg": "standard_poodle",
    "n02113799_5975.jpg": "standard_poodle",
    "n02113799_1155.jpg": "standard_poodle",
    "n02113799_7258.jpg": "standard_poodle",
    "n02113799_2073.jpg": "standard_poodle",
    "n02113799_589.jpg": "standard_poodle",
    "n02113799_2648.jpg": "standard_poodle",
    "n02113799_6984.jpg": "standard_poodle",
    "n02113799_2043.jpg": "standard_poodle",
    "n02113799_2248.jpg": "standard_poodle",
    "n02113799_1537.jpg": "standard_poodle",
    "n02113799_4604.jpg": "standard_poodle",
    "n02113799_3055.jpg": "standard_poodle",
    "n02113799_1798.jpg": "standard_poodle",
    "n02113799_7438.jpg": "standard_poodle",
    "n02113799_6116.jpg": "standard_poodle",
    "n02113799_4761.jpg": "standard_poodle",
    "n02113799_6740.jpg": "standard_poodle",
    "n02113799_419.jpg": "standard_poodle",
    "n02113799_254.jpg": "standard_poodle",
    "n02113799_1906.jpg": "standard_poodle",
    "n02113799_1572.jpg": "standard_poodle",
    "n02113799_2325.jpg": "standard_poodle",
    "n02113799_6634.jpg": "standard_poodle",
    "n02113799_4642.jpg": "standard_poodle",
    "n02113799_1328.jpg": "standard_poodle",
    "n02113799_5704.jpg": "standard_poodle",
    "n02113799_2765.jpg": "standard_poodle",
    "n02113799_7092.jpg": "standard_poodle",
    "n02113799_1183.jpg": "standard_poodle",
    "n02113799_5976.jpg": "standard_poodle",
    "n02113799_2369.jpg": "standard_poodle",
    "n02113799_1207.jpg": "standard_poodle",
    "n02113799_7649.jpg": "standard_poodle",
    "n02113799_801.jpg": "standard_poodle",
    "n02113799_961.jpg": "standard_poodle",
    "n02113799_3695.jpg": "standard_poodle",
    "n02113799_204.jpg": "standard_poodle",
    "n02113799_1439.jpg": "standard_poodle",
    "n02113799_2292.jpg": "standard_poodle",
    "n02113799_5372.jpg": "standard_poodle",
    "n02113799_156.jpg": "standard_poodle",
    "n02113799_2321.jpg": "standard_poodle",
    "n02113799_1743.jpg": "standard_poodle",
    "n02113799_447.jpg": "standard_poodle",
    "n02113799_1144.jpg": "standard_poodle",
    "n02113799_1568.jpg": "standard_poodle",
    "n02113799_1395.jpg": "standard_poodle",
    "n02113799_2814.jpg": "standard_poodle",
    "n02113799_848.jpg": "standard_poodle",
    "n02113799_6304.jpg": "standard_poodle",
    "n02113799_1518.jpg": "standard_poodle",
    "n02113799_4946.jpg": "standard_poodle",
    "n02113799_4740.jpg": "standard_poodle",
    "n02113799_936.jpg": "standard_poodle",
    "n02113799_4448.jpg": "standard_poodle",
    "n02113799_2333.jpg": "standard_poodle",
    "n02113799_300.jpg": "standard_poodle",
    "n02113799_5267.jpg": "standard_poodle",
    "n02113799_3945.jpg": "standard_poodle",
    "n02113799_1121.jpg": "standard_poodle",
    "n02113799_2733.jpg": "standard_poodle",
    "n02113799_1474.jpg": "standard_poodle",
    "n02113799_2017.jpg": "standard_poodle",
    "n02113799_5157.jpg": "standard_poodle",
    "n02113799_283.jpg": "standard_poodle",
    "n02113799_489.jpg": "standard_poodle",
    "n02113799_311.jpg": "standard_poodle",
    "n02113799_2426.jpg": "standard_poodle",
    "n02113799_333.jpg": "standard_poodle",
    "n02113799_3978.jpg": "standard_poodle",
    "n02113799_1057.jpg": "standard_poodle",
    "n02113799_5600.jpg": "standard_poodle",
    "n02113799_6448.jpg": "standard_poodle",
    "n02113799_5986.jpg": "standard_poodle",
    "n02113799_1980.jpg": "standard_poodle",
    "n02113799_5720.jpg": "standard_poodle",
    "n02113799_7726.jpg": "standard_poodle",
    "n02113799_963.jpg": "standard_poodle",
    "n02113799_6715.jpg": "standard_poodle",
    "n02113799_7299.jpg": "standard_poodle",
    "n02113799_983.jpg": "standard_poodle",
    "n02113799_2037.jpg": "standard_poodle",
    "n02113799_1728.jpg": "standard_poodle",
    "n02113799_1696.jpg": "standard_poodle",
    "n02113799_2504.jpg": "standard_poodle",
    "n02113799_2139.jpg": "standard_poodle",
    "n02113799_4454.jpg": "standard_poodle",
    "n02113799_1140.jpg": "standard_poodle",
    "n02113799_911.jpg": "standard_poodle",
    "n02113799_639.jpg": "standard_poodle",
    "n02113799_2280.jpg": "standard_poodle",
    "n02113799_923.jpg": "standard_poodle",
    "n02113799_1793.jpg": "standard_poodle",
    "n02113799_871.jpg": "standard_poodle",
    "n02113799_6730.jpg": "standard_poodle",
    "n02113799_2291.jpg": "standard_poodle",
    "n02113799_3054.jpg": "standard_poodle",
    "n02113799_6819.jpg": "standard_poodle",
    "n02113799_6891.jpg": "standard_poodle",
    "n02113799_1727.jpg": "standard_poodle",
    "n02088364_17534.jpg": "beagle",
    "n02088364_427.jpg": "beagle",
    "n02088364_13944.jpg": "beagle",
    "n02088364_852.jpg": "beagle",
    "n02088364_16519.jpg": "beagle",
    "n02088364_11836.jpg": "beagle",
    "n02088364_4493.jpg": "beagle",
    "n02088364_17294.jpg": "beagle",
    "n02088364_2661.jpg": "beagle",
    "n02088364_17474.jpg": "beagle",
    "n02088364_2360.jpg": "beagle",
    "n02088364_8820.jpg": "beagle",
    "n02088364_14968.jpg": "beagle",
    "n02088364_8713.jpg": "beagle",
    "n02088364_10947.jpg": "beagle",
    "n02088364_14220.jpg": "beagle",
    "n02088364_12972.jpg": "beagle",
    "n02088364_16060.jpg": "beagle",
    "n02088364_12869.jpg": "beagle",
    "n02088364_5572.jpg": "beagle",
    "n02088364_5090.jpg": "beagle",
    "n02088364_11828.jpg": "beagle",
    "n02088364_17766.jpg": "beagle",
    "n02088364_16502.jpg": "beagle",
    "n02088364_14369.jpg": "beagle",
    "n02088364_10296.jpg": "beagle",
    "n02088364_14394.jpg": "beagle",
    "n02088364_12745.jpg": "beagle",
    "n02088364_13128.jpg": "beagle",
    "n02088364_16689.jpg": "beagle",
    "n02088364_17935.jpg": "beagle",
    "n02088364_14055.jpg": "beagle",
    "n02088364_9318.jpg": "beagle",
    "n02088364_6358.jpg": "beagle",
    "n02088364_13627.jpg": "beagle",
    "n02088364_2415.jpg": "beagle",
    "n02088364_4823.jpg": "beagle",
    "n02088364_17258.jpg": "beagle",
    "n02088364_11930.jpg": "beagle",
    "n02088364_11136.jpg": "beagle",
    "n02088364_15787.jpg": "beagle",
    "n02088364_14690.jpg": "beagle",
    "n02088364_7784.jpg": "beagle",
    "n02088364_2572.jpg": "beagle",
    "n02088364_10585.jpg": "beagle",
    "n02088364_14095.jpg": "beagle",
    "n02088364_10206.jpg": "beagle",
    "n02088364_14863.jpg": "beagle",
    "n02088364_14548.jpg": "beagle",
    "n02088364_11711.jpg": "beagle",
    "n02088364_13478.jpg": "beagle",
    "n02088364_13028.jpg": "beagle",
    "n02088364_16635.jpg": "beagle",
    "n02088364_16695.jpg": "beagle",
    "n02088364_2840.jpg": "beagle",
    "n02088364_16508.jpg": "beagle",
    "n02088364_769.jpg": "beagle",
    "n02088364_17530.jpg": "beagle",
    "n02088364_15093.jpg": "beagle",
    "n02088364_12713.jpg": "beagle",
    "n02088364_17479.jpg": "beagle",
    "n02088364_14079.jpg": "beagle",
    "n02088364_876.jpg": "beagle",
    "n02088364_10798.jpg": "beagle",
    "n02088364_4281.jpg": "beagle",
    "n02088364_1507.jpg": "beagle",
    "n02088364_5427.jpg": "beagle",
    "n02088364_4473.jpg": "beagle",
    "n02088364_2143.jpg": "beagle",
    "n02088364_17689.jpg": "beagle",
    "n02088364_4237.jpg": "beagle",
    "n02088364_9520.jpg": "beagle",
    "n02088364_17406.jpg": "beagle",
    "n02088364_2652.jpg": "beagle",
    "n02088364_13214.jpg": "beagle",
    "n02088364_12397.jpg": "beagle",
    "n02088364_2499.jpg": "beagle",
    "n02088364_6089.jpg": "beagle",
    "n02088364_14911.jpg": "beagle",
    "n02088364_7324.jpg": "beagle",
    "n02088364_14892.jpg": "beagle",
    "n02088364_4052.jpg": "beagle",
    "n02088364_6547.jpg": "beagle",
    "n02088364_13464.jpg": "beagle",
    "n02088364_2106.jpg": "beagle",
    "n02088364_15315.jpg": "beagle",
    "n02088364_6211.jpg": "beagle",
    "n02088364_11231.jpg": "beagle",
    "n02088364_6866.jpg": "beagle",
    "n02088364_959.jpg": "beagle",
    "n02088364_17314.jpg": "beagle",
    "n02088364_11391.jpg": "beagle",
    "n02088364_16881.jpg": "beagle",
    "n02088364_16985.jpg": "beagle",
    "n02088364_15690.jpg": "beagle",
    "n02088364_13050.jpg": "beagle",
    "n02088364_17167.jpg": "beagle",
    "n02088364_2000.jpg": "beagle",
    "n02088364_16065.jpg": "beagle",
    "n02088364_18403.jpg": "beagle",
    "n02088364_14779.jpg": "beagle",
    "n02088364_11147.jpg": "beagle",
    "n02088364_4879.jpg": "beagle",
    "n02088364_8612.jpg": "beagle",
    "n02088364_14702.jpg": "beagle",
    "n02088364_5123.jpg": "beagle",
    "n02088364_3758.jpg": "beagle",
    "n02088364_12154.jpg": "beagle",
    "n02088364_6109.jpg": "beagle",
    "n02088364_13572.jpg": "beagle",
    "n02088364_15082.jpg": "beagle",
    "n02088364_3171.jpg": "beagle",
    "n02088364_15111.jpg": "beagle",
    "n02088364_1128.jpg": "beagle",
    "n02088364_13428.jpg": "beagle",
    "n02088364_12816.jpg": "beagle",
    "n02088364_12213.jpg": "beagle",
    "n02088364_16165.jpg": "beagle",
    "n02088364_13981.jpg": "beagle",
    "n02088364_2502.jpg": "beagle",
    "n02088364_14663.jpg": "beagle",
    "n02088364_12291.jpg": "beagle",
    "n02088364_8443.jpg": "beagle",
    "n02088364_14613.jpg": "beagle",
    "n02088364_4527.jpg": "beagle",
    "n02088364_12131.jpg": "beagle",
    "n02088364_9825.jpg": "beagle",
    "n02088364_5826.jpg": "beagle",
    "n02088364_129.jpg": "beagle",
    "n02088364_16721.jpg": "beagle",
    "n02088364_13484.jpg": "beagle",
    "n02088364_13630.jpg": "beagle",
    "n02088364_16207.jpg": "beagle",
    "n02088364_12920.jpg": "beagle",
    "n02088364_9652.jpg": "beagle",
    "n02088364_8871.jpg": "beagle",
    "n02088364_5147.jpg": "beagle",
    "n02088364_7247.jpg": "beagle",
    "n02088364_1384.jpg": "beagle",
    "n02088364_13682.jpg": "beagle",
    "n02088364_16588.jpg": "beagle",
    "n02088364_17473.jpg": "beagle",
    "n02088364_15370.jpg": "beagle",
    "n02088364_7927.jpg": "beagle",
    "n02088364_12334.jpg": "beagle",
    "n02088364_15036.jpg": "beagle",
    "n02088364_10575.jpg": "beagle",
    "n02088364_11458.jpg": "beagle",
    "n02088364_4706.jpg": "beagle",
    "n02088364_2019.jpg": "beagle",
    "n02088364_6611.jpg": "beagle",
    "n02088364_11698.jpg": "beagle",
    "n02088364_12124.jpg": "beagle",
    "n02088364_13236.jpg": "beagle",
    "n02088364_12178.jpg": "beagle",
    "n02088364_11509.jpg": "beagle",
    "n02088364_2566.jpg": "beagle",
    "n02088364_9650.jpg": "beagle",
    "n02088364_12440.jpg": "beagle",
    "n02088364_17170.jpg": "beagle",
    "n02088364_13809.jpg": "beagle",
    "n02088364_12756.jpg": "beagle",
    "n02088364_14431.jpg": "beagle",
    "n02088364_12973.jpg": "beagle",
    "n02088364_16339.jpg": "beagle",
    "n02088364_10108.jpg": "beagle",
    "n02088364_8477.jpg": "beagle",
    "n02088364_13477.jpg": "beagle",
    "n02088364_5282.jpg": "beagle",
    "n02088364_4070.jpg": "beagle",
    "n02088364_12405.jpg": "beagle",
    "n02088364_10354.jpg": "beagle",
    "n02088364_161.jpg": "beagle",
    "n02088364_12303.jpg": "beagle",
    "n02088364_16791.jpg": "beagle",
    "n02088364_17553.jpg": "beagle",
    "n02088364_639.jpg": "beagle",
    "n02088364_15305.jpg": "beagle",
    "n02088364_9849.jpg": "beagle",
    "n02088364_5716.jpg": "beagle",
    "n02088364_17671.jpg": "beagle",
    "n02100877_407.jpg": "Irish_setter",
    "n02100877_2899.jpg": "Irish_setter",
    "n02100877_5925.jpg": "Irish_setter",
    "n02100877_797.jpg": "Irish_setter",
    "n02100877_5286.jpg": "Irish_setter",
    "n02100877_2989.jpg": "Irish_setter",
    "n02100877_738.jpg": "Irish_setter",
    "n02100877_3804.jpg": "Irish_setter",
    "n02100877_6183.jpg": "Irish_setter",
    "n02100877_6436.jpg": "Irish_setter",
    "n02100877_1201.jpg": "Irish_setter",
    "n02100877_585.jpg": "Irish_setter",
    "n02100877_3865.jpg": "Irish_setter",
    "n02100877_384.jpg": "Irish_setter",
    "n02100877_102.jpg": "Irish_setter",
    "n02100877_4259.jpg": "Irish_setter",
    "n02100877_2952.jpg": "Irish_setter",
    "n02100877_229.jpg": "Irish_setter",
    "n02100877_6747.jpg": "Irish_setter",
    "n02100877_4099.jpg": "Irish_setter",
    "n02100877_5998.jpg": "Irish_setter",
    "n02100877_916.jpg": "Irish_setter",
    "n02100877_2298.jpg": "Irish_setter",
    "n02100877_309.jpg": "Irish_setter",
    "n02100877_5861.jpg": "Irish_setter",
    "n02100877_2443.jpg": "Irish_setter",
    "n02100877_6683.jpg": "Irish_setter",
    "n02100877_1542.jpg": "Irish_setter",
    "n02100877_2939.jpg": "Irish_setter",
    "n02100877_123.jpg": "Irish_setter",
    "n02100877_2199.jpg": "Irish_setter",
    "n02100877_4159.jpg": "Irish_setter",
    "n02100877_2686.jpg": "Irish_setter",
    "n02100877_6411.jpg": "Irish_setter",
    "n02100877_3056.jpg": "Irish_setter",
    "n02100877_5916.jpg": "Irish_setter",
    "n02100877_6926.jpg": "Irish_setter",
    "n02100877_5986.jpg": "Irish_setter",
    "n02100877_4898.jpg": "Irish_setter",
    "n02100877_2283.jpg": "Irish_setter",
    "n02100877_71.jpg": "Irish_setter",
    "n02100877_3936.jpg": "Irish_setter",
    "n02100877_3141.jpg": "Irish_setter",
    "n02100877_3310.jpg": "Irish_setter",
    "n02100877_257.jpg": "Irish_setter",
    "n02100877_7033.jpg": "Irish_setter",
    "n02100877_5799.jpg": "Irish_setter",
    "n02100877_6642.jpg": "Irish_setter",
    "n02100877_92.jpg": "Irish_setter",
    "n02100877_5184.jpg": "Irish_setter",
    "n02100877_156.jpg": "Irish_setter",
    "n02100877_2675.jpg": "Irish_setter",
    "n02100877_4704.jpg": "Irish_setter",
    "n02100877_8507.jpg": "Irish_setter",
    "n02100877_828.jpg": "Irish_setter",
    "n02100877_2588.jpg": "Irish_setter",
    "n02100877_511.jpg": "Irish_setter",
    "n02100877_4852.jpg": "Irish_setter",
    "n02100877_2741.jpg": "Irish_setter",
    "n02100877_5686.jpg": "Irish_setter",
    "n02100877_4508.jpg": "Irish_setter",
    "n02100877_131.jpg": "Irish_setter",
    "n02100877_1165.jpg": "Irish_setter",
    "n02100877_2971.jpg": "Irish_setter",
    "n02100877_3017.jpg": "Irish_setter",
    "n02100877_7636.jpg": "Irish_setter",
    "n02100877_5231.jpg": "Irish_setter",
    "n02100877_239.jpg": "Irish_setter",
    "n02100877_4716.jpg": "Irish_setter",
    "n02100877_6749.jpg": "Irish_setter",
    "n02100877_1669.jpg": "Irish_setter",
    "n02100877_5764.jpg": "Irish_setter",
    "n02100877_3195.jpg": "Irish_setter",
    "n02100877_2142.jpg": "Irish_setter",
    "n02100877_5033.jpg": "Irish_setter",
    "n02100877_788.jpg": "Irish_setter",
    "n02100877_1787.jpg": "Irish_setter",
    "n02100877_3417.jpg": "Irish_setter",
    "n02100877_7519.jpg": "Irish_setter",
    "n02100877_4764.jpg": "Irish_setter",
    "n02100877_985.jpg": "Irish_setter",
    "n02100877_602.jpg": "Irish_setter",
    "n02100877_6160.jpg": "Irish_setter",
    "n02100877_7943.jpg": "Irish_setter",
    "n02100877_863.jpg": "Irish_setter",
    "n02100877_1749.jpg": "Irish_setter",
    "n02100877_1453.jpg": "Irish_setter",
    "n02100877_4700.jpg": "Irish_setter",
    "n02100877_6417.jpg": "Irish_setter",
    "n02100877_1020.jpg": "Irish_setter",
    "n02100877_6462.jpg": "Irish_setter",
    "n02100877_18.jpg": "Irish_setter",
    "n02100877_7493.jpg": "Irish_setter",
    "n02100877_4724.jpg": "Irish_setter",
    "n02100877_4506.jpg": "Irish_setter",
    "n02100877_2824.jpg": "Irish_setter",
    "n02100877_6375.jpg": "Irish_setter",
    "n02100877_1965.jpg": "Irish_setter",
    "n02100877_4699.jpg": "Irish_setter",
    "n02100877_370.jpg": "Irish_setter",
    "n02100877_5229.jpg": "Irish_setter",
    "n02100877_1062.jpg": "Irish_setter",
    "n02100877_2481.jpg": "Irish_setter",
    "n02100877_306.jpg": "Irish_setter",
    "n02100877_2551.jpg": "Irish_setter",
    "n02100877_185.jpg": "Irish_setter",
    "n02100877_3006.jpg": "Irish_setter",
    "n02100877_1803.jpg": "Irish_setter",
    "n02100877_6998.jpg": "Irish_setter",
    "n02100877_722.jpg": "Irish_setter",
    "n02100877_2732.jpg": "Irish_setter",
    "n02100877_8900.jpg": "Irish_setter",
    "n02100877_838.jpg": "Irish_setter",
    "n02100877_2832.jpg": "Irish_setter",
    "n02100877_6852.jpg": "Irish_setter",
    "n02100877_2970.jpg": "Irish_setter",
    "n02100877_8800.jpg": "Irish_setter",
    "n02100877_6917.jpg": "Irish_setter",
    "n02100877_427.jpg": "Irish_setter",
    "n02100877_356.jpg": "Irish_setter",
    "n02100877_6724.jpg": "Irish_setter",
    "n02100877_856.jpg": "Irish_setter",
    "n02100877_1776.jpg": "Irish_setter",
    "n02100877_1913.jpg": "Irish_setter",
    "n02100877_4332.jpg": "Irish_setter",
    "n02100877_4406.jpg": "Irish_setter",
    "n02100877_2599.jpg": "Irish_setter",
    "n02100877_3826.jpg": "Irish_setter",
    "n02100877_5883.jpg": "Irish_setter",
    "n02100877_5489.jpg": "Irish_setter",
    "n02100877_6453.jpg": "Irish_setter",
    "n02100877_6030.jpg": "Irish_setter",
    "n02100877_6728.jpg": "Irish_setter",
    "n02100877_172.jpg": "Irish_setter",
    "n02100877_1069.jpg": "Irish_setter",
    "n02100877_151.jpg": "Irish_setter",
    "n02100877_7560.jpg": "Irish_setter",
    "n02100877_648.jpg": "Irish_setter",
    "n02100877_2389.jpg": "Irish_setter",
    "n02100877_2793.jpg": "Irish_setter",
    "n02100877_14.jpg": "Irish_setter",
    "n02100877_6214.jpg": "Irish_setter",
    "n02100877_4371.jpg": "Irish_setter",
    "n02100877_3306.jpg": "Irish_setter",
    "n02100877_8321.jpg": "Irish_setter",
    "n02100877_378.jpg": "Irish_setter",
    "n02100877_295.jpg": "Irish_setter",
    "n02100877_5404.jpg": "Irish_setter",
    "n02099601_816.jpg": "golden_retriever",
    "n02099601_846.jpg": "golden_retriever",
    "n02099601_5736.jpg": "golden_retriever",
    "n02099601_5679.jpg": "golden_retriever",
    "n02099601_280.jpg": "golden_retriever",
    "n02099601_7019.jpg": "golden_retriever",
    "n02099601_1454.jpg": "golden_retriever",
    "n02099601_5452.jpg": "golden_retriever",
    "n02099601_544.jpg": "golden_retriever",
    "n02099601_1249.jpg": "golden_retriever",
    "n02099601_3202.jpg": "golden_retriever",
    "n02099601_7304.jpg": "golden_retriever",
    "n02099601_473.jpg": "golden_retriever",
    "n02099601_7807.jpg": "golden_retriever",
    "n02099601_7312.jpg": "golden_retriever",
    "n02099601_5764.jpg": "golden_retriever",
    "n02099601_3388.jpg": "golden_retriever",
    "n02099601_5709.jpg": "golden_retriever",
    "n02099601_2359.jpg": "golden_retriever",
    "n02099601_7771.jpg": "golden_retriever",
    "n02099601_1442.jpg": "golden_retriever",
    "n02099601_14.jpg": "golden_retriever",
    "n02099601_1324.jpg": "golden_retriever",
    "n02099601_3097.jpg": "golden_retriever",
    "n02099601_215.jpg": "golden_retriever",
    "n02099601_3494.jpg": "golden_retriever",
    "n02099601_2076.jpg": "golden_retriever",
    "n02099601_5240.jpg": "golden_retriever",
    "n02099601_1743.jpg": "golden_retriever",
    "n02099601_5642.jpg": "golden_retriever",
    "n02099601_286.jpg": "golden_retriever",
    "n02099601_447.jpg": "golden_retriever",
    "n02099601_6726.jpg": "golden_retriever",
    "n02099601_7227.jpg": "golden_retriever",
    "n02099601_3869.jpg": "golden_retriever",
    "n02099601_176.jpg": "golden_retriever",
    "n02099601_6105.jpg": "golden_retriever",
    "n02099601_2408.jpg": "golden_retriever",
    "n02099601_70.jpg": "golden_retriever",
    "n02099601_7780.jpg": "golden_retriever",
    "n02099601_7119.jpg": "golden_retriever",
    "n02099601_3327.jpg": "golden_retriever",
    "n02099601_1162.jpg": "golden_retriever",
    "n02099601_142.jpg": "golden_retriever",
    "n02099601_9518.jpg": "golden_retriever",
    "n02099601_146.jpg": "golden_retriever",
    "n02099601_2422.jpg": "golden_retriever",
    "n02099601_6139.jpg": "golden_retriever",
    "n02099601_1768.jpg": "golden_retriever",
    "n02099601_6338.jpg": "golden_retriever",
    "n02099601_6820.jpg": "golden_retriever",
    "n02099601_6194.jpg": "golden_retriever",
    "n02099601_5051.jpg": "golden_retriever",
    "n02099601_3262.jpg": "golden_retriever",
    "n02099601_5.jpg": "golden_retriever",
    "n02099601_5544.jpg": "golden_retriever",
    "n02099601_2536.jpg": "golden_retriever",
    "n02099601_6099.jpg": "golden_retriever",
    "n02099601_1010.jpg": "golden_retriever",
    "n02099601_1580.jpg": "golden_retriever",
    "n02099601_118.jpg": "golden_retriever",
    "n02099601_2295.jpg": "golden_retriever",
    "n02099601_6814.jpg": "golden_retriever",
    "n02099601_67.jpg": "golden_retriever",
    "n02099601_5366.jpg": "golden_retriever",
    "n02099601_5188.jpg": "golden_retriever",
    "n02099601_5876.jpg": "golden_retriever",
    "n02099601_3007.jpg": "golden_retriever",
    "n02099601_6233.jpg": "golden_retriever",
    "n02099601_78.jpg": "golden_retriever",
    "n02099601_5453.jpg": "golden_retriever",
    "n02099601_3738.jpg": "golden_retriever",
    "n02099601_3666.jpg": "golden_retriever",
    "n02099601_8181.jpg": "golden_retriever",
    "n02099601_7709.jpg": "golden_retriever",
    "n02099601_7803.jpg": "golden_retriever",
    "n02099601_3569.jpg": "golden_retriever",
    "n02099601_1259.jpg": "golden_retriever",
    "n02099601_5857.jpg": "golden_retriever",
    "n02099601_7916.jpg": "golden_retriever",
    "n02099601_8764.jpg": "golden_retriever",
    "n02099601_3508.jpg": "golden_retriever",
    "n02099601_4843.jpg": "golden_retriever",
    "n02099601_3073.jpg": "golden_retriever",
    "n02099601_304.jpg": "golden_retriever",
    "n02099601_8429.jpg": "golden_retriever",
    "n02099601_281.jpg": "golden_retriever",
    "n02099601_4256.jpg": "golden_retriever",
    "n02099601_2980.jpg": "golden_retriever",
    "n02099601_9504.jpg": "golden_retriever",
    "n02099601_7437.jpg": "golden_retriever",
    "n02099601_4933.jpg": "golden_retriever",
    "n02099601_2663.jpg": "golden_retriever",
    "n02099601_4005.jpg": "golden_retriever",
    "n02099601_2994.jpg": "golden_retriever",
    "n02099601_3004.jpg": "golden_retriever",
    "n02099601_6577.jpg": "golden_retriever",
    "n02099601_3360.jpg": "golden_retriever",
    "n02099601_5893.jpg": "golden_retriever",
    "n02099601_7930.jpg": "golden_retriever",
    "n02099601_5132.jpg": "golden_retriever",
    "n02099601_7993.jpg": "golden_retriever",
    "n02099601_3111.jpg": "golden_retriever",
    "n02099601_109.jpg": "golden_retriever",
    "n02099601_3853.jpg": "golden_retriever",
    "n02099601_8005.jpg": "golden_retriever",
    "n02099601_5160.jpg": "golden_retriever",
    "n02099601_100.jpg": "golden_retriever",
    "n02099601_2796.jpg": "golden_retriever",
    "n02099601_3414.jpg": "golden_retriever",
    "n02099601_9153.jpg": "golden_retriever",
    "n02099601_7037.jpg": "golden_retriever",
    "n02099601_345.jpg": "golden_retriever",
    "n02099601_2691.jpg": "golden_retriever",
    "n02099601_4678.jpg": "golden_retriever",
    "n02099601_864.jpg": "golden_retriever",
    "n02099601_4651.jpg": "golden_retriever",
    "n02099601_6772.jpg": "golden_retriever",
    "n02099601_1028.jpg": "golden_retriever",
    "n02099601_831.jpg": "golden_retriever",
    "n02099601_10.jpg": "golden_retriever",
    "n02099601_308.jpg": "golden_retriever",
    "n02099601_9301.jpg": "golden_retriever",
    "n02099601_704.jpg": "golden_retriever",
    "n02099601_825.jpg": "golden_retriever",
    "n02099601_6318.jpg": "golden_retriever",
    "n02099601_7654.jpg": "golden_retriever",
    "n02099601_4312.jpg": "golden_retriever",
    "n02099601_2688.jpg": "golden_retriever",
    "n02099601_6331.jpg": "golden_retriever",
    "n02099601_569.jpg": "golden_retriever",
    "n02099601_6867.jpg": "golden_retriever",
    "n02099601_2495.jpg": "golden_retriever",
    "n02099601_7432.jpg": "golden_retriever",
    "n02099601_7387.jpg": "golden_retriever",
    "n02099601_3720.jpg": "golden_retriever",
    "n02099601_2029.jpg": "golden_retriever",
    "n02099601_2440.jpg": "golden_retriever",
    "n02099601_7744.jpg": "golden_retriever",
    "n02099601_7123.jpg": "golden_retriever",
    "n02099601_1633.jpg": "golden_retriever",
    "n02099601_342.jpg": "golden_retriever",
    "n02099601_124.jpg": "golden_retriever"
}