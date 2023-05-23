'use strict';
import * as vscode from 'vscode';
import { Extension } from './nekoaisle.lib/nekoaisle';

interface Options {
  default?: string;   // 初期行番号
}

/**
 * エクステンション本体
 */
class Cursor extends Extension {
  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    // 登録するコマンド配列を作成
    super(context, {
      name: 'カーソルをもとの位置に戻す',
      config: 'nekoaisle-cursor.undo',
      commands: [
        {
          command: 'nekoaisle-cursor.undo',
          callback: () => { this.undo(); }
        },
        {
          command: 'nekoaisle-cursor.revealRange',
          callback: () => { this.revealRange(); }
        }
      ]
    });
  }

  /**
   * カーソルをもとの位置に戻す
   */
  public async undo() {
    // エディタが選択されていないときは何もしない
    if (!vscode.window.activeTextEditor) {
      return;
    }

    await vscode.commands.executeCommand("cursorUndo");
    this.revealRange();
  }

  /**
   * カーソルをもとの位置に戻す
   */
  public async revealRange() {
    // エディタが選択されていないときは何もしない
    if (!vscode.window.activeTextEditor) {
      return;
    }

    let editor = vscode.window.activeTextEditor;
    let pos = editor.selection.active;
    let range = editor.document.lineAt(pos.line).range;
    editor.revealRange(range);
  }

}  

export default Cursor;