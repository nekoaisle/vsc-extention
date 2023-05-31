'use strict';
import * as vscode from 'vscode';
import { Util, Extension } from './nekoaisle.lib/nekoaisle';

/**
 * ファイルごとの情報
 */
interface Mark {
  pos: vscode.Position,
  deco?: vscode.TextEditorDecorationType,
}
  
class FileData {
  // 前回カーソル位置
  public last?: vscode.Position;
  // 現在のカーソル位置
  public cursor?: vscode.Position;
  // マーク
  public marks: Mark[] = [];

  /**
   * すでに存在しているか調べる
   * @param pos 
   * @return true:存在する
   */
  public isExists(pos: vscode.Position): boolean {
    for (let key in this.marks) {
      let mark = this.marks[key];
      if (mark.pos.isEqual(pos)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 指定スロットにマークを設定
   * @param slot スロット番号
   * @param pos 座標
   */
  public setMark(slot: number, pos: vscode.Position) {
    // マークを取得
    let mark: Mark;
    if (!this.marks[slot]) {
      // 新規なら作成
      mark = {pos: pos};
      this.marks[slot] = mark;
    } else {
      // マークを変更
      mark = this.marks[slot];
      mark.pos = pos;
      // 既存の修飾をクリア
      if (mark.deco) {
        mark.deco.dispose();
        mark.deco = undefined;
      }
    }

    // 修飾を設定
    // レンジを作成
    let ranges = [new vscode.Range(mark.pos, mark.pos)];
    // 装飾を設定
    mark.deco = Util.setRuler(ranges, 'blue', 'Left');
  }

  /**
   * 指定スロットのマーク位置を取得
   * @param slot スロット番号
   */
  public getMark(slot: number): vscode.Position {
    return this.marks[slot].pos;
  }
}

class MarkJump extends Extension {
  protected disposable: vscode.Disposable;
  // ファイル名ごとのマークした位置
  protected fileDatas: { [key: string]: FileData } = {};

  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: 'Nekoaisle Cursor Mark jump',
      config: 'nekoaisle-cursor.markjump',
      commands: [
        // マークジャンプメニューを表示
        {
          command: 'nekoaisle-cursor.markjumpMenu',
          callback: () => { this.menu(); }
        },
        // カーソル位置を記憶
        {
          command: 'nekoaisle-cursor.markjumpMark',
          callback: (slot?: number) => { this.markCursor(slot); }
        },
        // 記憶した位置にジャンプ
        {
          command: 'nekoaisle-cursor.markjumpJump',
          callback: (slot?: number) => { this.jumpMark(slot); }
        },
        // 前回のカーソル位置に戻る
        {
          command: 'nekoaisle-cursor.markjumpReturn',
          callback: () => { this.jumpLast(); }
        }
      ]
    });

    // イベントハンドラーを登録
    let subscriptions: vscode.Disposable[] = [];
    vscode.window.onDidChangeTextEditorSelection(this.onChangeSelection, this, subscriptions);

    vscode.workspace.onDidCloseTextDocument((doc: vscode.TextDocument) => {
      let filename = doc.fileName;
      delete this.fileDatas[filename];
    });

    // create a combined disposable from both event subscriptions
    this.disposable = vscode.Disposable.from(...subscriptions);

    // このファイルのデータを取得
    if (vscode.window.activeTextEditor) {
      let fileData = this.getData();
      // 現在のカーソル位置を記憶
      fileData.cursor = this.getCsrPos();
    }
  }

  /**
   * ジャンプを記録する閾値(行数)
   */
  public getJumpThreshold() {
    // settings.json より閾値を取得
    return this.getConfig('jump-threshold', 10);
  }

  /**
   * 現在のカーソル位置を取得
   * @return 現在のカーソル位置
   */
  protected getCsrPos(): vscode.Position{
    if (!vscode.window.activeTextEditor) {
      // ここには来ない
      return new vscode.Position(0, 0);
    }

    let pos = vscode.window.activeTextEditor.selection.anchor;
    return new vscode.Position(pos.line, pos.character);
  }
  /**
   * 指定位置にジャンプ
   * @param pos ジャンプする位置
   */
  protected setCsrPos(pos: vscode.Position) {
    if (!vscode.window.activeTextEditor) {
      return;
    }

    let range = new vscode.Range(pos, pos);
    vscode.window.activeTextEditor.selection = new vscode.Selection(pos, pos);
    vscode.window.activeTextEditor.revealRange(range);
    console.log(`jump = ${pos.character}, ${pos.line}`);
  }

  /**
   * 現在アクティブなエディターに関するデータを取得
   */
  protected getData(): FileData{
    if (!vscode.window.activeTextEditor) {
      // ここには来ない
      return new FileData();
    }

    // 現在アクティブなエディタのファイル名を取得
    let filename = vscode.window.activeTextEditor.document.fileName;

    // まだデータオブジェクトが構築されていなければ作成
    if (!this.fileDatas[filename]) {
      this.fileDatas[filename] = new FileData();
    }
    return this.fileDatas[filename];
  }

