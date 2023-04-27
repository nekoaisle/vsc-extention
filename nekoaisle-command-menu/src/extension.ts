'use strict';
import * as vscode from 'vscode';
import CommandMenu from './CommandMenu';

export function activate(context: vscode.ExtensionContext) {
    new CommandMenu(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

