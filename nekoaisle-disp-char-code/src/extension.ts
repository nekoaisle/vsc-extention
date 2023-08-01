'use strict';
import * as vscode from 'vscode';
import { Util, Extension } from './nekoaisle.lib/nekoaisle';

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
	private charBefore: string;
	private charAfter: string;

	/**
	 * 制御コード表
	 */
	private static ctrlCode = [
		'NULL',	// 00
		'SOH',	// 01
		'STX',	// 02
		'ETX',	// 03
		'EOT',	// 04
		'ENG',	// 05
		'ACK',	// 06
		'BEL',	// 07
		'BS',		// 08
		'HT',		// 09
		'LF',		// 0A
		'VT',		// 0B
		'FF',		// 0C
		'CR',		// 0D
		'SO',		// 0E
		'SI',		// 0F
		'DLE',	// 10
		'DC1',	// 11
		'DC2',	// 12
		'DC3',	// 13
		'DC4',	// 14
		'NAK',	// 15
		'SYN',	// 16
		'ETB',	// 17
		'CAN',	// 18
		'EM',		// 19
		'SUB',	// 1A
		'ESC',	// 1B
		'FS',		// 1C
		'GS',		// 1D
		'RS',		// 1E
		'US',		// 1F
		'SPC',	// 20
	];

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
		this.format     = this.getConfig('format', "%c %HH (%d)");
		this.charBefore = this.getConfig('charBefore', "'");
		this.charAfter  = this.getConfig('charAfter' , "'");
	
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
			const d = line.charCodeAt(cursor.character);
			const h = d.toString(16);
			const H = h.toLocaleUpperCase();
			let c;
			if (d <= 0x20) {
				c = MyExtention.ctrlCode[d];
			} else if (d === 0x7f) {
				c = 'DEL';
			} else {
				c = String.fromCharCode(d);
				c = `${this.charBefore}${c}${this.charAfter}`;
			}
	
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
