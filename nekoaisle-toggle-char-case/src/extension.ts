'use strict';
import * as vscode from 'vscode';
import {Util, Extension, EditReplace} from './nekoaisle.lib/nekoaisle';

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
	/**
	 * 構築
	 */
	constructor(context: vscode.ExtensionContext) {
		super(context, {
			name: 'Toggle Char Case',
			commands: [
				{
					command: 'nekoaisle.toggleCharCase',
					callback: () => {
						this.toggleCharCase()
					}
				},{
					command: 'nekoaisle.toggleWordCase',
					callback: () => {
						this.toggleWordCase();
					}
				}
			]
		});
	}

	/**
	 * カーソル位置または選択範囲の個々の文字のケースをトグル
	 */
	public toggleCharCase() {
		let editor = vscode.window.activeTextEditor;
		let doc = vscode.window.activeTextEditor.document;
		// 現在の選択範囲を取得
		let range: vscode.Range;
		let text: string;
		let move: boolean = false;
		let ary: EditReplace[] = [];
		for (let sel of editor.selections) {
			if (sel.start.isEqual(sel.end)) {
				// 範囲選択されていないので１文字変換
				let cursor = sel.active;

				let c = Util.getCharFromPos(editor, cursor);

				// 大文字小文字を変換
				c = Util.toggleCharCase(c);

				// カーソル位置の文字範囲を作成
				let range = new vscode.Range(cursor, cursor.translate(0, 1));

				// 大文字・小文字変換した文字と置換
				ary.push({ range: range, str: c });

				// カーソル移動指示
				move = true;
			} else {
				// 範囲選択されているので一括変換
				let text = doc.getText(sel).split('');

				for (let i = 0; i < text.length; ++i) {
					text[i] = Util.toggleCharCase(text[i]);
				}

				// 大文字・小文字変換した文字と置換
				ary.push({ range: sel, str: text.join('') });
			}
		}

		this.syncReplace(editor, ary);

		// カーソルを右に1文字移動
		if (move) {
			vscode.commands.executeCommand('cursorRight');
		}
	}

	/**
	 * カーソル位置または選択範囲の文字のケースをトグル
	 */
	public toggleWordCase() {
		let editor = vscode.window.activeTextEditor;
		let doc = vscode.window.activeTextEditor.document;
		let range: vscode.Range;
		let text: string;
		let ary: EditReplace[] = [];
		for (let sel of editor.selections) {
			// 現在の選択範囲を取得
			if (sel.start.isEqual(sel.end)) {
				// 範囲選択されていないので単語変換
				range = Util.getCursorWordRange(editor, sel.active);

				// カーソル位置の単語を取得
				text = doc.getText(range);

			} else {
				// 範囲選択されているので一括変換
				range = new vscode.Range(sel.start, sel.end);

				// 全文字を先頭文字のケースの逆に設定
				text = doc.getText(sel);
			}

			if (/^[A-ZＡ-Ｚ_][A-ZＡ-Ｚ0-9０-９_]*$/.test(text)) {
				// すべて大文字なので小文字に
				text = text.toLocaleLowerCase();
			} else if (/^[a-zａ-ｚ_][a-zａ-ｚ0-9０-９_]*$/.test(text)) {
				// すべて小文字なのでキャメルケースへ
				text = text.substr(0, 1).toLocaleUpperCase() + text.substr(1).toLocaleLowerCase();
			} else if (/^[A-ZＡ-Ｚ][a-zａ-ｚ0-9０-９_]*$/.test(text)) {
				// キャメルケースなので大文字へ
				text = text.toLocaleUpperCase();
			} else {
				// 混ざっているので先頭文字の逆
				text = Util.toggleCharCase(text);
			}

			//
			ary.push({ range: range, str: text });
		}

		// 編集実行
		this.syncReplace(editor, ary);
	}
}
