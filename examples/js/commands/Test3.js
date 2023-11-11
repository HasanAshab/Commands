const { Command } = require("../../../lib");

class Test extends Command {
  signature = "testtsie"
  description = "For testing 3"

  
  async handle() {
    const fruit = await this.anticipate("Do you want", ["apple", "mango"]);
    console.log(fruit)
  }
}

module.exports = Test;