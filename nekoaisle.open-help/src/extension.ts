'use strict';
import * as vscode from 'vscode';
import { Util, Extension } from './nekoaisle.lib/nekoaisle';

/**
 * エクステンション活性化
 * @param context 
 */
export function activate(context: vscode.ExtensionContext) {
  let ext = new MyExtension(context);
}

/**
 * 非活性化
 */
export function deactivate() {
}

interface ListItem {
  method?: string;
  path?: string;
  options?: { [key: string]: string};
  link?: string;
}

/**
 * エクステンション本体
 */
class MyExtension extends Extension {
  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: 'カーソル位置の単語でマニュアルなどを開く',
      config: 'nekoaisle-openHelp',		// 通常はコマンドのサフィックス
      commands: [
        {
          command: 'nekoaisle.openHelp',	// コマンド
          callback: () => { this.exec(); }
        }
      ]
    });
  }

  /**
   * エントリー
   */
  public exec() {
    //
    let editor = vscode.window.activeTextEditor;
    
    // カーソル位置の単語を取得
    let word: string;
    if (editor.selection.isEmpty) {
      word = Util.getCursorWord(editor);
    } else {
      word = editor.document.getText(editor.selection);
    }
    
    // デフォルトのリストファイル名
    let deffn = this.joinExtensionRoot("data/openHelp.json");
    let defaults = Util.loadFileJson(deffn);
    
    // settings.json よりテンプレートディレクトリを取得
    let list = this.getConfig("exts", defaults);
    
    // 設定ファイルの読み込み
    // 継承を解決
    for (let key in list) {
      let item: ListItem = list[key];
      if (item['inherit']) {
        // このアイテムは継承が指定されている
        let inherit = list[item['inherit']];
        if (inherit) {
          // このオブジェクトで定義されていない要素は継承元から取得
          for (let k in inherit) {
            if (typeof item[k] === "undefined") {
              // このオブジェクトでは指定されていない
              item[k] = inherit[k];
            }
          }
        }
      }
    }

    // どのセクションを使用するか決める
    let lang: string;
    if (list[editor.document.languageId]) {
      // この言語用のセクションがあった
      lang = editor.document.languageId;
    } else if (list['default']) {
      // なかったのでデフォルトを使用
      lang = "default";
    } else {
      // default 設定がない
      Util.putMess('このファイルタイプ用の設定がありません。');
    }

    let item: ListItem = list[lang];
    switch (item.method) {
      case 'chrome': {
        for (let key in item.options) {
          item.options[key] = item.options[key].replace("{{word}}", word);
        }
        Util.browsURL(item.path, item.options);
        break;
      }
      default: {
        break;
      }
    }
  }
}
