'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import {Extension, Util, PathInfo} from './nekoaisle.lib/nekoaisle';

/**
 * エクステンション本体
 */
class FindOpen extends Extension {
  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: '検索して開く',
      config: 'nekoaisle-findOpen',
      commands: [
        {
          command: 'nekoaisle.findOpen',
          callback: () => { this.exec(); }
        }
      ]
    });
  }

  /**
   * エントリー
   */
  public async exec() {
    // // 基準ディレクトリを決める
    // let cwd = Util.getWorkFolder();

    // ファイル名を入力
    let pattern = await vscode.window.showInputBox({
      placeHolder: '検索するglobパターンを入力してください。(複数指定は,区切り)',
      // prompt: `絶対パスまたは ${cwd} からの相対で指定してください。`
    });

    if (!pattern || (pattern.length <= 0)) {
      return;
    }

    // // ファイル名を補正
    // pattern = Util.normalizePath(pattern, Util.getWorkFolder());

    // 除外ファイルを取得
    let excludes: string = [
      ...Object.keys(await vscode.workspace.getConfiguration('search', null).get('exclude') || {}),
      ...Object.keys(await vscode.workspace.getConfiguration('files', null).get('exclude') || {})
    ].join(',');

    // ファイルを検索
    const uris = await vscode.workspace.findFiles(`{${pattern}}`/*, `{${excludes}}`*/);
    if (uris.length === 0) {
      Util.putMess(`${pattern} は見つかりませんでした。`);
      return;
    }

    // メニュ作成
    let menu: vscode.QuickPickItem[] = [];
    for (let uri of uris) {
      let pinfo = new PathInfo(uri.fsPath);
      menu.push({
        label: pinfo.info.base,
        description: pinfo.path,
      });
    }
  
    // メニュー選択
    let options: vscode.QuickPickOptions = {
      placeHolder: '選択してください。',
      matchOnDetail: false,
      matchOnDescription: false
    };
    vscode.window.showQuickPick(menu, options).then((sel) => {
      if (!sel || !sel.description) {
        // 未選択
        return;
      }

      Util.openFile(sel.description, false);
    });
  }

  /**
   * エントリー
   */
  public exec_ver1() {
    // 基準ディレクトリを決める
    let cwd = Util.getWorkFolder();

    // ファイル名を入力
    vscode.window.showInputBox({
      placeHolder: '検索するファイル名を入力してください。',
      prompt: `絶対パスまたは ${cwd} からの相対で指定してください。`
    }).then((file) => {
      if (!file || (file.length <= 0)) {
        return;
      }

      // ファイル名を補正
      file = Util.normalizePath(file, Util.getWorkFolder());

      // ファイルを検索
      let files = this.findFile(file);
      if (files.length <= 0) {
        return;
      }

      // メニュ作成
      let menu: vscode.QuickPickItem[] = [];
      for (let file of files) {
        let pinfo = new PathInfo(file);
        menu.push({
          label: pinfo.info.base,
          description: pinfo.path,
        });
      }

      // メニュー選択
      let options: vscode.QuickPickOptions = {
        placeHolder: '選択してください。',
        matchOnDetail: false,
        matchOnDescription: false
      };
      vscode.window.showQuickPick(menu, options).then((sel) => {
        if (!sel || !sel.description) {
          // 未選択
          return;
        }

        Util.openFile(sel.description, false);
      });
    });
  }

  public findFile(filename: string): string[] {
    let pinfo = new PathInfo(filename, Util.getWorkFolder());
    // let cmd = `find ${pinfo.info.dir} -type f -name "${pinfo.info.base}" ! -path "*/instemole-php/*"`;
    let cmd = `find ${pinfo.info.dir} -type f -name "${pinfo.info.base}"`;
    let res = Util.execCmd(cmd);
    res = res.trim();
    if (res) {
      return res.split("\n");
    } else {
      return [];
    }
  }
}

export = FindOpen;