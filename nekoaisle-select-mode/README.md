# Nekoaisle Select Mode README

範囲選択モード

範囲選択中にも他の編集機能がほぼ全て使えます。

## コマンド
### nekoaisle-select-mode.toggle
範囲選択モードを開始または終了します。

### nekoaisle-select-mode.start
範囲選択モードを開始、すでに開始している場合は一旦終了してから再開します。

### nekoaisle-select-mode.end(arg)
範囲選択モードが開始されている場合は終了します。
その後 arg にて指定されたコマンドを実行します。

## 現在のカーソル位置から "return" という文字列までを選択する場合
1. nekoaisle-select-mode.toggle コマンドを実行して範囲選択モードに入ります。
2. 検索機能で "return" を探しその位置までジャンプします。すると、その範囲の背景が水色になります。
3. nekoaisle-select-mode.toggle コマンドを実行して範囲選択モードを終了すると 2. の範囲が選択状態になります。

## キーバインド
範囲選択モード中に下記のキーを押すと、選択モードを終了してそれぞれのコマンドを実行します。

| キー操作１ | キー操作２     | コマンド                          |
| ---------- | -------------- | --------------------------------- |
| ctrl + c   | ctrl + insert  | editor.action.clipboardCopyAction |
| ctrl + x   | shift + delete | editor.action.clipboardCutAction  |

これらは下記のキーバインドによって実現しています。COPY, CUT を他のキーに割り当てている方はこれらのキーボード割当を変更する必要があります
```json
{
  {
    "key": "ctrl+c",
    "command": "nekoaisle-select-mode.end",
    "args": "editor.action.clipboardCopyAction"
  },{
    "key": "ctrl+x",
    "command": "nekoaisle-select-mode.end",
    "args": "editor.action.clipboardCutAction"
  },{
    "key": "ctrl+insert",
    "command": "nekoaisle-select-mode.end",
    "args": "editor.action.clipboardCopyAction"
  },{
    "key": "shift+delete",
    "command": "nekoaisle-select-mode.end",
    "args": "editor.action.clipboardCutAction"
  }
}
```
## カスタマイズ
### nekoaisle-select-mode.decoration
選択範囲の装飾を指定します。
vscode.DecorationRenderOptions オブジェクトを記述しますが、"rangeBehavior" および "overviewRulerLane" についてはオブジェクトのプロパティであるため文字列でプロパティ名を指定してください。

例: 
```json
{
  "nekoaisle-select-mode.decoration": {
    "backgroundColor": "#00FFFF44",
    "rangeBehavior": "ClosedClosed"
  }
}
```

#### overviewRulerLane
| 指定   |                                 |
| ------ | ------------------------------- |
| Left   | vscode.OverviewRulerLane.Left   |
| Center | vscode.OverviewRulerLane.Center |
| Right  | vscode.OverviewRulerLane.Right  |
| Full   | vscode.OverviewRulerLane.Full   |

#### DecorationRangeBehavior
| 指定         |                                             |
| ------------ | ------------------------------------------- |
| OpenOpen     | vscode.DecorationRangeBehavior.OpenOpen     |
| ClosedClosed | vscode.DecorationRangeBehavior.ClosedClosed |
| OpenClosed   | vscode.DecorationRangeBehavior.OpenClosed   |
| ClosedOpen   | vscode.DecorationRangeBehavior.ClosedOpen   |

### nekoaisle-select-mode.status
範囲選択中にステータスバーに表示するインジケーター文字列を指定します。