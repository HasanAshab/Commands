import ConsoleException from "./ConsoleException";

export default class DuplicateSignatureException extends ConsoleException {
  constructor(private signature: string) {
    super();
    this.signature = signature;
  }
  
  protected get message() {
    return `Signature "${this.signature}" used in multiple commands.`
  }
}