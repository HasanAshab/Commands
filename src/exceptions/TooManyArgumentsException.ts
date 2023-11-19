import ConsoleException from "./ConsoleException";

export default class TooManyArgumentsException extends ConsoleException {
  protected message = "Too Many Arguments";
  protected instruction = "(use -h for help)";
}