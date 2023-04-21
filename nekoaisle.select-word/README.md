# select-word README

|       コマンド       |           機能           |
| -------------------- | ------------------------ |
| nekoaisle.selectWord | カーソル位置の単語を選択 |
| nekoaisle.addCursor  | 矩形選択カーソル追加     |
| nekoaisle.delCursor  | 矩形選択カーソル削除     |

## 機能

### 単語選択

カーソル位置の単語を選択します。  
すでに文字列を選択している場合は、選択範囲を前後に１文字づつ広げます。

### 矩形選択カーソル追加

現在のエディタの最後のカーソルの下にカーソルを追加します。

### 矩形選択カーソル削除

現在のエディタの最後のカーソルを除去します。

## キーボード・ショートカット例
```json
[
	// 単語選択
	{
		"key": "shift+enter",
		"command": "nekoaisle.selectWord",
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
		"command": "nekoaisle.delCursor",
		"when": "editorTextFocus"
	},
	// 矩形選択カーソル削除
	{
		"key": "ctrl+down",
		"command": "nekoaisle.addCursor",
		"when": "editorTextFocus"
	},
]
```
