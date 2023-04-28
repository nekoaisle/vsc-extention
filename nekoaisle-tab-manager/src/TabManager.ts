// 'use strict';
import * as vscode from 'vscode';
import {Extension, SelectFile, PathInfo, Util} from './nekoaisle.lib/nekoaisle';

interface TabInfo {
  fullPath: string;
  topNo: number;      // ウィンドウトップ行
  lineNo: number;     // 行番号
  lastDate?: string;  // 最終保存日
}

interface TabGroups {
  [key: string]: TabInfo[];
}

/**
 * エクステンション本体
 */
class TabManager extends Extension {

  /**
   * デフォルトの履歴ファイル名を取得
   */
  protected readonly defaultSaveFile: string = '~/Documents/nekoaisle-tab-manager.json';

  // タブ情報
  protected tabGroups: TabGroups = {};
  // undo のためのスロット
  protected undoSlot: TabGroups = {};

  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: 'タブマネージャー',
      config: 'nekoaisle-tab-manager',
      commands: [
        {
          command: 'nekoaisle-tab-manager.openMenu',
          callback: () => { this.openMenu(); }
        },
        {
          command: 'nekoaisle-tab-manager.saveTabGroup',
          callback: () => { this.saveTabGroup(); }
        },
        {
          command: 'nekoaisle-tab-manager.restoreTabGroup',
          callback: () => { this.restoreTabGroup(); }
        },
        {
          command: 'nekoaisle-tab-manager.undoTabGroup',
          callback: () => { this.undoTabGroup(); }
        },
        {
          command: 'nekoaisle-tab-manager.editSaveFile',
          callback: () => { this.editSaveFile(); }
        },
        {
          command: 'nekoaisle-tab-manager.reloadSaveFile',
          callback: () => { this.reloadSaveFile(); }
        },
      ]
    });

    // 保存情報の読み込み
    this.loadTabInfo(true);
  }

  /**
   * タブグループのユニークIDを作成
   */
  public genUniqueTabGroupID(): string {
    // return Util.md5(vscode.window.tabGroups.activeTabGroup.viewColumn);
    return '' + vscode.window.tabGroups.activeTabGroup.viewColumn;
  }

  /**
   * 履歴ファイルのファイル名取得
   * @return ファイル名
   */
  protected getSaveFilename(): string {
    // settings.json より履歴ファイル名を取得
    let fn = this.getConfig('save-file', this.defaultSaveFile);

    // 先頭の ~ を置換
    fn = Util.normalizePath(fn);
    //
    return fn;
  }

  /**
   * 保存されているタブグループ名配列を取得
   */
  public getSvaeSlot(): string[] {
      // 追加はないのでスロット数 0, 1 の特殊処理
      let slots: string[] = [];
      for (let id in this.tabGroups) {
        slots.push(id);
      }
    return slots;
  }

  /**
   * タブ情報の保存
   */
  public saveTabInfo() {
    let fn = this.getSaveFilename();
    // 履歴ファイルの書き込み
    Util.saveFileJson(fn, this.tabGroups);
    if (!this.getConfig('silent', true)) {
      vscode.window.setStatusBarMessage(`タブグループ情報を ${fn} に保存しました。`, 1 * 1000);
    }
  }

  /**
   * タブ情報の読み込み
   * @param silent ファイルが存在しないときにメッセージを出さない
   */
  public loadTabInfo(silent: boolean = false) {
    let fn = this.getSaveFilename();
    // タブ情報ファイルの読み込み
    let slots = Util.loadFileJson(fn, silent);
    if (slots) {
      this.tabGroups = slots;
    }
  }

  /**
   * スロット名を入力
   */
  public async inputSaveSlotName(): Promise<string | undefined> {
    let name: string | undefined;
    let option: vscode.InputBoxOptions = {
      placeHolder: '保存スロット名を入力してください。',
    };
    let prompt: '';
    do {
      // ファイル名を入力
      name = await vscode.window.showInputBox({
        placeHolder: '保存スロット名を入力してください。',
      });
      
      if (!name) {
        return;
      }

      // 重複チェック
      for (let label in this.tabGroups) {
        if (name === label) {
          option.prompt = `${name} はすでに存在しています。`;
          name = undefined;
        }
      }
    } while (!name);

    //
    return name;
  }

  /**
   * ファイルがすでに開かれている際の処理をメニューから選択
   */
  public async getActionAlreadyOpened(filename: string) {
    // メーニューを作成
    let menu: vscode.QuickPickItem[] = [
      { label: 'reopen', description: '閉じて開く' },
      { label: 'ignore', description: 'そのまま'   },
      // { label: 'move'  , description: 'タブを移動' },
    ];

    let options: vscode.QuickPickOptions = {
      placeHolder: `${filename} はすでに開かれています。どうしますか？`,
      matchOnDetail: true,
      matchOnDescription: false
    };

    // メニュー選択
    const pick = await vscode.window.showQuickPick(menu, options);

    //
    if (pick) {
      return pick.label;
    } else {
      return 'ignore';
    }
  }

  /**
   * 現在アクティブなタブグループのファイル情報を取得
   */
  public async getActiveTabGroupFileInfos(): Promise<TabInfo[]> {
    // タブ情報保存配列
    const tabGroup: TabInfo[] = [];

    // 現在のアクティブエディターを記憶
    const lastEditor = vscode.window.activeTextEditor;
    const showOptions = {
      preview: false,
    };

    // 現在のタブグループの全タブを取得
    const tabs = vscode.window.tabGroups.activeTabGroup.tabs;
    for (let tab of tabs) {
      const uri = (<vscode.TabInputText><unknown>tab?.input)?.uri ?? {};
      if (uri.fsPath) {
        const fullPath = uri.fsPath;
        let topNo = 0;
        let lineNo = 0;

        /* 残念ながら非アクティブなエディターのカーソル位置などは
         * await vscode.window.showTextDocument() しても取れないようです。
         */

        // アクティブにしないとカーソル位置などが取れない？
        await vscode.window.showTextDocument(uri, showOptions);
        // このファイルを開いているエディタを探す
        const editors = vscode.window.visibleTextEditors;
        for (let editor of editors) {
          if (editor.document.fileName === fullPath) {
            // カーソル行とスクロール位置を取得
            lineNo = editor.selection.start.line;
            topNo = editor.visibleRanges[0]?.start?.line;
            break;
          }
        }

        // グループにファイル情報を追加
        tabGroup.push({
          fullPath: fullPath,
          topNo: topNo,
          lineNo: lineNo,
        });

        Util.putLog(`${fullPath}: ${lineNo} ${topNo}`);
      }
    }
    if (lastEditor) {
      vscode.window.showTextDocument(lastEditor.document);
    }

    //
    return tabGroup;
  }

  /**
   * タブグループを復元
   */
  public async setActiveTabGroupInfos(tabInfos: TabInfo[]) {
    // 現在のタブグループの全タブを取得
    const tabs = vscode.window.tabGroups.activeTabGroup.tabs;
    // 現在のタブグループのタブを全部閉じる
    vscode.window.tabGroups.close(tabs);

    // 記憶したファイルを開く
    for (let id in tabInfos) {
      const info = tabInfos[id];
      const filename = info.fullPath;
      let open = true;

      // もしファイルが開かれていたら閉じる
      const tab = Util.findTab(filename);
      if (tab) {
        const action = await this.getActionAlreadyOpened(filename);
        switch (action) {
          // 閉じて開く(閉じても何故かundoが効く…)
          case 'reopen': await vscode.window.tabGroups.close(tab); break;
          // そのまま
          case 'ignore': open = false; break;;
          // タブを移動(やり方がわからない…)
          case 'move': {
            break;
          }
        }
        // vscode.window.tabGroups.close(tab);
      }

      // ファイルを開く
      if (open) {
        const doc = await vscode.workspace.openTextDocument(filename);
        // ファイルが開いた
        const editor = await vscode.window.showTextDocument(doc);
        // 表示された
        // // カーソル位置を復元
        // let pos = new vscode.Position(info.lineNo, 0);
        // editor.selection = new vscode.Selection(pos, pos);
      }
    }
  }

  /**
   * タブグループ保存スロットの選択
   */
  public async selectSaveSlot(add: boolean): Promise<string | undefined> {
    // スロット数 0, 1 の特殊処理
    let slots = this.getSvaeSlot();
    if (slots.length === 0) {
      // スロットなし
      if (!add) {
        // 追加はない
        return;
      } else {
        // 新規作成
        return await this.inputSaveSlotName();
      }
    }

    // 詳細表示時にワークスペースフォルダー名を除去するため
    // ワークスペースフォルダー名を取得
    // ※複数ある場合は除去しない
    const folders = vscode.workspace.workspaceFolders;
    let root = '';
    let rootLen = 0;
    if (folders && (folders.length === 1)) {
      root = folders[0].uri.fsPath;
      rootLen = root.length;
    }

    // メニューを作成
    let menu: vscode.QuickPickItem[] = [];
    for (let label in this.tabGroups) {
      // 保存スロット１つ分の処理
      const infos = this.tabGroups[label];
      let dirs: string[] = [];

      // 詳細は内包するファイル名を列挙
      infos.forEach(function (info) {
        // フルパス名をパース
        const pi = new PathInfo(info.fullPath);
        let dir = pi.info.dir + '/';
        // ワークスペースのルートフォルダー名を除去
        if (rootLen) {
          let p = dir.substring(0, rootLen);
          if (p === root) {
            dir = '.' + dir.substring(rootLen);
          }
        }
        dirs.push(`${dir}${pi.info.base}`);
      });
      let desc = dirs.join(', ');

      menu.push({
        label: label,
        // detail: key,
        description: desc,
      });
    }
    // 新規追加
    if (add) {
      menu.push({
        label: 'New slot',
        // detail: key,
        description: '新規作成',
      });
    }

    // メニュー選択
    let options: vscode.QuickPickOptions = {
      placeHolder: '保存するスロットを選択してください。',
      matchOnDetail: false,
      matchOnDescription: false
    };
    let sel = await vscode.window.showQuickPick(menu, options);

    if (!sel) {
      return;
    }

    if (sel.label !== 'New slot') {
      // 既存を選択した
      return sel.label;
    }

    // 新規作成
    return await this.inputSaveSlotName();
  }

  /**
   * メニューからコマンドを選んで実行
   */
  public async openMenu() {
    // メーニューを作成
    let menu: vscode.QuickPickItem[] = [
      { label: 'restoreTabGroup', description: 'タブグループを復元'               },
      { label: 'saveTabGroup'   , description: 'タブグループを記録'               },
      { label: 'undoTabGroup'   , description: 'タブグループを復元前に戻す'       },
      { label: 'editSaveFile'   , description: 'タブグループ保存ファイルを編集'   },
      { label: 'reloadSaveFile' , description: 'タブグループ保存ファイルを再読込' },
    ];

    let options: vscode.QuickPickOptions = {
      placeHolder: '選択してください。',
      matchOnDetail: true,
      matchOnDescription: false
    };

    // メニュー選択
    const pick = await vscode.window.showQuickPick(menu, options);

    //
    if (pick) {
      switch (pick.label) {
        case 'saveTabGroup':    this.saveTabGroup()   ; break;
        case 'restoreTabGroup': this.restoreTabGroup(); break;
        case 'undoTabGroup':    this.undoTabGroup()   ; break;
        case 'editSaveFile':    this.editSaveFile()   ; break;
        case 'reloadSaveFile':  this.reloadSaveFile() ; break;
      }
    }
  }

  /**
   * 現在のエディタグループにて開かれているすべてのファイル名を保存
   */
  public async saveTabGroup() {
    // セーブスロットを選択
    let slot = await this.selectSaveSlot(true);
    if (!slot) {
      return;
    }

    // 現在アクティブなタブグループの情報を記憶
    this.tabGroups[slot] = await this.getActiveTabGroupFileInfos();

    // 保存
    this.saveTabInfo();
  }

  /**
   * 現在のエディタグループに指定スロットのファイルを開く
   * ※現在開かれてるファイルはすべて閉じる
   */
  public async restoreTabGroup() {
    // 保存されているスロットがないときはエラー
    let slots = this.getSvaeSlot();
    if (!slots.length) {
      Util.putMess('タブグループ情報は保存されていません。');
      return;
    }

    // セーブスロットを選択
    let slot = await this.selectSaveSlot(false);
    if (!slot) {
      return;
    }

    // 現在のタブグループのmd5値を取得
    const tabGroupID = this.genUniqueTabGroupID();
    // undo 用に現在のタブグループ情報を保管
    this.undoSlot[tabGroupID] = await this.getActiveTabGroupFileInfos();

    // タブグループの復元
    const tabInfos = this.tabGroups[slot];
    if (tabInfos) {
      this.setActiveTabGroupInfos(tabInfos);
    }

  }

  /**
   * 現在のタブグループを以前の状態に戻す
   */
  public async undoTabGroup() {
    // 現在のタブグループのmd5値を取得
    const tabGroupID = this.genUniqueTabGroupID();
    // undo 用に現在のタブグループ情報を復元
   await this.setActiveTabGroupInfos(this.undoSlot[tabGroupID]);
  }

  /**
   * 保存ファイルを編集
   */
  public async editSaveFile() {
    // 保存ファイル名を取得
    const fn = this.getSaveFilename();

    // 開く
    await Util.openFileSync(fn);
  }

  /**
   * 保存ファイルの再読込
   */
  public reloadSaveFile() {
    this.loadTabInfo(false);
  }
}

export default TabManager;