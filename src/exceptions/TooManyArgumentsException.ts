import ConsoleException from "./ConsoleException";

export default class TooManyArgumentsException extends ConsoleException {
  protected message = "Too many arguments";
  protected instruction = "(use -h for help)";
}