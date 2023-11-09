const { Command } = require("../../../lib");

class Test extends Command {
  signature = "testtsie"
  description = "For testing 3"

  
  async handle() {
    await this.withProgressBar(new Array(10).fill(0), (user) => {
      return new Promise(r => {
        setTimeout(() => {
          r()
        }, 2000)
      })
    });
  }
}

module.exports = Test;