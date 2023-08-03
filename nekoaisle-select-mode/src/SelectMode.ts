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
  private disposeableEventHandler: vscode.Disposable | null = null;
	private statusBarItem: vscode.StatusBarItem;

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
      config: 'nekoaisle-select-mode',		// 通常はコマンドのサフィックス
      commands: [
        {
          command: 'nekoaisle-select-mode.toggle',
          callback: () => { this.toggle(); }
        },
        {
          command: 'nekoaisle-select-mode.start',
          callback: () => { this.start(); }
        },
        {
          command: 'nekoaisle-select-mode.end',
          callback: (arg?) => { this.end(arg); }
        }
      ]
    });

    // ステータスバーアイテム作成
		let subscriptions: vscode.Disposable[] = [];
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    subscriptions.push(this.statusBarItem);
    this.statusBarItem.text = this.getConfig<string>("status", "範囲選択中");
    this.disposable = vscode.Disposable.from(...subscriptions);
  }

  /**
   * 廃棄
   */
  public dispose() {
    this.disposable?.dispose();
    this.disposeEventHandler();
  }

  /**
   * 開始/終了
   */
  public toggle() {
    if (!this.on) {
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
    if (!vscode.window.activeTextEditor) {
      return;
    }
    const editor = vscode.window.activeTextEditor;

    if (this.on) {
      // すでに開始しているので一旦終了
      this.end();
    }

    // 開始済みフラグを立てる
    this.on = true;

    // デザインを取得
    this.loadDecoration();

    // 現在のカーソル位置を記憶
    let sel = this.getNowSelection();
    this.selection = new vscode.Selection(sel.anchor, sel.anchor);

    // 範囲選択を解除
    editor.selection = this.selection;

    // イベントハンドラーを設定
    this.setEventHandler();

    // ステータスバーに表示
    this.statusBarItem.show();
  }

  /**
   * 範囲選択終了
   * @param arg 実行するコマンド
   */
  private async end(arg?: string) {
    if (this.on && vscode.window.activeTextEditor) {
      const editor = vscode.window.activeTextEditor;
  
      // 開始済みフラグを下ろす
      this.on = false;

      // 選択範囲を設定
      editor.selections = [];
      editor.selection = this.selection;

      // 前回設定した装飾をクリア
      this.attachedDecoration?.dispose();
      this.attachedDecoration = null;

      // イベントハンドラを開放
      this.disposeEventHandler();

      // ステータスバーから消す
      this.statusBarItem.hide();
    }

    // コマンドが指定されていたら実行
    if (arg) {
      await vscode.commands.executeCommand(arg);
    }
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
   * 装飾の読み込み
   */
  private loadDecoration() {
    // デザインを取得
    let desigh = this.getConfig<any>('decoration', null);
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
  }

  /**
   * カーソル移動イベントの登録
   */
  private setEventHandler() {
    // イベントハンドラを開放
    this.disposeEventHandler();

    //
    let subscriptions: vscode.Disposable[] = [];
    // vscode.window.onDidChangeActiveTextEditor(this.onEvent, this, subscriptions);
    vscode.window.onDidChangeTextEditorSelection(this.onEvent, this, subscriptions);
		// create a combined disposable from both event subscriptions
		this.disposeableEventHandler = vscode.Disposable.from(...subscriptions);
  }

  /**
   * イベントハンドラの開放
   */
  private disposeEventHandler() {
    if (this.disposeableEventHandler) {
      this.disposeableEventHandler.dispose();
      this.disposeableEventHandler = null;
    }
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