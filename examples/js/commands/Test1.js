const { Command } = require("../../../lib");

class Test extends Command {
  signature = "test:1"
  description = "For testing 1"
  
  async handle() {
    this.fail("Fail for nothing.")
    this.info("bla")
  }
  
  showHelp() {
    console.log(this)
  }
}

module.exports = Test;