const { SamerArtisan } = require("../lib/SamerArtisan");

SamerArtisan
  .cacheDist("cache/artisan.json")
  .load("examples/commands")
  .parse();
  