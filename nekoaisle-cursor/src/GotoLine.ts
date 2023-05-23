'use strict';
import * as vscode from 'vscode';
import { Extension } from './nekoaisle.lib/nekoaisle';

interface Options {
  default?: string;   // 初期行番号
}

/**
 * エクステンション本体
 */
class GotoLine extends Extension {
  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    // 登録するコマンド配列を作成
    super(context, {
      name: '行番号ジャンプ',
      config: 'nekoaisle-cursor.gotoLine',
      commands: [
        {
          command: 'nekoaisle-cursor.gotoLine',
          callback: (options: Options) => {
            this.jumpAfterInput(options);
          }
        }
      ]
    });
  }

  /**
   * 指定行番号へジャンプ
   * @param line ジャンプする行番号
   */
  protected jump(line: string | undefined) {
    // 行が指定されていないときは何もしない
    if (!vscode.window.activeTextEditor || !line || line.length <= 0) {
      return;
    }

    let l = parseInt(line);
    //ドキュメントを取得
    let editor = vscode.window.activeTextEditor;
    // 指定行の範囲を取得
    const range = editor.document.lineAt(l - 1).range;
    // 指定行の開始位置にカーソルを移動
    editor.selection = new vscode.Selection(range.start, range.start);
    // 指定レンジが画面に表示される位置にスクロール
    editor.revealRange(range);
  }

  /**
   * 行番号指定ジャンプ
   * @param top 行版の先頭の数字 
   */
  protected jumpAfterInput(options: Options) {
    // InputBoxを表示して行番号を求める
    var option:vscode.InputBoxOptions = {
      prompt: "ジャンプする行番号を入力してください。",
      password:false,
      value: options.default,
      valueSelection: [1,1]
    };
    vscode.window.showInputBox(option).then(this.jump);
  }
}

export default GotoLine;