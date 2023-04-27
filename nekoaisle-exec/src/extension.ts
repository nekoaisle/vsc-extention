/**
 * 任意のシェルコマンドを実行
 * 
 * filename:  extension.ts
 * 
 * @package   
 * @version   1.0.0
 * @copyright Copyright (C) 2020 Yoshio Kiya All rights reserved.
 * @date      2020-03-26
 * @author    木屋善夫
 */
'use strict';
import * as vscode from 'vscode';
import {Util} from './nekoaisle.lib/Util';
import { Extension, EditInsert } from './nekoaisle.lib/Extension';

/**
 * エクステンション活性化
 * @param context 
 */
export function activate(context: vscode.ExtensionContext) {
	let ext = new MyExtention(context);
}

/**
 * 非活性化
 */
export function deactivate() {
}

interface NekoaislExecArgs {
	command: string;
	args?: string;
}

/**
 * 任意のシェルコマンドを実行
 */
class MyExtention extends Extension {
	/**
	 * 構築
	 */
	constructor(context: vscode.ExtensionContext) {
		super(context, {
			name: '任意のシェルコマンドを実行',
			config: 'nekoaisle-exec',		// 通常はコマンドのサフィックス
			commands: [
				{
					command: 'nekoaisle.exec',	// コマンド
					callback: (arg?: string) => {
						this.exec(arg);
					}
				},
				{
					command: 'nekoaisle.execInsert',	// コマンド
					callback: (arg?: string) => {
						this.execInsert(arg);
					}
				}
			]
		});
	}

	/**
	 * 実行
	 */
	public exec(cmd?: string) {
		if (!cmd) {
			// コマンドが指定されなかったので選択範囲かカーソル行
			let editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			// 選択範囲はある？
			if (!editor.selection.isEmpty) {
				// 選択範囲を取得
				cmd = editor.document.getText(editor.selection);
			} else {
				// 選択範囲がないのでカーソル行を取得
				cmd = Util.getCursorLine(editor);
			}
		}

		// 実行
		Util.execCmd(cmd);
	}

	/**
	 * 実行して結果を挿入
	 */
	public async execInsert(cmd?: string) {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		if (!cmd) {
			// コマンドが指定されなかったので選択範囲かカーソル行
			// 選択範囲はある？
			if (!editor.selection.isEmpty) {
				// 選択範囲を取得
				cmd = editor.document.getText(editor.selection);
			} else {
				// 選択範囲がないのでカーソル行を取得
				cmd = Util.getCursorLine(editor);
			}
		}

		// 実行
		let res = Util.execCmd(cmd);

		// カーソルを行末に移動
		await vscode.commands.executeCommand('cursorEnd');

		// 結果を挿入
		res = "\n" + res;
		let inserts: EditInsert[] = [];
		for (let sels of editor.selections) {
			inserts.push({
				pos: sels.anchor,
				str: res,
			});
		}
		this.syncInsert(editor, inserts);
	}
}
