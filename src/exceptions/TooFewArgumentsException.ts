import ConsoleException from "./ConsoleException";

export default class TooFewArgumentsException extends ConsoleException {
  protected message = "Too Few Arguments";
  protected instruction = "(use -h for help)";
}