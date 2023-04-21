# nekoaisle-exec README

## Features

指定されたコマンドまたは選択範囲またはカーソル行をシェルコマンドとして実行します。

1. 引数が指定された場合はその引数を実行
2. 文字列が選択されている場合は選択範囲の文字列を実行
3. カーソル位置の行を実行

## command 

nekoaisle.exec

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
