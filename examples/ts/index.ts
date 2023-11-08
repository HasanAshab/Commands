import { SamerArtisan } from "../../lib";

SamerArtisan
  .root(__dirname)
  .cacheDist("cache/artisan.json")
  .load("commands")
  .parse();
  
