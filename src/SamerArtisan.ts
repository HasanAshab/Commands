import { Command } from "./commands/Command";
import ConsoleIO from "./ConsoleIO";
import type { SamerArtisanConfig, SimilarCommand } from "./interfaces";
import { parseArguments, analyseSimilarity } from "./utils";
import prompts, { Choice } from "prompts";
import { textSync } from "figlet";
import { join } from "path";
import { readdirSync } from "fs";


export class SamerArtisan {
  /**
   * Default Config of Node Artisan
  */
  static $config: SamerArtisanConfig = {
    root: process.cwd(),
    name: "SamerArtisan",
    load: [],
    commands: []
  };
  
  /**
   * Loadable command file extentions
  */
  static $extentions = [".js", ".ts", ".mjs", ".cjs"];
  
  /**
   * Command instances
  */
  static $resolvedCommands: Command<unknown, unknown>[] = [];

  
  /**
   * Setup node artisan
  */
  static setup(config: Partial<SamerArtisanConfig>) {
    Object.assign(this.$config, config);
  }
  
  /**
   * Specify the root directory
  */
  static root(dir: string) {
    this.$config.root = dir;
    return this;
  }
  
  /**
   * Specify cache distination
  */
  static projectName(name: string) {
    this.$config.name = name;
    return this;
  }
  

  /**
   * Add load directory
  */
  static load(dir: string | string[]) {
    if(typeof dir === "string")
      this.$config.load.push(dir);
    else this.$config.load.push(...dir);
    return this;
  }
  
  /**
   * Add multiple commands instance or path
  */
  static commands(pathsOrCommands: (string | Command<unknown, unknown>)[]) {
    this.$config.commands.push(...pathsOrCommands);
    return this;
  }
  
  /**
   * Add command instance or path
  */
  static add(path: string | Command) {
    this.$config.commands.push(path);
    return this;
  }
  
  /**
   * Specify global options signature
  */
  static globalOptions(signature: string) {
    Command.globalOptions = signature;
    return this
  }
  
  /**
   * Resolve path to absolute
  */
  static $resolvePath(...paths: string[]) {
    return join(this.$config.root, ...paths);
  }

  /**
   * Get command class from path
  */
  static async $getCommand(path: string): Promise<Command> {
    const fileData = await import(path);
    const CommandClass = typeof fileData === "function"
      ? fileData
      : fileData.default;
    if(typeof CommandClass !== "function")
      ConsoleIO.fail(`No command class found from path: "${path}"`);
    return new CommandClass;
  }
  
  /**
   * Resolve command classes those are registered using add()
  */
  static async $resolveAddedCommands(): Promise<void> {
    const commandPaths: string[] = [];
    this.$config.commands.forEach(command => {
      if(typeof command === "string")
        commandPaths.push(this.$resolvePath(command));
      else this.$resolvedCommands.push(command);
    });
    const importPromises = commandPaths.map(path => this.$getCommand(path))
    this.$resolvedCommands.push(...await Promise.all(importPromises));
  }
  
  /**
   * Resolve command classes from loaded directories
  */
  static async $resolveCommandsFromLoadedDirs() {
    for(const dir of this.$config.load) {
      const files = readdirSync(this.$resolvePath(dir));
      for(const fileName of files) {
        if(!this.$extentions.some(ext => fileName.endsWith(ext))) continue;
        const fullPath = this.$resolvePath(dir, fileName);
        const command = await this.$getCommand(fullPath);
        if(!(command instanceof Command))
          ConsoleIO.fail(`Must extend to base "Command" class in command: "${join(dir, fileName)}"`);
        if(!command.signature)
          ConsoleIO.fail(`Signature required in command: "${join(dir, fileName)}"`);
        this.$resolvedCommands.push(command);
      }
    }
  }
  
  /**
   * Checks if there is any duplicate signatures from resolved commands
  */
  static $assertBaseSignaturesAreUnique() {
    const usedBaseSignatures: string[] = [];
    this.$resolvedCommands.forEach(command => {
      if(usedBaseSignatures.includes(command.base))
        ConsoleIO.fail(`Signature "${command.base}" used in multiple commands.`);
      usedBaseSignatures.push(command.base);
    });
  }
  
  /**
   * Suggest similar commands 
  */
  static $suggestSimilars(base: string, similarCommands: Record<string, SimilarCommand>) {
    const similars = Object.keys(similarCommands).sort((x, y) => {
      return similarCommands[x].distance - similarCommands[y].distance;
    });

    return ConsoleIO.choice(`Command "${base}" is not defined\n Did you mean one of these`, similars, 0);
  }
  
  /**
   * Execute a command
  */
  static exec(command: Command<unknown, unknown>, input: string[] = []) {
    if(input.includes("--help") || input.includes("-h"))
      return command.showHelp();
    return new Promise<void>((resolve, reject) => {
      const { args, opts } = parseArguments(Command.globalOptions + command.pattern, input) as any;
      command.setup(args, opts);
      if(command.handle.length > 0)
        command.handle(resolve);
      else command.handle().then(resolve).catch(reject);
    });
  }
  
  /**
   * Call a command by base
  */
  static async call(base: string, input: string[] = []) {
    let similarCommandsCount = 0;
    const similarCommands: Record<string, SimilarCommand> = {};
    
    for(const command of this.$resolvedCommands) {
      if(command.base === base)
        return await this.exec(command, input);
      
      if(similarCommandsCount <= 5) {
        const distance = command.base.startsWith(base) ? 0 : analyseSimilarity(base, command.base, 3);
        if (distance !== -1) {
          similarCommands[command.base] = { distance, command };
          similarCommandsCount++;
        }
      }
    }
    
    if (similarCommandsCount === 0)
      ConsoleIO.fail("No Command Found", `(use "list" to display available commands)`);

    const newBase = await this.$suggestSimilars(base, similarCommands);
    await this.exec(similarCommands[newBase].command, input);
  }
  
  /**
   * Parse arguments and start cli
  */
  static async parse(args = process.argv) {
    await Promise.all([
      this.$resolveCommandsFromLoadedDirs(),
      this.$resolveAddedCommands()
    ]);
    
    this.$assertBaseSignaturesAreUnique();
    const [baseInput, ...argsAndOpts] = args.splice(2);
    if(baseInput && baseInput !== "--help" && baseInput !== "-h")
      return await this.call(baseInput, argsAndOpts)
    
    console.log(textSync(this.$config.name), "\n\n");
    Command.showGlobalOptions();
    await this.call("list");
  }
}