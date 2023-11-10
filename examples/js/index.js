const { SamerArtisan, Command } = require("../../lib");


class CustomCommand extends Command {
  signature = "custom"
  description = "For testing Custom added"
  
  async handle() {
    console.log(this)
  }
}


SamerArtisan
  .root(__dirname)
  .load("commands")
  .add(new CustomCommand())
  .parse();