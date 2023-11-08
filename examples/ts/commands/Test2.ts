import { Command } from "../../../lib";

export default class Test2 extends Command {
  signature = "testts"
  description = "For testing 2"
  
  async handle() {
    let pc = 0;
    console.log(pc)
  }
}
