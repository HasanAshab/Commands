import { Command } from "./commands/Command";
import { SamerArtisanConfig } from "./interfaces";
import { parseArguments } from "./utils/parser";
import { consoleError } from "./utils/console";
import { commandCompleted } from "./utils/event";
import { resolvePath } from "./utils/path";
import prompts, { Choice } from "prompts";
import { textSync } from "figlet";

export class SamerArtisan {
  /**
   * Default Config of Node Artisan
  */
  static $config: SamerArtisanConfig = {
    name: "SamerArtisan",
    cacheDist: "node-artisan.json",
    load: [],
    commands: []
  };
  
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
    process.env.NODE_PATH = dir;
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
    this.$config.cacheDist = path;
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
   * Do something on command completion
  */
  static onComplete(cb: () => void) {
    commandCompleted(cb);
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
   * Returns cached commands
  */
  static $getCacheCommands(): string[] {
    try {
      return require(resolvePath(this.$config.cacheDist));
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
  static async $getCommands(): Promise<Command[]> {
    const commandPaths: string[] = [];
    const resolvedCommands: Command[] = [];
    
    this.$config.commands.forEach(path => {
      if(typeof path === "string")
        commandPaths.push(resolvePath(path));
      else resolvedCommands.push(path);
    });
    
    if(this.$config.load.length > 0) {
      commandPaths.push(...this.$getCacheCommands());
    }
    const importPromises = commandPaths.map(path => this.$getCommand(path))
    resolvedCommands.push(...await Promise.all(importPromises));
    return resolvedCommands;
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
    command.setup(this.$config, args, opts);
    await command.handle();
  }
  
  /**
   * Call a command by base
  */
  static async call(base: string, input: string[] = []) {
    const commands = await this.$getCommands();
    const similarCommands: Record<string, Command> = {};
    
    for(const command of commands) {
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
    const [baseInput, ...argsAndOpts] = args.splice(2);
    if(baseInput && baseInput !== "--help" && baseInput !== "-h") {
      await this.call(baseInput, argsAndOpts)
      return commandCompleted();
    }
    console.log(textSync(this.$config.name), "\n\n");
    Command.showGlobalOptions();
    await this.call("list");
    commandCompleted();
  }
}