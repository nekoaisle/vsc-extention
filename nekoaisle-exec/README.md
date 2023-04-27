# nekoaisle-exec README

## Features

引数で指定されたコマンドまたは選択範囲またはカーソル行をシェルコマンドとして実行します。

1. 引数が指定された場合はその引数を実行
2. 文字列が選択されている場合は選択範囲の文字列を実行
3. カーソル位置の行を実行

## command 

### nekoaisle.exec
実行のみ

### nekoaisle.execInsert
カーソルを行末に移動して改行文字を挿入後に結果を挿入

## Keyboerd short-cut

ctrl+k ctrl+e でノーチラスを開く例  
${HOME}/.config/Code/User/keybindings.json
```json
[
	{
		"key": "ctrl+k ctrl+e",
		"command": "nekoaisle.exec",
		"args": "nautilus"
	}
]
```
