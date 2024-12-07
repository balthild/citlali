import { rollup } from "rollup";
import { loadConfig } from "../config";
import { resolveRollupConfig } from "./config";

export async function start() {
    const options = resolveRollupConfig(await loadConfig());
    console.log(options);

    const build = await rollup({});
}
