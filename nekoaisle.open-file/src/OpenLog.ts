/**
 * CPSSのログファイルを開く
 *
 * filename:  OpenLog.ts
 * 
 * @version   0.1.1
 * @copyright Copyright (C) 2020 Creansmaerd Co.,LTD. All rights reserved.
 * @date      2020-02-26
 * @author    木屋 善夫
 */

'use strict';
import * as vscode from 'vscode';
import {Extension, SelectFile, PathInfo, Util} from './nekoaisle.lib/nekoaisle';
import { isAbsolute } from 'path';

/**
 * エクステンション本体
 */
class OpenLog extends Extension {
  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: 'ログファイルを開く',
      config: 'nekoaisle-openLog',
      commands: [
        {
          command: 'nekoaisle.openLog',
          callback: () => { this.openLog(); }
        }
      ]
    });
  }

  /**
   * メニューからファイルを選択して開く
   */
  public openLog() {
    // 開始ディレクトリを取得
    let dirName = this.getConfig('logDir', 'log/dbg');
    if (!isAbsolute(dirName)) {
      // 相対パスならワークフォルダー追加
      dirName = Util.getWorkFolder() + '/' + dirName;
    }

    const title = 'ファイルを選択してください。';
    const selectFile = new SelectFile();
    selectFile.selectFile(dirName, title).then((file: string) => {
      if (file.length > 0) {
        vscode.workspace.openTextDocument(file).then((doc: vscode.TextDocument) => {
          return vscode.window.showTextDocument(doc);
        });
      }
    });
  }
}

export = OpenLog;