import { Command } from "../../../lib";

export default class Test3 extends Command {
  signature = "testtsie"
  description = "For testing 3"

  
  async handle() {
    let pc = 2;
    console.log(pc)
  }
}