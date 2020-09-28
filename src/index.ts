import { Legal } from "./Legal";
import { debug_enabled } from "./util/debug";
import { currentScript } from "./util/dom";
import { win } from "./util/globals";

const script = currentScript();
const legal = script && Legal.fromScriptTag(script as HTMLScriptElement);
legal?.run();
if (debug_enabled() && legal !== null) {
    (win as any).legal = legal;
}