import ConsoleException from "./ConsoleException";

export default class CommandNotExistsException extends ConsoleException {
  protected message = "No Command Found";
  protected instruction = `(use "list" to display available commands)`;
}