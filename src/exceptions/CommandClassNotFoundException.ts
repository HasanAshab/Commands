import ConsoleException from "./ConsoleException";

export default class CommandClassNotFoundException extends ConsoleException {
  constructor(private path: string) {
    super();
    this.path = path;
  }
  
  protected get message() {
    return `No command class found from path: "${this.path}"`;
  }
}