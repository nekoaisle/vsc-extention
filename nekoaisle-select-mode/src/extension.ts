import * as vscode from 'vscode';
import SelectMode from './SelectMode';

/**
 * エクステンション活性化
 * @param context 
 */
export function activate(context: vscode.ExtensionContext) {
  /* tslint:disable:no-unused-expression */
	new SelectMode(context);
}

/**
 * 非活性化
 */
export function deactivate() {
}
