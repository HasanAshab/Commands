const { SamerArtisan, Command } = require("../../lib");


class CustomCommand extends Command {
  signature = "custom"
  description = "For testing Custom added"
  
  async handle() {
    console.log(this.config)
  }
}

SamerArtisan
  .root(__dirname)
  .cacheDist("cache/artisan.json")
  //.onComplete(() => console.log("shesh"))
  .load("commands")
  .commands([new CustomCommand()])
  .parse();


