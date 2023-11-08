import { Command } from "./Command";
import { SamerArtisanConfig } from "./interfaces";
import { parseArguments } from "./utils/parser";
import { consoleError } from "./utils/console";
import { commandCompleted } from "./utils/event";
import { join, dirname } from "path";
import { readdirSync, writeFileSync, mkdirSync } from "fs";
import prompts, { Choice } from "prompts";
import { textSync } from "figlet";
import { green } from "chalk";

export class SamerArtisan {
  /**
   * Default Config of Node Artisan
  */
  static $config: SamerArtisanConfig = {
    name: "SamerArtisan",
    root: process.cwd(),
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
   * Specify commands path
  */
  static commands(pathsOrCommands: (string | Command)[]) {
    this.$config.commands = pathsOrCommands;
    return this;
  }
  
  /**
   * Add command path
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
   * Resolve path to absolute
  */
  static $resolvePath(...paths: string[]) {
    return join(this.$config.root, ...paths);
  }
  
  /**
   * Returns cached commands
  */
  static $getCacheCommands(): string[] {
    try {
      return require(this.$resolvePath(this.$config.cacheDist));
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
        commandPaths.push(this.$resolvePath(path));
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
    if(base === "list")
      return await this.showCommandList();
    if(base === "cache")
      return await this.cacheCommands();
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
    await this.showCommandList();
    commandCompleted();
  }
  
  /**
   * Print all available commands
  */
  static async showCommandList() {
    console.log("Available Commands:\n");
    const commands = await this.$getCommands();
    commands.forEach((command: Command) => {
      const padding = ' '.repeat(30 - command.base.length);
      console.log(`  ${green(command.base)}${padding}${command.description}`);
    });
  }
  

  /**
   * Cache commands path from load dir
  */
  static async cacheCommands() {
    const absoluteCacheDist = this.$resolvePath(this.$config.cacheDist);
    const paths: string[] = [];
    for(const dir of this.$config.load) {
      const files = readdirSync(this.$resolvePath(dir));
      for(const fileName of files) {
        if(!fileName.endsWith(".js") && !fileName.endsWith(".ts")) continue;
        const fullPath = this.$resolvePath(dir, fileName);
        const command = await this.$getCommand(fullPath);
        if(!(command instanceof Command))
          consoleError(`Must extend to base "Command" class in command: "${join(dir, fileName)}"`, true);
       if(!command.signature)
          consoleError(`Signature required in command: "${join(dir, fileName)}"`, true);
        paths.push(fullPath)
      }
    }
    mkdirSync(dirname(absoluteCacheDist), { recursive: true })
    writeFileSync(absoluteCacheDist, JSON.stringify(paths));
  }
}