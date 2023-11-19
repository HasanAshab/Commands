import ConsoleException from "./ConsoleException";

export default class UnknownOptionException extends ConsoleException {
  protected message = "Unknown Option Specified";
  protected instruction = "(use -h for help)";
}