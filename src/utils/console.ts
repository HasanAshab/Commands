import { bgRed, bold } from "chalk";
import { commandCompleted } from "./event";

export function consoleError(message: string, recommendHelpFlag = false) {
  const helpMessage = recommendHelpFlag ? "(use -h for help) " : "";
  const margin = " ".repeat(message.length + helpMessage.length + 3);
  console.log("\r")
  console.log(bgRed(margin))
  console.log(bgRed(` ${bold(message)}  ${helpMessage}`))
  console.log(bgRed(margin));
  console.log("\r");
  commandCompleted();
}





