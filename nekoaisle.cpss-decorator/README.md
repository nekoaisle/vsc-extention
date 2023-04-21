# お手軽強調表示

テーマを作ったりと言った面倒なことをせずに秀丸のように手軽に好きなところを強調表示できます。

## 機能

デザイン(vscode.DecorationRenderOptions)と正規表現を .json ファイルに記述することにより自由に強調表示することができます。  
全ファイル共通設定と拡張子ごとの設定を書くことができます。設定ファイルはテキストファイルですので面倒なコンパイルなどは必要ありません。

## コマンド

|コマンド|機能|キーバインド|
|---|---|---|
|nekoaisle.cpssDecoratorRefresh|設定ファイルを再読込します||

## コンフィグ

'cpssDecorator.dataDir': '~/.config/cpssDecorator'

## デザインファイル

<pre
design.json  
design-拡張子.json
{  
  name: vscode.DecorationRenderOptions  
    | デザイン名  
    | [  
      デザイン名  
      | vscode.DecorationRenderOptions  
    ]
}  
</pre>
design.json が読み込まれ、design-拡張子.json によって上書きされます。同じ名前のデザインがの場合はマージされ同じ要素は後から読み込まれたものが優先されます。
<pre>
例:
{
  "blue": {
    "color": "#8888FF"  
  },
  "bg-blue": {
    "backgroundColor": "rgba(0,0,255,0.8)"
  },
  "blue-blue": {
    "blue",
    "bg-blue"
  },
  "blue-blue-ruler": {
    "blue",
    "bg-blue",
    "overviewRulerColor": "rgba(0,0,255,1)",
    "overviewRulerLane": "vscode.OverviewRulerLane.Right"
  },
}
</pre>
* "blue" という名前のデザインは明るい青文字
* "bg-blue" という名前のデザインは背景色が半透明の青
* "blue-blue" という名前のデザインは文字が明るい青で背景色が半透明の青
* "blue-blue-ruler" という名前のデザインは文字が明るい青で背景色が半透明の青でルーラーの右側に青で表示
## 強調表示ファイル

<pre>
highlight.json  
highlight-拡張子.json
[  
  regexp: 強調する部分を特定するための正規表現文字列,
  exclosion: 除外する部分を特定するための正規表現文字列,
  design: vscode.DecorationRenderOptions  
    | デザイン名  
    | [  
      デザイン名  
      | vscode.DecorationRenderOptions  
    ]
]
</pre>
highlight.json が読み込まれ、highlight-拡張子.json が追加されます。デザイン指定は、名前を指定すると曽於の名前のデザインが読み込まれ、vscode.DecorationRenderOptions が指定されるとマージされ同じ要素は後から読み込まれたものが優先されます。

<pre>
例:
[
	{
		"regexp": ",",
    "exposion": "/\\*[\\s\\S]*?\\*/|//.*",
		"design": [
			"magenta",
			{
				"rangeBehavior": "ClosedClosed"
			}
		]
	}	
]
</pre>
/* */ でくくられている部分以外を magenta という名前のデザインで表示、この強調の先頭と終端で編集を行った場合デザインは継承しない。
