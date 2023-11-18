import prompts, { Choice } from "prompts";
import Table from "cli-table";
import { SingleBar, Presets } from 'cli-progress';
import chalk from "chalk";

export default class ConsoleIO {
  static readonly OPTIONS = {
    onCancel: (prompt: any) => process.exit(0)
  }

  
  static async ask(question: string): Promise<string> {
    const { value } = await prompts({
      type: 'text',
      name: "value",
      message: question
    }, ConsoleIO.OPTIONS);
    return value;
  }

  static async secret(question: string): Promise<string> {
    const { value } = await prompts({
      type: 'invisible',
      name: 'value',
      message: question,
    }, ConsoleIO.OPTIONS);
    return value;
  }

  static async confirm(question: string, initial = false): Promise<boolean> {
    const { value } = await prompts({
      type: 'toggle',
      name: 'value',
      message: question,
      initial,
      active: 'yes',
      inactive: 'no',
    }, ConsoleIO.OPTIONS);
    return value;
  }

  static async choice<T extends string[], Y extends number>(question: string, options: T, initial?: Y, allowMultipleSelections = false, max?: number): Promise<T[Y]> {
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
      max
    }, ConsoleIO.OPTIONS);
  
    return value;
  }

  static async anticipate(question: string, options: string[] | ((input: string) => string[] | Promise<string[]>)): Promise<string> {
    const { default: autocomplete } = await import('inquirer-autocomplete-standalone');
    const formatOptions = (options: string[]) => options.reduce((accumulator: { value: string }[], option: string) => {
      accumulator.push({ value: option });
      return accumulator;
    }, []);
    
    return await autocomplete({
      message: question,
      suggestOnly: true,
      source: async (input = "") => {
        if(!Array.isArray(options))
          return formatOptions(await options(input));
        const sortedOptions = options.filter(option => option.toLowerCase().startsWith(input.toLowerCase()));
        return formatOptions(sortedOptions);
      }
    });
  }

  static info(message: string): void {
    console.log(chalk.green(message));
  }

  static comment(message: string): void {
    console.log(chalk.black(message));
  }

  static error(message: string): void {
    console.log(chalk.red(message));
  }

  static table(head: string[], data: string[][]): void {
    const table = new Table({ head });
    table.push(...data);
    console.log(table.toString())
  }

  static async withProgressBar<T extends any>(data: T[], processor: (item: T) => any | Promise<any>): Promise<void> {
    const bar1 = new SingleBar({}, Presets.shades_classic);
    bar1.start(100, 0);
    const precessPromises = data.map(async item => {
      await processor(item);
      bar1.increment(100 / data.length);
    });
    await Promise.all(precessPromises);
    bar1.stop();
  }

  static warn(message: string): void {
    console.log(chalk.black.bgYellow(` WARNING `) + ' ' + message);
  }

  static alert(message: string): void {
    console.log(chalk.white.bgRed(` ALERT `) + ' ' + message);
  }

  static fail(message: string, instruction = "") {
    const margin = " ".repeat(message.length + instruction.length + 3);
    console.log("\r");
    console.log(chalk.bgRed(margin));
    console.log(chalk.bgRed(` ${chalk.bold(message)}  ${instruction}`));
    console.log(chalk.bgRed(margin));
    console.log("\r");
  }

  ask(question: string): Promise<string> {
    return ConsoleIO.ask(question);
  }

  secret(question: string): Promise<string> {
    return ConsoleIO.secret(question);
  }

  confirm(question: string, initial = false): Promise<boolean> {
    return ConsoleIO.confirm(question, initial);
  }

  choice<T extends string[], Y extends number>(question: string, options: T, initial?: Y, allowMultipleSelections = false, max?: number): Promise<T[Y]> {
    return ConsoleIO.choice(question, options, initial, allowMultipleSelections);
  }

  anticipate(question: string, options: string[]): Promise<string> {
    return ConsoleIO.anticipate(question, options);
  }

  info(message: string): void {
    ConsoleIO.info(message);
  }

  comment(message: string): void {
    ConsoleIO.comment(message);
  }

  error(message: string): void {
    ConsoleIO.error(message);
  }

  table(head: string[], data: string[][]): void {
    ConsoleIO.table(head, data);
  }

  withProgressBar<T extends any>(data: T[], processor: (item: T) => any | Promise<any>): Promise<void> {
    return ConsoleIO.withProgressBar(data, processor);
  }

  warn(message: string): void {
    ConsoleIO.warn(message);
  }

  alert(message: string): void {
    ConsoleIO.alert(message);
  }

  fail(message: string, instruction?: string) {
    ConsoleIO.fail(message, instruction);
  }
}
