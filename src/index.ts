import { Legal } from "./Legal";
import { debug_enabled } from "./util/debug";
import { currentScript } from "./util/dom";

const script = currentScript();
const legal = script && Legal.fromScriptTag(script as HTMLScriptElement);
legal?.run();
if (debug_enabled() && legal !== null) {
    (window as any).legal = legal;
}