'use strict';
import * as vscode from 'vscode';
import {Util, Extension} from './nekoaisle.lib/nekoaisle';

/**
 * エクステンション本体
 */
class SelectMode extends Extension {
  /**
   * 選択モードがオンになっているフラグ
   */
  private on: boolean = false;

  private selection: vscode.Selection = new vscode.Selection(0, 0, 0, 0);

  private disposable: vscode.Disposable | null = null;

  /**
   * 選択範囲の色
   */
  private design: vscode.DecorationRenderOptions = {
    backgroundColor: "#00FFFF44",
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
  };

  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: 'nekoaisle-select-mode',
      config: '',		// 通常はコマンドのサフィックス
      commands: [
        {
          command: 'nekoaisle-select-mode.toggle',	// コマンド
          callback: () => {
            this.toggle();
          }
        }
      ]
    });
  }

  /**
   * 廃棄
   */
  public dispose() {
    if (this.disposable) {
      this.disposable.dispose();
      this.disposable = null;
    }
  }

  /**
   * 開始/終了
   */
  public toggle() {
    this.on = !this.on;

    if (this.on) {
      // 開始
      this.start();
    } else {
      this.end();
    }
  }

  /**
   * 範囲選択開始
   */
  private start() {
      // デザインを取得
      let desigh = this.getConfig<any>('backgroundcolor', null);
      if (desigh) {
        for (let key in desigh) {
          switch (key) {
            case 'overviewRulerLane': {
              desigh[key] = Util.strToOverviewRulerLane(desigh[key]);
              break;
            }
            case 'rangeBehavior': {
              desigh[key] = Util.strToDecorationRangeBehavior(desigh[key]);
              break;
            }
          }
        }
        this.design = desigh;
      }

    // 現在のカーソル位置を記憶
      let sel = this.getNowSelection();
      this.selection = new vscode.Selection(sel.anchor, sel.anchor);

      // 範囲選択を解除
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.selection = this.selection;
      }

      // イベントハンドラーを設定
      this.setEventHandler();
  }

  /**
   * 範囲選択終了
   */
  private end() {
    if (!vscode.window.activeTextEditor) {
      return;
    }
    const editor: vscode.TextEditor = vscode.window.activeTextEditor;

    // 選択範囲を設定
    editor.selections = [];
    editor.selection = this.selection;

    // 前回設定した装飾をクリア
    this.attachedDecoration?.dispose();
    this.attachedDecoration = null;

    // イベントハンドラを開放
      this.dispose();
  }

  /**
   * 設定した装飾
   */
  private attachedDecoration: vscode.TextEditorDecorationType | null = null;

  /**
   * カーソル移動イベントハンドラー
   */
  public onEvent(event: vscode.TextEditorSelectionChangeEvent) {
    if (!vscode.window.activeTextEditor) {
      return;
    }
    const editor: vscode.TextEditor = vscode.window.activeTextEditor;

    // 前回設定した装飾をクリア
    this.attachedDecoration?.dispose();

    // 選択範囲の末尾を変更
    let start = this.selection.anchor;
    let end = event.selections[0].active;
    this.selection = new vscode.Selection(start, end);

    // 選択範囲を装飾
    let range = new vscode.Range(this.selection.start, this.selection.end);
    let deco = vscode.window.createTextEditorDecorationType(this.design);
    editor.setDecorations(deco, [range]);

    // 今回設定した装飾を記憶
    this.attachedDecoration = deco;
  }

  /**
   * カーソル移動イベントの登録
   */
  private setEventHandler() {
    // イベントハンドラを開放
    this.dispose();

    // 
    let subscriptions: vscode.Disposable[] = [];
    // vscode.window.onDidChangeActiveTextEditor(this.onEvent, this, subscriptions);
    vscode.window.onDidChangeTextEditorSelection(this.onEvent, this, subscriptions);
		// create a combined disposable from both event subscriptions
		this.disposable = vscode.Disposable.from(...subscriptions);

  }

  /**
   * 現在の選択範囲を取得
   */
  private getNowSelection(): vscode.Selection {
    let editor = vscode.window.activeTextEditor;
    let sel;
    if (editor) {
      sel = editor.selection;
    } else {
      sel = new vscode.Selection(0, 0, 0, 0);
    }
    return sel;
  }
}

export default SelectMode;