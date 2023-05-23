# カーソル移動関連詰め合わせ

| コマンド                        | 機能                                       |
| ------------------------------- | ------------------------------------------ |
| nekoaisle-cursor.selectWord     | カーソル位置の単語を選択                   |
| nekoaisle-cursor.addCursor      | 矩形選択カーソル追加                       |
| nekoaisle-cursor.delCursor      | 矩形選択カーソル削除                       |
| nekoaisle-cursor.gotoLine       | 行番号ジャンプ                             |
| nekoaisle-cursor.markjumpMark   | 現在のカーソル位置をマーク                 |
| nekoaisle-cursor.markjumpJump   | 最後にマークした位置にジャンプ             |
| nekoaisle-cursor.markjumpReturn | 前回のカーソル位置にジャンプ               |
| nekoaisle-cursor.undo           | カーソルをもとの位置に戻す                 |
| nekoaisle-cursor.revealRange    | カーソルが表示される位置にスクロールを調整 |

## 機能

### 単語選択

カーソル位置の単語を選択します。  
すでに文字列を選択している場合は、選択範囲を前後に１文字づつ広げます。

### 矩形選択カーソル追加

現在のエディタの最後のカーソルの下にカーソルを追加します。

### 矩形選択カーソル削除

現在のエディタの最後のカーソルを除去します。

### 行番号ジャンプ
nekoaisle-cursor.gotoLine
指定された行にジャンプします。

行番号の最初の一文字を引数にして呼び出すとテキストボックスを表示して残りの行番号の入力を促しますます。

これは、独自メニューを表示した際にショートカット 1 〜 9 に nekoaisle-cursor.gotoLine('1') 〜 ('9') とすることでキータッチを1回減らすための機能です。

※ 通常 nekoaisle.command-menu とともに使います。

### nekoaisle-cursor.markjumpMark markjumpJump
現在のカーソル位置を記憶しそこにジャンプすることができます。  
また、前回のカーソル位置に戻ることができます。操作を間違えてわけのわからないところにジャンプしてしまった後などに便利だと思います。

マークを複数記憶できるようにしました。ただし、ファイルを閉じるとそのファイルに関するマークは破棄されます。

markjumpMark, markjumpJump は引数にスロット番号を指定することができます。

### nekoaisle-cursor.markjumpReturn
Ver.1.40 にて cursorUndo が実装されたので廃止予定


### nekoaisle-cursor.undo
カーソルをもとの位置に戻す
システムの cursorUndo はスクロール位置の調整をしないため画面外にカーソルが移動するとカーソルが見えなくなってしまうので、 cursorUndo を呼び出したあとに revealRange() しています。
※ cursorUndo が修正されるまでの応急処置です。

### nekoaisle-cursor.revealRange
カーソルが表示される位置にスクロール位置を調整

## キーボード・ショートカット例
```json
[
	// 単語選択
	{
		"key": "shift+enter",
		"command": "nekoaisle-cursor.selectWord",
		"when": "editorTextFocus"
	},
	// マルチ−カーソルを解除
	{
		"key": "ctrl+enter",
		"command": "-editor.action.insertLineAfter",
		"when": "editorTextFocus && !editorReadonly"
	},
	{
		"key": "ctrl+enter",
		"command": "removeSecondaryCursors",
		"when": "editorHasMultipleSelections && editorTextFocus"
	},
	// 矩形選択カーソル追加
	{
		"key": "ctrl+up",
		"command": "nekoaisle-cursor.delCursor",
		"when": "editorTextFocus"
	},
	// 矩形選択カーソル削除
	{
		"key": "ctrl+down",
		"command": "nekoaisle-cursor.addCursor",
		"when": "editorTextFocus"
	},
]
```
