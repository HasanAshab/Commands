import { bgRed, bold } from "chalk";

export function consoleError(message: string, recommendHelpFlag: boolean | string = false): never {
  let helpMessage = "";
  
  if(recommendHelpFlag === true)
    helpMessage = "(use -h for help) ";
  
  else if(typeof recommendHelpFlag === "string")
    helpMessage = recommendHelpFlag;
  
  const margin = " ".repeat(message.length + helpMessage.length + 3);
  console.log("\r");
  console.log(bgRed(margin));
  console.log(bgRed(` ${bold(message)}  ${helpMessage}`));
  console.log(bgRed(margin));
  console.log("\r");
  process.exit(1);
}





