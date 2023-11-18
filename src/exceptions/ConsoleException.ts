import ConsoleIO from "../ConsoleIO";

export default abstract class ConsoleException {
  protected abstract message: string;
  protected instruction?: string = undefined;
  
  render() {
    ConsoleIO.fail(this.message, this.instruction);
  }
}