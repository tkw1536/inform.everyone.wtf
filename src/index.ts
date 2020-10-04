import { Legal } from "./Legal";
import { currentScript } from "./util/dom";

const script = currentScript();
const legal = script && Legal.fromScriptTag(script as HTMLScriptElement);
legal?.run();