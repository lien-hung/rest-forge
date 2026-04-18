import { StatusBarAlignment, StatusBarItem, window } from "vscode";

export class EnvironmentStatusEntry {
  private readonly statusItem: StatusBarItem;

  public constructor(environment?: string) {
    this.statusItem = window.createStatusBarItem('env', StatusBarAlignment.Right, 100);
    this.statusItem.command = "api-tester.setActiveEnvironment";
    this.statusItem.text = environment ? `$(arrow-swap) ${environment}` : "$(arrow-swap) No Environment";
    this.statusItem.tooltip = "Set Active Environment for API Tester";
    this.statusItem.name = "API Tester Environment";
    this.statusItem.show();
  }

  public dispose() {
    this.statusItem.dispose();
  }

  public update(environment?: string) {
    this.statusItem.text = environment ? `$(arrow-swap) ${environment}` : "$(arrow-swap) No Environment";
  }
}