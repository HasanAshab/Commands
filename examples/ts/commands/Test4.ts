import { Command } from "../../../lib";

export default class Test4 extends Command {
  signature = "tes"
  description = "For testing 4. bla bla bla bla bla bla"

  async handle() {
    let pc = 5;
    console.log(pc)
  }
}