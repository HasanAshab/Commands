import { SamerArtisan } from "../../lib";

SamerArtisan
  .root(__dirname)
  .load("commands")
  .parse();