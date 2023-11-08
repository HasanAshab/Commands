import type { SamerArtisan } from "../SamerArtisan";
import { Command } from "./Command";
import { resolvePath } from "../utils/path";
import { join, dirname } from "path";
import { readdirSync, writeFileSync, mkdirSync } from "fs";

export default class CacheCommands extends Command {
  signature = "cache";
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
    const absoluteCacheDist = resolvePath(this.samerArtisan.$config.cacheDist);
    const paths: string[] = [];
    for(const dir of this.samerArtisan.$config.load) {
      const files = readdirSync(resolvePath(dir));
      for(const fileName of files) {
        if(!fileName.endsWith(".js") && !fileName.endsWith(".ts")) continue;
        const fullPath = resolvePath(dir, fileName);
        const command = await this.samerArtisan.$getCommand(fullPath);
        if(!(command instanceof Command))
          this.fail(`Must extend to base "Command" class in command: "${join(dir, fileName)}"`, true);
       if(!command.signature)
          this.fail(`Signature required in command: "${join(dir, fileName)}"`, true);
        paths.push(fullPath)
      }
    }
    mkdirSync(dirname(absoluteCacheDist), { recursive: true })
    writeFileSync(absoluteCacheDist, JSON.stringify(paths));
    
    this.info(`\nCache saved in path: "${absoluteCacheDist}"`);
  }
}

