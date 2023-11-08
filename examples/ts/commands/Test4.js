const { Command } = require("../../../lib/Command");

class Test extends Command {
  signature = "tes"
  description = "For testing 4. bla bla bla bla bla bla"

  
  async handle() {
    let pc = 0;
    await this.withProgressBar(new Array(10).fill(0), (user) => {
      return new Promise(r => {
        setTimeout(() => {
          pc += 1
          r()
        }, 1000)
      })
    });
    console.log(pc)
  }
}

module.exports = Test;