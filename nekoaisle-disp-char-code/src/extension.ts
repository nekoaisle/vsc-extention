'use strict';
import * as vscode from 'vscode';
import {Util, Extension} from './nekoaisle.lib/nekoaisle';

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

/**
 * エクステンション本体
 */
class MyExtention extends Extension {
	private disposable: vscode.Disposable;
	private statusBarItem: vscode.StatusBarItem;
	private format: string;
	/**
	 * 構築
	 */
	constructor(context: vscode.ExtensionContext) {
		super(context, {
			name: 'nekoaisle-disp-char-code',
			commands: []
		});

		// エントリーを登録
		let subscriptions: vscode.Disposable[] = [];
		vscode.window.onDidChangeActiveTextEditor(this.onEvent, this, subscriptions);
		vscode.window.onDidChangeTextEditorSelection(this.onEvent, this, subscriptions);

		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		subscriptions.push(this.statusBarItem);

		// create a combined disposable from both event subscriptions
		this.disposable = vscode.Disposable.from(...subscriptions);

		// 表示フォーマット取得
		this.format = this.getConfig('format', '%c %H (%d)');

		// 初期表示
		this.dispCharCode();
	}

	public dispose() {
        this.disposable.dispose();
	}

	/**
	 * イベントハンドラ
	 */
	protected onEvent() {
		this.dispCharCode();
	}

	protected dispCharCode() {
		let editor = vscode.window.activeTextEditor;
		if ( !editor ) {
			this.statusBarItem.hide();
			return;
		}

		let doc = editor.document;

        // カーソル位置を取得
        let cursor  = editor.selection.start;
        // カーソルの行の内容を取得
        let line = doc.lineAt(cursor.line).text;
		// カーソル位置の文字コードを取得
		let str: string;
		if ( line.length > cursor.character ) {
			const c = line.charAt(cursor.character);
			const d = line.charCodeAt(cursor.character);
			const h = d.toString(16);
			const H = h.toLocaleUpperCase();

			str = this.format;
			str = str.replace('%c', c);
			str = str.replace('%d', '' + d);
			str = str.replace('%h', h);
			str = str.replace('%H', H);
		} else {
			str = (doc.eol == vscode.EndOfLine.LF) ? 'LF' : 'CRLF';
		}

		this.statusBarItem.text = str;
		this.statusBarItem.show();
	}
}
