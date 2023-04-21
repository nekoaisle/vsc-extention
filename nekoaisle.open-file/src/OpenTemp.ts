'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import {Extension, SelectFile, PathInfo, Util} from './nekoaisle.lib/nekoaisle';

/**
 * テンポラリーファイルを開く
 */
class OpenFile extends Extension {
  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: 'テンポラリーファイルを開く',
      config: 'nekoaisle-openTemp',
      commands: [
        {
          command: `nekoaisle.openTemp`,
          callback: () => { this.exec(); }
        }
      ]
    });
  }

  /**
   * エントリー
   */
  public exec() {
    // 設定を取得
    let dir = this.getConfig('dir', '~/temp');
    let base = this.getConfig('base', 'temp');
    
    let menu: string[] = [
      '.txt',
      '.php',
      '.html',
      '.sql',
      '.csv',
      '.tsv',
      '.sh',
      '.js',
    ];
    for ( let k = 0; k < menu.length; ++ k ) {
      let fn = path.join(dir, `${base}${menu[k]}` );
      menu[k] = `${k+1} ${menu[k]} ${fn}`;
    }
    const popt = {
      prompt: dir,
      placeHolder: '作成するファイルを選択してください。',
    };

    // ファイルを選択
    vscode.window.showQuickPick(menu, popt).then((sel) => {
      if (!sel) {
        return;
      }
      // スペースで分解(3つ目がファイル名)
      let fn = sel.split(' ')[2];
      // ~ などファイル名を正規化
      fn = Util.normalizePath(fn);
      // ファイルを開く
      Util.openFile(fn, true);
    });
  }
}

export = OpenFile;