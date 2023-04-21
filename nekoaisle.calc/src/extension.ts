'use strict';
import * as vscode from 'vscode';
import { Util, Extension, EditInsert } from './nekoaisle.lib/nekoaisle';
import { isArray } from 'util';
import { sprintf } from 'sprintf-js';

export function activate(context: vscode.ExtensionContext) {
  let ext = new MyExtension(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class MyExtension extends Extension {
  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: 'nekoaisle-calc',
      config: 'nekoaisle-calc',
      commands: [{
        command: 'nekoaisle.calc',
        callback: () => { this.entry(); }
      }]
    });
  }

  /**
   * エントリー
   */
  protected async entry() {
    // まずは計算式入力
    let exp = await vscode.window.showInputBox({
      placeHolder: "計算式を入力してください。"
    });
    if (typeof exp !== "string") {
      // キャンセルされた
      return;
    }

    // // 数式チェック
    // const re = /^[0-9-+*/&|^()]+$/;
    // let res = re.exec(exp);
    // if (!isArray(res)) {
    //   // 計算できない文字列だった
    //   Util.putMess(`数式に使えない文字が含まれています。 ${exp}`);
    //   return;
    // }

    // 計算
    let ev;
    try {
      ev = eval(`${exp}`);
    } catch (e) {
      // 計算できない文字列だった
      Util.putMess(`計算できませんでした。 ${exp}`);
      return;
    }
    let value: number = parseFloat(ev);
    if (isNaN(value)) {
      // 計算できない文字列だった
      Util.putMess(`計算できませんでした。 ${exp}`);
      return;
    }

    // 書式入力
    let format = await vscode.window.showInputBox({
      value: this.getConfig('format', '%f'),
      placeHolder: "出力書式を入力してください。"
    });
    if (typeof format !== "string") {
      // キャンセルされた
      return;
    }

    // フォーマット変換
    // let cmd = `printf "${format}" "${value}"`;
    // let valString: string = Util.execCmd(cmd);
    let valString: string = sprintf(format, value);

    // 現在のエディタを取得
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      // 編集中ではないのでメッセージ出力
      Util.putMess(valString);
    } else {
      // カーソル位置に挿入
      let inserts: EditInsert[] = [];
      for (let sels of editor.selections) {
        inserts.push({
          pos: sels.anchor,
          str: valString,
        });
      }
      this.syncInsert(editor, inserts);
    }
  }
}
