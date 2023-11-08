import { Command } from "../../../lib/Command";

interface Arguments {
  a: string;
  b: string;
  c?: string;
}

interface Options {
  dog: boolean
}

export default class Test extends Command<Arguments, Options> {
  signature = `test 
        { a: First arg }
        { b }
        { c?: Third arg }
        { --dog : First opt }`
        
  description = "For testing"
  
  async handle() {
    console.log(this.argument("w"))
  }
}

