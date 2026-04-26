import fs from "fs";
import os from "os";
import path from "path";

const RESTFORGE_HOME = path.resolve(os.homedir(), ".rest-forge");

if (!fs.existsSync(RESTFORGE_HOME)) {
  fs.mkdirSync(RESTFORGE_HOME);
}

export default function getHomePath(...args: string[]) {
  return path.resolve(RESTFORGE_HOME, ...args);
}