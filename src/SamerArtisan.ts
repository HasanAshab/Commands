import { Command } from "./commands/Command";
import type { SamerArtisanConfig } from "./interfaces";
import { parseArguments } from "./utils";
import { consoleError } from "./exceptions/console";
import prompts, { Choice } from "prompts";
import { textSync } from "figlet";
import { join } from "path";

export class SamerArtisan {
  /**
   * Default Config of Node Artisan
  */
  static $config: SamerArtisanConfig = {
    root: "",
    name: "SamerArtisan",
    cacheDist: "node-artisan.json",
    load: [],
    commands: []
  };
  
  /**
   * Command instances
  */
  static $resolvedCommands: Command[] = [];

  
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
   * Specify cache distination
  */
  static cacheDist(path: string) {
    this.$config.cacheDist = this.$resolvePath(path);
    return this;
  }
  
  /**
   * Specify load directories
  */
  static loadFrom(dirs: string[]) {
    this.$config.load = dirs;
    return this;
  }
  
  /**
   * Add load directory
  */
  static load(dir: string) {
    this.$config.load.push(dir);
    return this;
  }
  
  /**
   * Add multiple commands instance or path
  */
  static commands(pathsOrCommands: (string | Command)[]) {
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
   * Returns cached commands
  */
  static get $cacheCommandsPath(): string[] {
    try {
      return require(this.$config.cacheDist);
    } catch(err) {
      return [];
    }
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
      consoleError(`No command class found from path: "${path}"`, true);
    return new CommandClass;
  }
  
  /**
   * Get all registered command classes
  */
  static async $resolveCommands(): Promise<void> {
    const commandPaths: string[] = [];
    this.$config.commands.forEach(command => {
      if(typeof command === "string")
        commandPaths.push(this.$resolvePath(command));
      else this.$resolvedCommands.push(command);
    });
    
    if(this.$config.load.length > 0) {
      commandPaths.push(...this.$cacheCommandsPath);
    }
    const importPromises = commandPaths.map(path => this.$getCommand(path))
    this.$resolvedCommands.push(...await Promise.all(importPromises));
  }
  
  static $assertBaseSignaturesAreUnique() {
    const usedBaseSignatures: string[] = [];
    this.$resolvedCommands.forEach(command => {
      if(usedBaseSignatures.includes(command.base))
        consoleError(`Signature "${command.base}" used in multiple commands.`);
      usedBaseSignatures.push(command.base);
    });
  }
  
  /**
   * Suggest similar commands 
  */
  static async $suggestSimilars(base: string, similars: string[]) {
    const choices = similars.sort().reduce((accumulator: Choice[], signature: string) => {
      accumulator.push({ title: signature });
      return accumulator;
    }, []);
  
    const { value } = await prompts({
      type: 'autocomplete',
      name: 'value',
      message: `Command "${base}" is not defined\n Did you mean one of these`,
      choices,
      initial: base
    });
    return value;
  }
  
  /**
   * Execute a command
  */
  static async exec(command: Command, input: string[] = []) {
    if(input.includes("--help") || input.includes("-h"))
      return command.showHelp();
    const { args, opts } = parseArguments(Command.globalOptions + command.pattern, input) as any;
    command.setup(args, opts);
    await command.handle();
  }
  
  /**
   * Call a command by base
  */
  static async call(base: string, input: string[] = []) {
    const similarCommands: Record<string, Command> = {};
    for(const command of this.$resolvedCommands) {
      if(command.base === base)
        return await this.exec(command, input);
      else if (command.base.startsWith(base))
        similarCommands[command.base] = command;
    }
    
    const similars = Object.keys(similarCommands);
    
    if (similars.length === 0)
      consoleError("No Command Found", true);

    const newBase = await this.$suggestSimilars(base, similars);
    if(newBase) {
      await this.exec(similarCommands[newBase], input);
    }
  }
  
  /**
   * Parse arguments and start cli
  */
  static async parse(args = process.argv) {
    await this.$resolveCommands();
    this.$assertBaseSignaturesAreUnique();
    
    const [baseInput, ...argsAndOpts] = args.splice(2);
    if(baseInput && baseInput !== "--help" && baseInput !== "-h")
      return await this.call(baseInput, argsAndOpts)
    
    console.log(textSync(this.$config.name), "\n\n");
    Command.showGlobalOptions();
    await this.call("list");
  }
}