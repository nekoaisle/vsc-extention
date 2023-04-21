'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as jschardet from 'jschardet';
import * as iconv from 'iconv-lite';
import {Extension, SelectFile, PathInfo, Util} from './nekoaisle.lib/nekoaisle';

/**
 * エクステンション本体
 */
class InsertFile extends Extension {
  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: 'メニューからファイルを選択してカーソル位置に読み込む',
      config: 'nekoaisle-insertFile',
      commands: [
        {
          command: 'nekoaisle.insertFile',
          callback: () => {
            this.exec();
          }
        }
      ]
    });
  }

  /**
   * エントリー
   */
  public exec() {
    if (!vscode.window.activeTextEditor) {
      return;
    }
    let editor: vscode.TextEditor = vscode.window.activeTextEditor;

    // 開始ディレクトリを取得
    let start: string;
    if (vscode.window.activeTextEditor) {
      // アクティブなエディターのファイル名を分解
      start = editor.document.fileName;
    } else if (Util.getWorkFolder()) {
      start = Util.getWorkFolder();
    } else {
      start = '~/';
    }

    // ファイル名情報を取得
    const pinfo = new PathInfo(start);
    // ディレクトリー名を取得
    const dirName = pinfo.getDirName();

    const title = '読み込むファイルを選択してください。';
    const selectFile = new SelectFile();
    selectFile.selectFile(dirName, title).then((file: string) => {
      if (file.length > 0) {
        // ファイルを読み込む
        fs.readFile(file, (err, data) => {
          if (err) {
            console.error(err);
          } else {
            let encoding = jschardet.detect(data).encoding;
            Util.putLog(encoding);
            let text: string;
            switch (encoding) {
              // UTF-8 と ascii はそのまま
              case 'UTF-8':
              case 'ascii': {
                text =　data.toLocaleString();
                break;
              }
              // それ以外は Shift-JIS
              default: {
                text = iconv.decode(data, 'SHIFT_JIS');
                break;
              }
            }
            editor.edit((edit) => {edit.insert(editor.selection.active, text);});
          }
        });
      }
    });
  }
}

export = InsertFile;