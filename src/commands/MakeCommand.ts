import type { SamerArtisan } from "../SamerArtisan";
import { Command } from "./Command";
import { join, dirname } from "path";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

interface Options {
  dir: string | null;
  ts: boolean;
  force: boolean;
}

export default class MakeCommand extends Command<{ name: string }, Options> {
  signature = "make:command {name: Name of the command} {--dir= : Directory where the command will be putted } { --ts : Generate typescript template } { --f|force : Overwrite existing file }";
  description = "Generates command component";
  
  constructor(private readonly samerArtisan: typeof SamerArtisan) {
    super();
    this.samerArtisan = samerArtisan;
  }
  
  async handle() {
    const directory = await this.getDistDirectory();
    const dist = this.samerArtisan.$resolvePath(directory, this.argument("name")) + this.getExtention();
    const content = this.getTemplate().replace(/{{name}}/g, this.argument("name"));
    this.prepareBase(dist);
    this.createCommandFile(dist, content);
    this.info(`\nCommand created successfully: [${dist}]`);
  }
  
  private async getDistDirectory() {
    return this.option("dir") ??
      await this.anticipate("Which directory the command should be putted?", this.samerArtisan.$config.load);
  }
  
  private getExtention() {
    return this.option("ts") ? ".ts" : ".js";
  }
  
  private getTemplate() {
    const templateType = this.option("ts") ? "typescript" : "javascript";
    const path = join(__dirname, "../../templates/command", templateType);
    return readFileSync(path, "utf-8");
  }
  
  private prepareBase(path: string) {
    mkdirSync(dirname(path), { recursive: true });
  }
  
  private createCommandFile(dist: string, content: string) {
    if(this.option("force"))
      return writeFileSync(dist, content)
    try {
      writeFileSync(dist, content, { flag: "wx" });
    } catch {
      this.fail("File already exist!", "(use -f to overwrite)");
    }
  }
}

