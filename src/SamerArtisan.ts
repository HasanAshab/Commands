import type { SamerArtisanConfig, SimilarCommand } from "./interfaces";
import { parseArguments, analyseSimilarity } from "./utils";
import prompts, { Choice } from "prompts";
import { textSync } from "figlet";
import { join } from "path";
import { readdirSync } from "fs";
import { Command } from "./commands/Command";
import ConsoleIO from "./ConsoleIO";
import ConsoleException from "./exceptions/ConsoleException";
import CommandClassNotFoundException from "./exceptions/CommandClassNotFoundException";
import DuplicateSignatureException from "./exceptions/DuplicateSignatureException";
import CommandNotExistsException from "./exceptions/CommandNotExistsException";

export class SamerArtisan {
  /**
   * Loadable command file extentions
   */
  static readonly EXTENTIONS = [".js", ".ts", ".mjs", ".cjs"];
  
  /**
   * Max number of similar command suggestions to be displayed, when no command matched 
   */
  static readonly MAX_SIMILAR_COMMAND_SUGGESTIONS = 5;
  
  /**
   * Commands which have less levenshtein distance than this will be counted as similar
   */
  static readonly LEVENSHTEIN_DISTANCE_THRESHOLD = 3;
  
  
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
  static projectName(name: string | null) {
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
    const CommandClass = typeof fileData.default === "function"
      ? fileData.default
      : fileData.default.default;
    
    if(typeof CommandClass === "function" && CommandClass.prototype instanceof Command)
      return new CommandClass;
    throw new CommandClassNotFoundException(path);
  }
  
  /**
   * Resolve command classes those are registered using add()
  */
  static async $resolveAddedCommands(): Promise<void> {
    const importPromises: Promise<Command>[] = [];
    this.$config.commands.forEach(command => {
      if(typeof command === "string")
        importPromises.push(this.$getCommand(this.$resolvePath(command)));
      else this.$resolvedCommands.push(command);
    });
    this.$resolvedCommands.push(...await Promise.all(importPromises));
  }
  
  /**
   * Resolve command classes from loaded directories
  */
  static async $resolveCommandsFromLoadedDirs() {
    for(const dir of this.$config.load) {
      const files = readdirSync(this.$resolvePath(dir));
      for(const fileName of files) {
        if(!this.EXTENTIONS.some(ext => fileName.endsWith(ext))) continue;
        const fullPath = this.$resolvePath(dir, fileName);
        const command = await this.$getCommand(fullPath);
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
        throw new DuplicateSignatureException(command.base);
      usedBaseSignatures.push(command.base);
    });
  }
  
  /**
   * Suggest similar commands 
  */
  static async $suggestSimilars(base: string) {
    let similarCommandsCount = 0;
    const similarCommands: Record<string, SimilarCommand> = {};
    
    for(const command of this.$resolvedCommands) {
      if(similarCommandsCount === this.MAX_SIMILAR_COMMAND_SUGGESTIONS) break;
      const distance = command.base.startsWith(base) ? 0 : analyseSimilarity(base, command.base, this.LEVENSHTEIN_DISTANCE_THRESHOLD);
      if (distance !== -1) {
        similarCommands[command.base] = { distance, command };
        similarCommandsCount++;
      }
    }
    
    if (similarCommandsCount === 0)
      return null;

    const similars = Object.keys(similarCommands).sort((x, y) => {
      return similarCommands[x].distance - similarCommands[y].distance;
    });
    
    const choosedBase = await ConsoleIO.choice(`Command "${base}" is not defined\n Did you mean one of these`, similars, 0);
    return similarCommands[choosedBase].command;
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
    let command = this.$resolvedCommands.find(command => command.base === base)
      ?? await this.$suggestSimilars(base);
    if(!command)
      throw new CommandNotExistsException;

    await this.exec(command, input);
  }
  
  /**
   * Parse arguments and start cli
  */
  static async parse(args = process.argv) {
    try {
      await Promise.all([
        this.$resolveCommandsFromLoadedDirs(),
        this.$resolveAddedCommands()
      ]);
      
      this.$assertBaseSignaturesAreUnique();
      
      const [baseInput, ...argsAndOpts] = args.splice(2);
      if(baseInput && baseInput !== "--help" && baseInput !== "-h")
        return await this.call(baseInput, argsAndOpts)
      
      this.$config.name && console.log(textSync(this.$config.name), "\n\n");
      Command.showGlobalOptions();
      await this.call("list");
    }
    catch(err) {
      if(err instanceof ConsoleException)
        return err.render();
      throw err;
    }
  }
}