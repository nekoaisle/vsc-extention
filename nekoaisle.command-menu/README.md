# nekoaisle-command-menu

## 機能

### nekoaisle.commandMenu

任意のコマンドをメニュー表示し選択したコマンドを実行します。

コマンドの選択時、メニューの先頭文字と一致する文字を入力すると即コマンドが実行されますので、nekoaisle.commandMenu を任意のキーに割り当てておくことにより２ストロークキーのような動作をさせることができます。あまり使わない２ストロークキーの最初のキーに割り当てると便利です。

コマンドの選択は、メニュー先頭の1文字を入力した時、または、メニューからコマンドを選択してエンターを押し多彩です。

全角文字を入力した際にも極力対応するようにしましたが不完全です。

### nekoaisle.multiCommand

複数のコマンドを実行する機能です。1キーで複数のアクションさせたいときに使用してください。

コマンド引数の書式
```ts
interface CommandParam {
	command: string;
	args: any[];
}
```

keybindings.json 例: ファイラーにフォーカスを移動し折りたたむ
```json
[
  {
    "key": "ctrl+b",
    "command": "nekoaisle.multiCommand",
    "args": [
      {
        "command": "workbench.files.action.focusFilesExplorer",
        "args": [""]
      },
      {
        "command": "workbench.files.action.collapseExplorerFolders",
        "args": [""]
      },
    ]
  },
]
```

## 設定

```ts
"nekoaisle-commandMenu.menu": [
  {
    label: string;                  // メニューラベル
    description?: string;           // 説明
    detail?: string;                // 詳細
    command?: string;               // コマンド指定
    args?: { [key: string]: any };  // コマンド引数
    languageID?: string | string[]; // ファイルタイプ指定
    hide?: boolean;                 // メニューに表示しない
    }
]
```
### デフォルトの設定

```json
[
  {
    "label": "/",
    "description": "ドキュメントをフォーマット",
    "command": "editor.action.formatDocument"
  },
  {
    "label": "[",
    "description": "対応するタグにジャンプ" ,
    "command": "editor.emmet.action.matchTag",
    "languageID": "html"

  },
  {
    "label": "\\",
    "description": "文字コードを変更",
    "command": "workbench.action.editor.changeEncoding"
  },
  {
    "label": "]",
    "description": "対応するカッコへジャンプ",
    "command": "editor.action.jumpToBracket"
  },
  {
    "label": "C",
    "description": "計算結果をカーソル位置に挿入",
    "command": "nekoaisle.calc"
  },
  {
    "label": "E",
    "description": "変換メニューを開く",
    "command": "nekoaisle.encode"
  },
  {
    "label": "F",
    "description": "検索してファイルを開く",
    "command": "nekoaisle.findOpen"
  },
  {
    "label": "H",
    "description": "過去に開いことのあるファイルを開く",
    "command": "nekoaisle.openHist"
  },
  {
    "label": "I",
    "description": "定型文を挿入",
    "command": "nekoaisle.insertCode"
  },
  {
    "label": "K",
    "description": "関連ファイルを開く",
    "command": "nekoaisle.openRelated"
  },
  {
    "label": "L",
    "description": "ファイルを挿入",
    "command": "nekoaisle.insertFile"
  },
  {
    "label": "O",
    "description": "ファイル選択ダイアログ",
    "command": "workbench.action.files.openFile"
  },
  {
    "label": "O",
    "description": "ファイルを開く",
    "command": "nekoaisle.openFile"
  },
  {
    "label": "P",
    "description": "CPSS ウィザード",
    "command": "nekoaisle.cpssWizard"
  },
  {
    "label": "Q",
    "description": "現在のエディタを閉じる",
    "command": "workbench.action.closeActiveEditor"
  },
  {
    "label": "R",
    "description": "直前のカーソル位置にジャンプ",
    "command": "nekoaisle.markjumpReturn"
  },
  {
    "label": "S",
    "description": "行ソート",
    "command": "editor.action.sortLinesAscending"
  },
  {
    "label": "T",
    "description": "タグジャンプ",
    "command": "nekoaisle.openTag"
  },
  {
    "label": "W",
    "description": "一時ファイルを開く",
    "command": "nekoaisle.openTemp"
  },
  {
    "label": "X",
    "description": "ファイラーを開く",
    "command": "nekoaisle.openFiler"
  },
  {
    "label": "1〜9",
    "description": "行ジャンプ"
  },
  {
    "label": "1",
    "description": "行ジャンプ",
    "command": "nekoaisle.jumpToLineNumber",
    "args" : { "default": "1" },
    "hide": true
  },
  {
    "label": "2",
    "description": "行ジャンプ",
    "command": "nekoaisle.jumpToLineNumber",
    "args" : { "default": "2" },
    "hide": true
  },
  {
    "label": "3",
    "description": "行ジャンプ",
    "command": "nekoaisle.jumpToLineNumber",
    "args" : { "default": "3" },
    "hide": true
  },
  {
    "label": "4",
    "description": "行ジャンプ",
    "command": "nekoaisle.jumpToLineNumber",
    "args" : { "default": "4" },
    "hide": true
  },
  {
    "label": "5",
    "description": "行ジャンプ",
    "command": "nekoaisle.jumpToLineNumber",
    "args" : { "default": "5" },
    "hide": true
  },
  {
    "label": "6",
    "description": "行ジャンプ",
    "command": "nekoaisle.jumpToLineNumber",
    "args" : { "default": "6" },
    "hide": true
  },
  {
    "label": "7",
    "description": "行ジャンプ",
    "command": "nekoaisle.jumpToLineNumber",
    "args" : { "default": "7" },
    "hide": true
  },
  {
    "label": "8",
    "description": "行ジャンプ",
    "command": "nekoaisle.jumpToLineNumber",
    "args" : { "default": "8" },
    "hide": true
  },
  {
    "label": "9",
    "description": "行ジャンプ",
    "command": "nekoaisle.jumpToLineNumber",
    "args" : { "default": "9" },
    "hide": true
  }
]
```
