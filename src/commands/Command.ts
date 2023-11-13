import type { SamerArtisanConfig, GlobalOptions, CommandMetadata } from "../interfaces";
import { green, yellow, black, red, white, bgRed } from "chalk";
import prompts, { Choice } from "prompts";
import Table from "cli-table";
import { SingleBar, Presets } from 'cli-progress';
import { parseDescriptions } from "../utils";
import { consoleError } from "../exceptions/console";


export abstract class Command<
  Arguments = Record<string, string | null>,
  Options = Record<string, boolean | string | null>
> {
  
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
      optsList += `  ${green(name)}${padding}${opts[name] ?? ""}\n`;
    }
    console.log(`${yellow("Options")}:\n${optsList}`);
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
  public abstract handle(): any | Promise<any>;
  
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
   * Ask question
  */
  protected async ask(question: string): Promise<string> {
    const { value } = await prompts({
      type: 'text',
      name: "value",
      message: question
    });
    return value;
  }
  
  /**
   * Ask for secret details such as password
  */
  protected async secret(question: string): Promise<string> {
    const { value } = await prompts({
      type: 'invisible',
      name: 'value',
      message: question,
    });
    return value;
  }
  
  /**
   * Ask for confirmation
  */
  protected async confirm(question: string, initial = false): Promise<boolean> {
    const { value } = await prompts({
      type: 'toggle',
      name: 'value',
      message: question,
      initial,
      active: 'yes',
      inactive: 'no',
    });
    return value;
  }
  
  /**
   * Prompt to choose single or multiple options
  */
  protected async choice<T extends string[], Y extends number>(question: string, options: T, initial?: Y, allowMultipleSelections = false): Promise<T[Y]> {
    if (initial && options.length <= initial) {
      throw new Error('invalid initial option index');
    }
  
    const choices = options.reduce((accumulator: Choice[], option: string) => {
      accumulator.push({ title: option, value: option });
      return accumulator;
    }, []);
  
    const { value } = await prompts({
      type: allowMultipleSelections ? 'multiselect' : 'select',
      name: 'value',
      message: question,
      choices,
      initial,
    });
  
    return value;
  }
  
  /**
   * Prompt to choose option with autocompletion
  */
  protected async anticipate(question: string, options: string[]): Promise<string> {
    let lastInput = "";
    
    const choices = options.reduce((accumulator: Choice[], option: string) => {
      accumulator.push({ title: option });
      return accumulator;
    }, []);
    
    const { value } = await prompts({
      type: 'autocomplete',
      name: 'value',
      message: question,
      choices,
      async suggest(input, choices) {
        lastInput = input;
        return choices.filter(i => {
          return i.title.toLowerCase().slice(0, input.length) === input.toLowerCase();
        });
      }
    });
    
    return value ?? lastInput;
  }

  /**
   * Log valueable information
  */
  protected info(message: string): void {
    console.log(green(message));
  }
  
  /**
   * Log comment
  */
  protected comment(message: string): void {
    console.log(black(message));
  }  
  
  /**
   * Log message only if verbose flagged
  */
  protected verbose(message: string): void {
    this.option("verbose") && console.log(message);
  }
  
  /**
   * Log error message
  */
  protected error(message: string): void {
    console.log(red(message));
  }
  
  /**
   * Log table data
  */
  protected table(head: string[], data: string[][]): void {
    const table = new Table({ head });
    table.push(...data);
    console.log(table.toString())
  }
  
  /**
   * Process data with progress bar
  */
  protected async withProgressBar<T extends any>(data: T[], processor: (item: T) => any | Promise<any>): Promise<void> {
    const bar1 = new SingleBar({}, Presets.shades_classic);
    bar1.start(100, 0);
    const precessPromises = data.map(async item => {
      await processor(item);
      bar1.increment(100 / data.length);
    });
    await Promise.all(precessPromises);
    bar1.stop();
  }
  
  /**
   * Log warning message
  */
  protected warn(message: string): void {
    console.log(black.bgYellow(` WARNING `) + ' ' + message);
  }
  
  /**
   * Log alert message
  */
  protected alert(message: string): void {
    console.log(white.bgRed(` ALERT `) + ' ' + message);
  }
  
  /**
   * Log error message and terminate command
  */
  protected fail(message: string, recommendHelpFlag = false): void {
    consoleError(message, recommendHelpFlag);
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
      console.log(`${yellow("Description")}:\n  ${this.description}\n`);
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
        argsList += `  ${green(name)}${padding}${description ?? ""}\n`;
      }
      hasAtleastOneArgument && console.log(`${yellow("Arguments")}:\n${argsList}`);
    }
    
    let optsList = "";
    for(const name in opts) {
      const padding = ' '.repeat(20 - name.length);
      optsList += `  ${green(name)}${padding}${opts[name] ?? ""}\n`;
    }
    console.log(`${yellow("Options")}:\n${optsList}`);
  }
}