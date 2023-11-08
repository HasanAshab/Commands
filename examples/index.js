const { SamerArtisan } = require("../lib/SamerArtisan");

SamerArtisan
  .cacheDist("examples/cache/artisan.json")
  //.onComplete(() => console.log("shesh"))
  .load("examples/commands")
  .parse();
  
