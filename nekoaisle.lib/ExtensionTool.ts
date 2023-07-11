'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import {Util} from './Util';

export module Extension {

  interface ExtensionCallback {
    (...args: any[]): any;
  }

  interface ExtensionCommand {
    command: string;	// コマンド
    callback: ExtensionCallback;		// 実行する関数
  }

  interface ExtensionOptions {
    name: string;
    config?: string;
    commands?: ExtensionCommand[];
  }

  interface EditInsert {
    pos: vscode.Position;
    str: string;
  }

  interface EditReplace {
    range: vscode.Range;
    str: string;
  }

	let options: ExtensionOptions;
	let extensionRoot: string;

	/**
	 * 構築
	 * @param name 拡張機能名
	 * @param cmd  contributes.commands.command
	 */
	function constructor(context: vscode.ExtensionContext, options: ExtensionOptions) {
//		console.log(`${options.name} が起動しました。`);

		// この拡張機能が格納されているディレクトリ名
		extensionRoot = context.extensionPath;

		// 起動オプションを記憶
		options = options;

		// コマンドがあれば登録
		if (options.commands) {
			registerCommands(context, options.commands);
		}
	}

	function getConfiguration(): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(options.config);
	}

	/**
	 * settings.json からこの拡張機能用の設定を取得
	 * @param key 設定名
	 * @param def 設定されていないときに返す値
	 * @return string 設定
	 */
	function getConfig<TYPE>(key: string, def: TYPE): TYPE {
		let config = getConfiguration();
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
	function registerCommand(context: vscode.ExtensionContext, command: string,callback: ExtensionCallback ) {
		let disp = vscode.commands.registerCommand(command, callback);
		context.subscriptions.push(disp);
	}

	/**
	 * コマンドを登録
	 * @param context 
	 * @param ext 
	 */
	function registerCommands(context: vscode.ExtensionContext, commands: ExtensionCommand[]) {
		for ( let cmd of commands ) {
			let disp = vscode.commands.registerCommand(cmd.command, cmd.callback);
			context.subscriptions.push(disp);
		}
	}

	/**
	 * 拡張機能フォルダー内に格納されているファイル名をフルパスにする
	 * @param filename ファイル名
	 */
	function joinExtensionRoot(filename: string): string {
		return path.join(extensionRoot, filename);
	}

		/**
	 * setting.jsonからファイル名を取得
	 * @param key setting.json のキー
	 * @param def 設定がないときの名前
	 * @return ファイル名
	 */
	function getFilenameAccordingConfig(key: string, def: string): string {
		// デフォルトのリストファイル名
		let fn = joinExtensionRoot(def);

		// settings.json より履歴ファイル名を取得
		fn = getConfig(key, fn);

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
	function getConfigDir(dirName: string, settingsKey: string): string {
		return getFilenameAccordingConfig(settingsKey, dirName);
	}

	/**
	 * 複数挿入
	 * @param editor 対象エディター
	 * @param pos 編集座標
	 * @param str 挿入文字列
	 * @param ary 編集情報配列
	 */
	function syncInsert(editor: vscode.TextEditor, ary: EditInsert[]) {
		// 非同期編集を実行
		let i = 0;
		let e = (pos: vscode.Position, str: string) => {
			// 大文字・小文字変換した文字と置換
			editor.edit(edit => edit.insert(pos, str)).then((val: boolean) => {
				if (val) {
					++i;
					if (ary[i]) {
						e(ary[i].pos, ary[i].str);
					}
				}
			});
		};

		e(ary[i].pos, ary[i].str);
	}

	/**
	 * 複数置換
	 * @param editor 対象エディター
	 * @param pos 編集座標
	 * @param str 挿入文字列
	 * @param ary 編集情報配列
	 */
	function syncReplace(editor: vscode.TextEditor, ary: EditReplace[]) {
		// 非同期編集を実行
		let i = 0;
		let e = (sel: vscode.Range, str: string) => {
			// 大文字・小文字変換した文字と置換
			editor.edit(edit => edit.replace(sel, str)).then((val: boolean) => {
				if (val) {
					++i;
					if (ary[i]) {
						e(ary[i].range, ary[i].str);
					}
				}
			});
		};

		e(ary[i].range, ary[i].str);
	}
}
