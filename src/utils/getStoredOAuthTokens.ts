import fs from "fs";
import { IOAuth2Token } from "./type";

export default function getStoredOAuthTokens(filePath: string) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }

  const dataStr = fs.readFileSync(filePath, { encoding: "utf-8" });
  const tokenList = JSON.parse(dataStr) as IOAuth2Token[];
  return tokenList;
}