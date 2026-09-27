import { ThemeColor, ThemeIcon } from "vscode";

function getMethodIcons(method: string) {
  switch (method) {
    case "GET":
      return new ThemeIcon("arrow-down", new ThemeColor("charts.green"));
    case "POST":
      return new ThemeIcon("arrow-up", new ThemeColor("charts.yellow"));
    case "PUT":
      return new ThemeIcon("arrow-swap", new ThemeColor("charts.blue"));
    case "PATCH":
      return new ThemeIcon("edit", new ThemeColor("charts.purple"));
    case "DELETE":
      return new ThemeIcon("trash", new ThemeColor("charts.red"));
    case "HEAD":
      return new ThemeIcon("eye", new ThemeColor("charts.green"));
    case "OPTIONS":
      return new ThemeIcon("gear", new ThemeColor("charts.orange"));
    default:
      return new ThemeIcon("question");
  }
}

export default getMethodIcons;