const { SamerArtisan, Command } = require("../../lib");


class Greet extends Command {
  
  //This should be unique
  signature = "greet";
  
  //This method will be invoked by SamerArtisan
  handle() {
    console.log("Hello user!");
  }
}

SamerArtisan
  .root(__dirname)
  .load("commands")
  .add(new Greet())
  .parse()
  //.then(() => process.exit())
