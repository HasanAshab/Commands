import { Command } from "../../../lib";

export default class Test1 extends Command {
  signature = "test:1";
  description = "For testing 1";
  
  async handle() {
    this.fail("Fail for nothing.");
    this.info("bla");
  }
  
  showHelp() {
    console.log("Custom help message");
  }
}