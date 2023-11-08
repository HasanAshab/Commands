import { Command } from "./Command";
import { resolvePath } from "../utils/path";
import { consoleError } from "../utils/console";
import { join, dirname } from "path";
import { readdirSync, writeFileSync, mkdirSync } from "fs";

/**
 * Cache commands path from load dir.
 * Its nessesary only when using load() or loadFrom()
*/
export default class CacheCommands extends Command {
  signature = "cache";
  description = "Cache commands path from loaded directories";
  
  constructor(private readonly SamerArtisan: any) {
    super();
    this.SamerArtisan = SamerArtisan;
  }
  
  async handle() {
    const absoluteCacheDist = resolvePath(this.SamerArtisan.$config.cacheDist);
    const paths: string[] = [];
    for(const dir of this.SamerArtisan.$config.load) {
      const files = readdirSync(resolvePath(dir));
      for(const fileName of files) {
        if(!fileName.endsWith(".js") && !fileName.endsWith(".ts")) continue;
        const fullPath = resolvePath(dir, fileName);
        const command = await this.SamerArtisan.$getCommand(fullPath);
        if(!(command instanceof Command))
          consoleError(`Must extend to base "Command" class in command: "${join(dir, fileName)}"`, true);
       if(!command.signature)
          consoleError(`Signature required in command: "${join(dir, fileName)}"`, true);
        paths.push(fullPath)
      }
    }
    mkdirSync(dirname(absoluteCacheDist), { recursive: true })
    writeFileSync(absoluteCacheDist, JSON.stringify(paths));
  }
}

