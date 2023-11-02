import chalk from "chalk";
import prompts, { Choice } from "prompts";
import Table from "cli-table";
import { SingleBar, Presets } from 'cli-progress';

export type CommandArgument = string | null;
export type CommandOption = boolean | string | null;
export interface CommandMetadata {
  base?: string;
  pattern?: string;
}

export abstract class Command {
  /**
   * signature of the command
  */
  public abstract signature: string;
  
  /**
   * Description of the Command
  */
  public description = "";
  
  public metadata: CommandMetadata = {};
  
  /**
   * Parsed arguments
  */
  private args!: Record<string, CommandArgument>;
  
  /**
   * Parsed options
  */
  private opts!: Record<string, CommandOption>;
  
  /**
   * Perform the command action
  */
  public abstract handle(): any | Promise<any>;
  
  /**
   * Setup the command to be executed with 
   * parsed arguments and options.
   * Using it as alternat of constructor to make it
   * easier to inject
  */
  setup(args: Record<string, CommandArgument>, opts: Record<string, CommandOption>): void {
    this.args = args;
    this.opts = opts;
  }
  
  /**
   * Get all arguments
  */
  protected arguments(): Record<string, CommandArgument> {
    return this.args;
  }
  
  /**
   * Get argument by name
  */
  protected argument(name: string): CommandArgument {
    const arg = this.args[name];
    if(typeof arg === "undefined")
      throw new Error(`Argument "${name}" is not registered on signature.`);
    return arg;
  }
  
  /**
   * Get all options
  */
  protected options(): Record<string, CommandOption> {
    return this.opts;
  }
  
  /**
   * Get option by name
  */
  protected option(name: string): CommandOption {
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
  protected async choice<T extends string[], Y extends number>(question: string, options: T, initial: Y, allowMultipleSelections = false): Promise<T[Y]> {
    if (options.length <= initial) {
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
  protected async anticipate(question: string, options: string[], fallback: string): Promise<string> {
    const choices = options.reduce((accumulator: Choice[], option: string) => {
      accumulator.push({ title: option });
      return accumulator;
    }, []);
  
    const { value } = await prompts({
      type: 'autocomplete',
      name: 'value',
      message: question,
      choices
    });
    return value ?? fallback;
  }

  /**
   * Log valueable information
  */
  protected info(message: string): void {
    console.log(chalk.green(message));
  }
  
  /**
   * Log comment
  */
  protected comment(message: string): void {
    console.log(chalk.black(message));
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
    console.log(chalk.red(message));
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
    console.log(chalk.bgYellow.black(` WARNING `) + ' ' + message);
  }
  
  /**
   * Log alert message
  */
  protected alert(message: string): void {
    console.log(chalk.bgRed.white(` ALERT `) + ' ' + message);
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
    this.metadata.base = this.signature.substring(0, firstSpaceIndex);
    this.metadata.pattern = this.signature.substring(this.signature.indexOf(' ') + 1);
  }
}