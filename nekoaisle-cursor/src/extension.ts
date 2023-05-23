'use strict';
import * as vscode from 'vscode';
import SelectWord from './SelectWord';
import GotoLine from './GotoLine';
import MarkJump from './MarkJump';
import Cursor from './Cursor';

/**
 * エクステンション活性化
 * @param context 
 */
export function activate(context: vscode.ExtensionContext) {
	new SelectWord(context);
  new GotoLine(context);
  new MarkJump(context);
  new Cursor(context);
}

/**
 * 非活性化
 */
export function deactivate() {
}

