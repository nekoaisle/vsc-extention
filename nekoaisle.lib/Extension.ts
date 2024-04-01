'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import {Util} from './Util';

export interface ExtensionCallback {
	(...args: any[]): any;
}

export interface ExtensionCommand {
	command: string;	// コマンド
	callback: ExtensionCallback;		// 実行する関数
}

export interface ExtensionOptions {
	name: string;
	config?: string;
	commands?: ExtensionCommand[];
}

export interface EditInsert {
	pos: vscode.Position;
	str: string;
}

export interface EditReplace {
	range: vscode.Range;
	str: string;
}

/**
 * 拡張機能基本クラス
 */
export class Extension {
	protected options: ExtensionOptions;
	protected extensionRoot: string;

	/**
	 * 構築
	 * @param name 拡張機能名
	 * @param cmd  contributes.commands.command
	 */
	constructor(context: vscode.ExtensionContext, options: ExtensionOptions) {
//		console.log(`${options.name} が起動しました。`);

		// この拡張機能が格納されているディレクトリ名
		this.extensionRoot = context.extensionPath;

		// 起動オプションを記憶
		this.options = options;

		// コマンドがあれば登録
		if (options.commands) {
			this.registerCommands(context, options.commands);
		}
	}

	public getConfiguration(): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(this.options.config);
	}

	/**
	 * settings.json からこの拡張機能用の設定を取得
	 * @param key 設定名
	 * @param def 設定されていないときに返す値
	 * @return string 設定
	 */
	public getConfig<TYPE>(key: string, def: TYPE): TYPE {
		let config = this.getConfiguration();
		let ret = config.get(key, def);
		if (ret) {
			return ret;
		}
		return def;
	}

	/**
	 * コマンドを登録
	 * @param context 
	 * @param ext 
	 */
	public registerCommand(context: vscode.ExtensionContext, command: string,callback: ExtensionCallback ) {
		let disp = vscode.commands.registerCommand(command, callback);
		context.subscriptions.push(disp);
	}

	/**
	 * コマンドを登録
	 * @param context 
	 * @param ext 
	 */
	public registerCommands(context: vscode.ExtensionContext, commands: ExtensionCommand[]) {
		for ( let cmd of commands ) {
			let disp = vscode.commands.registerCommand(cmd.command, cmd.callback);
			context.subscriptions.push(disp);
		}
	}

	/**
	 * 拡張機能フォルダー内に格納されているファイル名をフルパスにする
	 * @param filename ファイル名
	 */
	public joinExtensionRoot(filename: string): string {
		return path.join(this.extensionRoot, filename);
	}

		/**
	 * setting.jsonからファイル名を取得
	 * @param key setting.json のキー
	 * @param def 設定がないときの名前
	 * @return ファイル名
	 */
	public getFilenameAccordingConfig(key: string, def: string): string {
		// デフォルトのリストファイル名
		let fn = this.joinExtensionRoot(def);

		// settings.json より履歴ファイル名を取得
		fn = this.getConfig(key, fn);

		// 先頭の ~ を置換
		fn = Util.normalizePath(fn);

		//
		return fn;
	}

	/**
	 * テンプレート格納ディレクトリ名を取得
	 * ※互換性の為残します 
	 * @param dirName ディレクトリ名
	 * @param settingsKey settings.json のサブキー
     * @return string テンプレート格納ディレクトリ名
	 */
	protected getConfigDir(dirName: string, settingsKey: string): string {
		return this.getFilenameAccordingConfig(settingsKey, dirName);
	}

	/**
	 * 複数挿入
	 * @param editor 対象エディター
	 * @param pos 編集座標
	 * @param str 挿入文字列
	 * @param ary 編集情報配列
	 */
	public async syncInsert(editor: vscode.TextEditor, ary: EditInsert[]) {
		// // 非同期編集を実行
		// let i = 0;
		// let e = (pos: vscode.Position, str: string) => {
		// 	// 大文字・小文字変換した文字と置換
		// 	editor.edit(edit => edit.insert(pos, str)).then((val: boolean) => {
		// 		if (val) {
		// 			++i;
		// 			if (ary[i]) {
		// 				e(ary[i].pos, ary[i].str);
		// 			}
		// 		}
		// 	});
		// };

		// e(ary[i].pos, ary[i].str);
		for (let rep of ary) {
			let pos = rep.pos;
			let str = rep.str;
			await (editor.edit(edit => edit.replace(pos, str)));
		}
	}

	/**
	 * 複数置換
	 * @param editor 対象エディター
	 * @param pos 編集座標
	 * @param str 挿入文字列
	 * @param ary 編集情報配列
	 */
	public async syncReplace(editor: vscode.TextEditor, ary: EditReplace[]) {
		// 非同期編集を実行
		// let i = 0;
		// let e = (sel: vscode.Range, str: string) => {
		// 	// 大文字・小文字変換した文字と置換
		// 	editor.edit(edit => edit.replace(sel, str)).then((val: boolean) => {
		// 		if (val) {
		// 			++ i;
		// 			if (ary[i]) {
		// 				e(ary[i].range, ary[i].str);
		// 			}
		// 		}
		// 	});
		// };

		// e(ary[i].range, ary[i].str);

		for (let rep of ary) {
			let sel = rep.range;
			let str = rep.str;
			await (editor.edit(edit => edit.replace(sel, str)));
		}
	}

	/**
	 * 選択範囲を変更
	 */
	public setSelection(id: number, sel: vscode.Selection, editor: vscode.TextEditor) {
		// 現在の選択範囲を取得
		let sels: vscode.Selection[] = [];
		for (let i = 0; i < editor.selections.length; ++i) {
			sels[i] = editor.selections[i];
		}

		// 指定IDのスロットを差し替える
		sels[id] = sel;

		// エディターに設定
		editor.selections = sels;
	}
	
}
