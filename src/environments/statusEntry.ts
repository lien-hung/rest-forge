import { StatusBarAlignment, StatusBarItem, window } from "vscode";

export class EnvironmentStatusEntry {
  private readonly statusItem: StatusBarItem;

  public constructor(environment?: string) {
    const envLabel = environment || "No Environment";
    this.statusItem = window.createStatusBarItem('env', StatusBarAlignment.Right, 100);
    this.statusItem.command = "rest-forge.setActiveEnvironment";
    this.statusItem.text = `$(arrow-swap) ${envLabel}`;
    this.statusItem.tooltip = "Set Active Environment for REST Forge";
    this.statusItem.name = "REST Forge Environment";
    this.statusItem.show();
  }

  public dispose() {
    this.statusItem.dispose();
  }

  public update(environment?: string) {
    const envLabel = environment || "No Environment";
    this.statusItem.text = `$(arrow-swap) ${envLabel}`;
  }
}