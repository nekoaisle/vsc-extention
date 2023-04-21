'use strict';
import * as vscode from 'vscode';
import {Extension, Util} from './nekoaisle.lib/nekoaisle';

/**
 * エクステンション活性化
 * @param context 
 */
export function activate(context: vscode.ExtensionContext) {
	let ext = new SelectWord(context);
}

/**
 * 非活性化
 */
export function deactivate() {
}

/**
 * エクステンション本体
 */
class SelectWord extends Extension {
	/**
	 * 構築
	 */
	constructor(context: vscode.ExtensionContext) {
		super(context, {
			name: 'カーソル位置の単語を選択/その他',
			config: 'nekoaisle-selectWord',		// 通常はコマンドのサフィックス
			commands: [
				{
					command: 'nekoaisle.selectWord',	// 単語選択
					callback: () => {
						this.selectWords()
					}
				},
				{
					command: 'nekoaisle.addCursor',	// カーソルの追加
					callback: () => {
						this.addCursor()
					}
				},
				{
					command: 'nekoaisle.delCursor',	// カーソルの削除
					callback: () => {
						this.delCursor()
					}
				}
			]
		});
	}

	/**
	 * すべてのカーソル位置の単語を選択
	 */
	public selectWords() {
		let editor = vscode.window.activeTextEditor;
		let i = 0;

		let sels: vscode.Selection[] = [];
		for (let selection of editor.selections) {
			let sel = this.selectWord(editor, selection);
			if (sel) {
				sels.push(sel);
			}
		}
		vscode.window.activeTextEditor.selections = sels;
	}

	/**
	 * 指定されたカーソル位置の単語を選択
	 * @param editor 対象エディター
	 * @param selection 対象選択範囲
	 */
	protected selectWord(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection {
		// 範囲選択されている？
		if (selection.isEmpty) {
			// 範囲選択されていないのでカーソル位置の単語を範囲選択
			// カーソル位置の単語の範囲を取得
			let range = Util.getCursorWordRange(editor, selection.active);
			// 現在の選択範囲と等しくないので単語を選択
			return new vscode.Selection(range.start, range.end);
		} else {
			// 範囲選択されているときは範囲を拡大
			try {
				let range = new vscode.Range(selection.start.translate(0, -1), selection.end.translate(0, 1));
				return new vscode.Selection(range.start, range.end);
			} catch (err) {
				// 範囲を広げられなかった
				return null;
			}
		}
	}

	/**
	 * 現在のエディタの最後のカーソルの下にカーソルを追加
	 */
	public addCursor() {
		let editor = vscode.window.activeTextEditor;

		let tabs = parseInt(editor.options.tabSize.toString());

		// 既存の editor.selections を操作してもカーソルには反映されない？
		// 対症療法として新たなカーソルを作成
		let sels: vscode.Selection[] = [];

		// 最も後ろにあるカーソルを取得
		let last = editor.selections[0].active;
		sels.push(new vscode.Selection(last, last));

		for (let i = 1; i < editor.selections.length; ++i) {
			let sel = editor.selections[i];
			if (sel.active.isAfter(last)) {
				last = sel.active;
			}
			sels.push(new vscode.Selection(sel.anchor, sel.active));
		}

		// 1行下の座標を取得
		let next = last.translate(1, 0);
		if (last.isEqual(next)) {
			// カーソル位置が変化しないということは最終行なので終了
			return;
		}

		// カーソルのX座標を取得(全角対応)
		let line = editor.document.lineAt(last.line).text;
		let x1 = 0;
		for (let i = 0; i < last.character; ++i) {
			let c = line.charCodeAt(i);
			if (c == 0x09) {
				// タブ
				x1 = Math.floor((x1 + tabs) / tabs) * tabs;
			} else if (c < 0x100) {
				// 半角
				x1 += 1;
			} else {
				// 全角
				x1 += 2;
			}
		}

		// １行下のX座標の文字番号を取得
		line = editor.document.lineAt(next.line).text;
		let x2 = 0;	// X座標
		let i = 0;	// 文字番号
		for (; (i < line.length) && (x2 < x1); ++i) {
			let c = line.charCodeAt(i);
			if (c == 0x09) {
				// タブ
				x2 = Math.floor((x2 + tabs) / tabs) * tabs;
			} else if (c < 0x100) {
				// 半角
				x2 += 1;
			} else {
				// 全角
				x2 += 2;
			}
		}

		// カーソルを追加
		let pos = new vscode.Position(next.line, i);
		sels.push(new vscode.Selection(pos, pos));
		editor.selections = sels;
	}

	/**
	 * 現在のエディタの最後のカーソルを除去
	 */
	public delCursor() {
		let editor = vscode.window.activeTextEditor;
		if (editor.selections.length <= 1) {
			// カーソルが１つなら何もしない
			return;
		}

		// 最も後ろにあるカーソルを取得
		let last = editor.selections[0].active;
		for (let i = 1; i < editor.selections.length; ++i) {
			let sel = editor.selections[i];
			if (sel.active.isAfter(last)) {
				last = sel.active;
			}
		}

		// 既存の editor.selections を操作してもカーソルには反映されない？
		// 対症療法として新たなカーソルを作成
		let sels: vscode.Selection[] = [];
		// 最も後ろにあるカーソル以外を複製
		for (let i = 0; i < editor.selections.length; ++i) {
			let sel = editor.selections[i];
			if (!sel.active.isEqual(last)) {
				sels.push(new vscode.Selection(sel.anchor, sel.active));
			}
		}
		editor.selections = sels;
	}

}
