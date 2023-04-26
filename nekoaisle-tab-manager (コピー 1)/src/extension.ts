import * as vscode from 'vscode';
import TabManager from './TabManager';
export function activate(context: vscode.ExtensionContext) {
	new TabManager(context);
}
