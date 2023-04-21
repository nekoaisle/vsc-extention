'use strict';
import * as vscode from 'vscode';
import { Extension, Util, SelectFile, PathInfo } from './nekoaisle.lib/nekoaisle';

class OpenRelated extends Extension {
  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: '現在のファイルと対になるファイルを開く',
      config: 'nekoaisle-openRelated',
      commands: [
        {
          command: 'nekoaisle.openRelated',
          callback: () => { this.exec(); }
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
    let fileName = editor.document.fileName;
    let pinfo = new PathInfo(fileName);

    let candidates: string[] = [];
    switch (pinfo.info.ext) {
      // PHP 独自処理
      case '.php': {
        this.php(pinfo);
        return;
      }

      // HTML 独自処理
      case '.html': {
        this.html(pinfo);
        return;
      }

      // PHTML
      case '.phtml': {
        // 同一ディレクトリの .php
        candidates.push(pinfo.getFileName('.php'));
        break;
      }

      // C++
      case '.cpp': {
        // 同一ディレクトリの .h
        candidates.push(pinfo.getFileName('.h'));
        break;
      }

      // C or C++
      case '.h': {
        // 同一ディレクトリの .cpp | .c
        candidates.push(pinfo.getFileName('.cpp'));
        candidates.push(pinfo.getFileName('.c'));
        break;
      }
      // typescript
      case '.ts': {
        // 同一ディレクトリの .html
        candidates.push(pinfo.getFileName('.html'));
        break;
      }
    }

    if (candidates.length > 0) {
      // 候補を順に探して存在するものを開く
      for (let fn of candidates) {
        if (Util.openFile(fn)) {
          return;
        }
      }

      // いずれも見つからなかったら
      // 優先順位の一番高いものを作成して開く
      Util.openFile(candidates[0], true);
    }
  }

  protected php(pinfo: PathInfo) {
    // pc ディレクトリの .html が存在すれば開く
    let htmlPC = pinfo.getFileName('.html', 'pc');
    if (Util.openFile(htmlPC)) {
      return;
    }

    // sp ディレクトリの .html が存在すれば開く
    let htmlSP = pinfo.getFileName('.html', 'sp');
    if (Util.openFile(htmlSP)) {
      return;
    }

    // 同一ディレクトリの .phtml が存在すれば開く
    let phtml = pinfo.getFileName('.phtml');
    if (Util.openFile(phtml)) {
      return;
    }

    // pc ディレクトリが存在するか調べる
    let dirPC = pinfo.getDirName('pc');
    if (Util.isExistsFile(dirPC)) {
      // 存在したら pc/xxx.html を新規作成
      Util.openFile(htmlPC, true);
      return;
    }

    // sp ディレクトリが存在するか調べる
    let dirSP = pinfo.getDirName('sp');
    if (Util.isExistsFile(dirSP)) {
      // 存在したら sp/xxx.html を新規作成
      Util.openFile(htmlSP, true);
      return;
    }

    // 同一ディレクトリに .phtml を強制作成
    Util.openFile(phtml, true);
    return;
  }

  /**
   * HTML の処理
   * @param pinfo 
   */
  protected html(pinfo: PathInfo) {
    let fn: string;

    // 同一ディレクトリの .ts
    fn = pinfo.getFileName('.ts');
    if (Util.openFile(fn)) {
      return;
    }

    // 同一ディレクトリの .php
    fn = pinfo.getFileName('.php');
    if (Util.openFile(fn)) {
      return;
    }

    // 自身のディレクトリが pc または sp ならば
    let dir = pinfo.info.dir.split('/');
    switch (dir[dir.length - 1]) {
      case 'pc':
      case 'sp': {
        // 親ディレクトリの .php
        fn = pinfo.getFileName('.php', '..');
        if (Util.openFile(fn, true)) {
          return;
        }
      }
    }

    return;
  }
}

export = OpenRelated;