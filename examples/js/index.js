const { SamerArtisan, Command } = require("../../lib");


class Greet extends Command {
  
  //This should be unique
  signature = "greet";
  
  //This method will be invoked by SamerArtisan
  handle() {
    console.log("Hello user!");
  }
}
imprv suggest simm


SamerArtisan
  .root(__dirname)
  .load("commands")
  .load("external/generators")
  .add(new Greet())
  .parse();
