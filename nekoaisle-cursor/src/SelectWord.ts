'use strict';
import * as vscode from 'vscode';
import {Extension, Util} from './nekoaisle.lib/nekoaisle';

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
			config: 'nekoaisle-cursor',		// 通常はコマンドのサフィックス
			commands: [
				{
					command: 'nekoaisle-cursor.selectWord',	// 単語選択
					callback: () => { this.selectWords(); }
				},
				{
					command: 'nekoaisle-cursor.addCursor',	// カーソルの追加
					callback: () => { this.addCursor(); }
				},
				{
					command: 'nekoaisle-cursor.delCursor',	// カーソルの削除
					callback: () => { this.delCursor(); }
				}
			]
		});
	}

	/**
	 * すべてのカーソル位置の単語を選択
	 */
	public selectWords() {
    if (!vscode.window.activeTextEditor) {
      return;
    }

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
	protected selectWord(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null {
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
	 * カーソル位置の水平位置取得(全角対応)
	 * @param text 行の文字列
	 * @param pos  カーソル位置
	 * @param tabs タブ桁数
	 * @return 全角対応カーソル位置
	 */
	public getColumnFromPosition(text: string, pos: vscode.Position, tabs: number): number {
		let x1 = 0;
		for (let i = 0; i < pos.character; ++i) {
			let c = text.charCodeAt(i);
			if (c === 0x09) {
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
	
		return x1;
	}

	/**
	 * 指定水平位置の戦闘からの文字数取得(全角対応)
	 * @param text 行の文字列
	 * @param x    水平位置
	 * @param tabs タブ桁数
	 * @return 全角対応カーソル位置
	 */
	public getPositionFromColumn(text: string, x: number, tabs: number): number {
		let x2 = 0;	// X座標
		let i = 0;	// 文字番号
		// for (; (i < line.length) && (x2 < x); ++i) {
		for (; i < text.length; ++i) {
			if (x2 >= x) {
				// 位置決定
				return i;
			}

			let c = text.charCodeAt(i);
			if (c === 0x09) {
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

		// 指定位置まで到達できなかった
		// return -1;
		return i;
	}

	/**
	 * 現在のエディタの最後のカーソルの下にカーソルを追加
	 */
  public addCursor() {
    if (!vscode.window.activeTextEditor) {
      return;
    }

		let editor = vscode.window.activeTextEditor;
		let tabs = parseInt((editor.options.tabSize ?? 4).toString());

		// 既存の editor.selections を操作してもカーソルには反映されない？
		// 対症療法として新たなカーソルを作成
		let sels: vscode.Selection[] = [];

		// 最初のカーソル位置
		let last = editor.selections[0].active;
		sels.push(new vscode.Selection(last, last));

		// カーソルのX座標を取得(全角対応)
		let text = editor.document.lineAt(last.line).text;
		let x = this.getColumnFromPosition(text, last, tabs);

		// 最も後ろにあるカーソルを取得
		for (let i = 1; i < editor.selections.length; ++i) {
			let sel = editor.selections[i];
			if (sel.active.isAfter(last)) {
				last = sel.active;
			}
			sels.push(new vscode.Selection(sel.anchor, sel.active));
		}

		let y = last.line;	// Y 位置
		let i = -1;					// 文字位置
		// do {
			// 1行下の座標を取得
			++y;
			if (y >= editor.document.lineCount) {
				// 最下行を超えたので終了
				return;
			}

			// １行下のX座標の文字番号を取得
			text = editor.document.lineAt(y).text;
			// X座標位置に文字がない(短い)場合は -1 が戻ってくる
			i = this.getPositionFromColumn(text, x, tabs);
		// } while (i < 0);

		// カーソルを追加
		let pos = new vscode.Position(y, i);
		sels.push(new vscode.Selection(pos, pos));
		editor.selections = sels;
		// カーソル位置が画面内にならないように調整
    let range = new vscode.Range(pos, pos);
    vscode.window.activeTextEditor.revealRange(range);
	}

	/**
	 * 現在のエディタの最後のカーソルを除去
	 */
	public delCursor() {
    if (!vscode.window.activeTextEditor) {
      return;
    }

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

		// カーソル位置が画面内にならないように調整
		const sel = <vscode.Selection>sels.at(sels.length - 1);
    let range = new vscode.Range(sel.active, sel.active);
    vscode.window.activeTextEditor.revealRange(range);

	}

}

export default SelectWord;