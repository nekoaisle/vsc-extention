'use strict';
import * as vscode from 'vscode';
import { CommandMenu } from './CommandMenu';
import CommandMenuView from './CommandMenuView'

export function activate(context: vscode.ExtensionContext) {
    const commandMenu = new CommandMenu(context);
    new CommandMenuView(context, commandMenu);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