  /**
   * マークジャンプメニューを表示
   */
  protected async menu() {
    // メーニューを作成
    let menu: vscode.QuickPickItem[] = [
      { label: 'm カーソル位置をマーク' },
      { label: 'j マークした位置へカーソルを移動' },
      { label: 'r カーソルをもとの位置に戻す' },
    ];

    let options: vscode.QuickPickOptions = {
      placeHolder: '選択してください。',
      matchOnDetail: true,
      matchOnDescription: false
    };

		// QuickPick オブジェクトを作成
		const quickPick = vscode.window.createQuickPick();
		quickPick.items = menu;
		quickPick.placeholder = '選択してください。';
		quickPick.matchOnDetail = false;
		quickPick.matchOnDescription = false;

		/**
		 * 入力文字列が変更された処理設定
		 * ※1文字入力したら実行
		 */
		quickPick.onDidChangeValue((value: string) => {
      switch (value.substring(0, 1)) {
        case 'm': {
          this.markCursor();
          break;
        }
        case 'j': {
          this.jumpMark();
          break;
        }
        case 'r': {
          return this.jumpLast();
          break;
        }
      }

      // 実行したのでクイックピックを閉じる
      quickPick.hide();
		});

		/**
		 * エンターを押した処理設定
		 */
		quickPick.onDidAccept(() => {
			let picks = quickPick.selectedItems;
			if (picks.length === 1) {
				let pick = picks[0];
				if (pick) {
					// 選択しているので実行
          switch (pick.label.substring(0, 1)) {
            case 'm': {
              this.markCursor();
              break;
            }
            case 'j': {
              this.jumpMark();
              break;
            }
            case 'r': {
              this.jumpLast();
              break;
            }
          }
        }
			}
			// エンター押した場合は必ず閉じる
			quickPick.hide();
		});

		// 非表示にしたら破棄設定
		quickPick.onDidHide(() => quickPick.dispose());

		// 開く
		quickPick.show();
  }

  /**
   * カーソル位置を記憶
   * @param slot 記憶スロット番号
   * @returns 
   */ 
  protected async markCursor(slot?: number) {
    if (!vscode.window.activeTextEditor) {
      return;
    }

    // 現在のカーソル位置を取得
    let pos = this.getCsrPos();

    // このファイルのデータを取得
    let fileData = this.getData();

    // スロットを選択
    if (typeof (slot) === 'undefined') {
      if (fileData.marks.length === 0) {
        // 現在スロットがないので0強制
        slot = 0;
      } else if (fileData.isExists(pos)) {
        // すでにマークされているので何もしない
        return;
      } else {
        // スロットを選択
        let item = await this.selectSlot(fileData, true);
        if (!item) {
          // 選択されなかった
          return;
        }
        slot = parseInt(item.label) - 1;
      }
    }

    // 現在位置を記憶
    fileData.setMark(slot, pos);
  }

  /**
   * カーソル位置にジャンプ
   */
  protected async jumpMark(slot?: number) {
    // このファイルのデータを取得
    let fileData = this.getData();

    // スロットを選択
    if (typeof (slot) === 'undefined') {
      // スロットが指定されていないので選択
      switch (fileData.marks.length) {
        case 0: {
          // マークされていないので終了
          return;
        }
        case 1: {
          // １つしかないので0強制
          slot = 0;
          break;
        }
        default: {
          // ダイアログを開いて選択
          let item = await this.selectSlot(fileData, false);
          if (!item) {
            return;
          }
          slot = parseInt(item.label) - 1;
        }
      }
    }

    // マークした位置を取得
    let pos = fileData.getMark(slot);
    // 同じ位置へはジャンプしない
    let cur = this.getCsrPos();
    if (!cur.isEqual(pos)) {
      // ジャンプ前の位置を記憶
      fileData.last = cur;
      // 記憶していた位置にジャンプ
      this.setCsrPos(pos);
    }
  }

  // 最後にジャンプした位置に戻る
  protected jumpLast() {
    // このファイルのデータを取得
    let fileData = this.getData();
    if (fileData.last) {
      // 最後にジャンプした位置にジャンプ
      this.setCsrPos(fileData.last);
    }
  }

  /**
   * 選択範囲変更イベントハンドラ
   * @param e イベント情報
   */
  protected onChangeSelection(e: vscode.TextEditorSelectionChangeEvent) {
    // 現在のカーソル位置を取得
    let cur = e.selections[0].active;
    
    // このファイルのデータを取得
    let fileData = this.getData();
    if (fileData.cursor) {
      // 移動行数を取得
      const delta = Math.abs(fileData.cursor.line - cur.line);
      const threshold = this.getJumpThreshold();
      if (delta >= threshold) {
        // 行が移動したので前回位置として記憶
        fileData.last = fileData.cursor;
      }
    }
    fileData.cursor = cur;
  }

  /**
   * 処分
   */
  public dispose() {
    this.disposable.dispose();
  }

  /**
   * スロットを選択
   * 
   * label にスロット番号+1 を返します。
   * 
   * @param fileData このファイル用のデータ
   * @param addNew メニューの末尾に追加を表示
   */
  public async selectSlot(fileData: FileData, addNew: boolean): Promise<vscode.QuickPickItem | undefined> {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // メーニューを作成
    let menu: vscode.QuickPickItem[] = [];
    let key: any;
    for (key in fileData.marks) {
      key = parseInt(key);  // 文字列を数値に変換
      let line = fileData.marks[key].pos.line;
      let text = editor.document.lineAt(line).text;
      menu.push({
        label: (key + 1).toString(),        // １から始まる数字
        description: `${line+1}: ${text}`,  // 行番号: 行の内容
      });
    }
    // 新規作成
    menu.push({
      label: (key + 2).toString(),
      description: '追加',
    });

    let options: vscode.QuickPickOptions = {
      placeHolder: '選択してください。',
      matchOnDetail: true,
      matchOnDescription: false
    };
    return vscode.window.showQuickPick(menu, options);
  }
}

export default MarkJump;