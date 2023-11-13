const { Command } = require("../../../lib");

class Test extends Command {
  signature = "tes"
  description = "For testing 4. bla bla bla bla bla bla"

  async handle(done) {
    const ans = await this.choice("Why bro?", ["foojfjf", "bar"])
    setTimeout(() => done(), 4000)
  }
}

module.exports = Test;