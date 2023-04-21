'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import * as chproc from 'child_process';
import {Util, Extension} from './nekoaisle.lib/nekoaisle';

export function activate(context: vscode.ExtensionContext) {
    let extention = new OpenFiler(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class OpenFiler extends Extension {
	/**
	 * 構築
	 */
	constructor(context: vscode.ExtensionContext) {
		super(context, {
			name: 'Open Filer',
			config: 'nekoaisle-openFiler',		// 通常はコマンドのサフィックス
			commands: [
				{
					command: 'nekoaisle.openFiler',	// コマンド
					callback: () => {
						this.exec()
					}
				}
			]
		});
	}

	/**
	 * エントリー
	 */
	public exec() {
		// settings.json からファイラーの名前を取得
		let filer = this.getConfig('filer', 'nautilus -s');

		//ドキュメントを取得
		let editor = vscode.window.activeTextEditor;

		// ファイル名を取得
		let fileName = editor.document.fileName;

		// コマンドラインを作成
		// let pinfo = path.parse(fileName);
		// let cmd = `${filer} -s ${pinfo.dir}`;
		let cmd = `${filer} "${fileName}"`;

		// 非同期実行
		console.log(cmd);
		chproc.exec(cmd, (err, stdout: string, stderr: string) => {
			if (err == null) {
				console.log(stdout);
			} else {
				// エラーが発生
				let str = `error:
${err.message}
stderr:
${stderr}
stdout:
${stdout}
trace:
${err.stack}
`;
			}
		});

		// 外部コマンドで開く
		// let pinfo = path.parse(fileName);
		// let uri = vscode.Uri.parse(`file://${pinfo.dir}`);
		// vscode.env.openExternal(uri);
	}
}
