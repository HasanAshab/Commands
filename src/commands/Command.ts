import ConsoleIO from "../ConsoleIO";
import type { SamerArtisanConfig, GlobalOptions, CommandMetadata } from "../interfaces";
import chalk from "chalk";
import { parseDescriptions } from "../utils";

export abstract class Command<Arguments = Record<string, string | null | string[]>, Options = Record<string, boolean | string | null>> extends ConsoleIO {
  /**
   * Global options those are available across every command
  */
  static globalOptions = `
    { --h|help: Show help of a command }
    { --v|verbose: Get verbose output }
  `;
  
  /**
   * Prints global options
  */
  static showGlobalOptions() {
    const { opts } = parseDescriptions(this.globalOptions) as any;
    let optsList = "";
    for(const name in opts) {
      const padding = ' '.repeat(20 - name.length);
      optsList += `  ${chalk.green(name)}${padding}${opts[name] ?? ""}\n`;
    }
    console.log(`${chalk.yellow("Options")}:\n${optsList}`);
  }
  
  /**
   * signature of the command
  */
  public abstract signature: string;
  
  /**
   * Description of the Command
  */
  public description = "";
  
  /**
   * Metadata of the command
  */
  public metadata: CommandMetadata = {};
  
  
  /**
   * Parsed arguments
  */
  private args!: Arguments;
  
  /**
   * Parsed options
  */
  private opts!: Options & GlobalOptions;
  
  /**
   * Perform the command action
  */
  public abstract handle(done?: () => void): any | Promise<any>;
  
  /**
   * Setup the command to be executed with parsed arguments and options.
   * Using it as alternate of constructor to make it easier
   * to inject dependencies
  */
  setup(args: Arguments, opts: Options & GlobalOptions): void {
    this.args = args;
    this.opts = opts;
  }
  
  /**
   * Get all arguments
  */
  protected arguments(): Arguments {
    return this.args;
  }
  
  /**
   * Get argument by name
  */
  protected argument<T extends string & keyof Arguments>(name: T): Arguments[T] {
    const arg = this.args[name];
    if(typeof arg === "undefined")
      throw new Error(`Argument "${name}" is not registered on signature.`);
    return arg;
  }
  
  /**
   * Get all options
  */
  protected options(): Options & GlobalOptions {
    return this.opts;
  }
  
  /**
   * Get option by name
  */
  protected option<T extends string & keyof (Options & GlobalOptions)>(name: T): (Options & GlobalOptions)[T] {
    const option = this.opts[name];
    if(typeof option === "undefined")
      throw new Error(`Option "${name}" is not registered on signature.`);
    return option;
  }
  
 
  /**
   * Get command base signature
  */
  get base(): string {
    this.setMetadata();
    return this.metadata.base;
  }
  
  /**
   * Get command signature pattern
  */
  get pattern(): string {
    this.setMetadata();
    return this.metadata.pattern;
  }
  
  /**
   * Set commands metadata if not setted
  */
  private setMetadata(): asserts this is this & { metadata: Required<CommandMetadata> } {
    if(this.metadata.base && this.metadata.pattern) return;
    const firstSpaceIndex = this.signature.indexOf(' ')
    if(firstSpaceIndex === -1) {
      this.metadata.base = this.signature
      this.metadata.pattern = "";
    }
    else {
      this.metadata.base = this.signature.substring(0, firstSpaceIndex);
      this.metadata.pattern = this.signature.substring(this.signature.indexOf(' ') + 1);
    }
  }
  
  /**
   * Show help of the command when the user flagged for help
  */
  showHelp() {
    if(this.description) {
      console.log(`${chalk.yellow("Description")}:\n  ${this.description}\n`);
    }
    const { args, opts } = parseDescriptions(Command.globalOptions + this.pattern) as any;
    if(args) {
      let argsList = "";
      let hasAtleastOneArgument = false;
      for(const name in args) {
        const padding = ' '.repeat(20 - name.length);
        const description = args[name];
        if(description)
          hasAtleastOneArgument = true;
        argsList += `  ${chalk.green(name)}${padding}${description ?? ""}\n`;
      }
      hasAtleastOneArgument && console.log(`${chalk.yellow("Arguments")}:\n${argsList}`);
    }
    
    let optsList = "";
    for(const name in opts) {
      const padding = ' '.repeat(20 - name.length);
      optsList += `  ${chalk.green(name)}${padding}${opts[name] ?? ""}\n`;
    }
    console.log(`${chalk.yellow("Options")}:\n${optsList}`);
  }
}