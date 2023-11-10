import type { SamerArtisan } from "../SamerArtisan";
import { Command } from "./Command";
import { join, dirname } from "path";
import { readdirSync, writeFileSync, mkdirSync, unlinkSync } from "fs";

export default class CacheCommands extends Command<{}, { clear: boolean }> {
  signature = "cache {--C|clear: Clear cached command paths }";
  description = "Cache commands path from loaded directories";
  
  constructor(private readonly samerArtisan: typeof SamerArtisan) {
    super();
    this.samerArtisan = samerArtisan;
  }
  
  /**
   * Cache commands path from load dir.
   * Its nessesary only when using load() or loadFrom()
  */
  async handle() {
    if(this.option("clear")) {
      try {
        unlinkSync(this.samerArtisan.$cacheDist);
      } catch {}
      return this.info("\nCache cleared successfully!");
    }
    
    const paths: string[] = [];
    for(const dir of this.samerArtisan.$config.load) {
      const files = readdirSync(this.samerArtisan.$resolvePath(dir));
      for(const fileName of files) {
        if(!fileName.endsWith(".js") && !fileName.endsWith(".ts")) continue;
        const fullPath = this.samerArtisan.$resolvePath(dir, fileName);
        const command = await this.samerArtisan.$getCommand(fullPath);
        if(!(command instanceof Command))
          this.fail(`Must extend to base "Command" class in command: "${join(dir, fileName)}"`, true);
       if(!command.signature)
          this.fail(`Signature required in command: "${join(dir, fileName)}"`, true);
        paths.push(fullPath)
      }
    }
    writeFileSync(this.samerArtisan.$cacheDist, JSON.stringify(paths));
    
    this.info(`\nCommands cached successfully`);
  }
}

