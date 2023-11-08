import { Command } from "./Command";
import { green } from "chalk";

export default class ListCommands extends Command {
  signature = "list";
  description = "Print all available commands";

  constructor(private readonly SamerArtisan: any) {
    super();
    this.SamerArtisan = SamerArtisan;
  }
  
  async handle() {
    console.log("Available Commands:\n");
    const commands = await this.SamerArtisan.$getCommands();
    commands.forEach((command: Command) => {
      const padding = ' '.repeat(30 - command.base.length);
      console.log(`  ${green(command.base)}${padding}${command.description}`);
    });
  }
}

