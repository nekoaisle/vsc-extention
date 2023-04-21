## nekoaisle.encode の機能

### 選択範囲またはカーソル位置の単語の内容を変換します。
1. 大文字に変換
1. 小文字に変換
1. スネークケースをキャメルケースに変換
1. キャメルケースをスネークケースに変換
1. 文字をASCIIコードに変換
1. 式を評価

### 選択範囲またはカーソル位置の単語を各種エンコード/デコードします。
1. HTML encode
1. URL encode
1. Base64 encode
1. C言語文字列 エスケープシーケンス
1. 正規表現構文の特殊文字の前にバックスラッシュを挿入
1. " 括り文字列内の " および \
1. ' 括り文字列内の ' および \
1. UNIXTIME/日時文字列
1. 改行文字を <br />
1. 10進数/16進数
1. 10進数/2進数

### 単語または選択範囲を下記の文字で括る/外す
1. ""
1. ''
1. ``
1. <>
1. ()
1. []
1. {}
1. {{}}
1. &lt;!-- -->
1. /* */
1. &lt;div class=""&gt;&lt;/div&gt;

範囲選択されている場合は、まず、選択範囲の文字列が指定文字括りか調べ括られていたら外します。  
括られていない場合は選択範囲の外側に括り文字があるかを調べ括られていたら外します。  
上記いずれでもない場合は括ります。

## 使い方
エンコード/デコードしたい文字列を選択しキーボードショートカットまたはコマンドパレットから下記コマンドを実行します。    

## コマンドおよびキーマップ
|                 コマンド                  |                 機能                 |
| ----------------------------------------- | ------------------------------------ |
| nekoaisle.encode                          | メニューを開く                       |
| nekoaisle.enclose                         | 引数で指定された任意の文字列でくくる |
| nekoaisle.toUpperCase                     | 大文字に変換                         |
| nekoaisle.toLowerCase                     | 小文字に変換                         |
| nekoaisle.encodeSnake                     | スネークケースをキャメルケースに変換 |
| nekoaisle.encodeCamel                     | キャメルケースをスネークケースに変換 |
| nekoaisle.encodeASCII                     | 文字をASCIIコードに変換              |
| nekoaisle.encodeEval                      | 式を評価                             |
| nekoaisle.encodeHtml                      | HTML エンコード                      |
| nekoaisle.encodeUrl                       | URL エンコード                       |
| nekoaisle.encodeBase64                    | BASE64 エンコード                    |
| nekoaisle.encodeCString                   | C言語文字列 エンコード               |
| nekoaisle.encodePreg                      | 正規表現 エンコード                  |
| nekoaisle.encodeContentsOfSingleQuotation | ' を \' に変換                       |
| nekoaisle.encodeContentsOfDoubleQuotation | " を \" に変換                       |
| nekoaisle.encodeContentsOfUnixtime        | 日時文字列をUNIXTIMEに変換           |
| nekoaisle.encodeBr                        | \n を <br />\n に変換                |
| nekoaisle.encodeHex                       | 10進数を16進数に変換                 |
| nekoaisle.encodeBit                       | 10進数を2進数に変換                  |
| nekoaisle.encodeEval                      | 式を評価                             |
| nekoaisle.decodeHtml                      | HTML デコード                        |
| nekoaisle.decodeUrl                       | URL デコード                         |
| nekoaisle.decodeBase64                    | BASE64 デコード                      |
| nekoaisle.decodeCString                   | C言語文字列 デコード                 |
| nekoaisle.decodePreg                      | 正規表現 デコード                    |
| nekoaisle.decodeContentsOfSingleQuotation | \' を ' に変換                       |
| nekoaisle.decodeContentsOfDoubleQuotation | \" を " に変換                       |
| nekoaisle.decodeContentsOfUnixtime        | UNIXTIMEを日時文字列に変換           |
| nekoaisle.decodeBr                        | <br /> を \n に変換                  |
| nekoaisle.decodeHex                       | 16進数を10進数に変換                 |
| nekoaisle.decodeBin                       | 2進数を10進数に変換                  |
| nekoaisle.encloseInSingleQuotation        | '' で括る/外す                       |
| nekoaisle.encloseInDoubleQuotation        | "" で括る/外す                       |
| nekoaisle.encloseInGraveAccen             | `` で括る/外す                       |
| nekoaisle.encloseParenthesis              | () 括る/外す                         |
| nekoaisle.encloseSquareBracket            | [] 括る/外す                         |
| nekoaisle.encloseAngleBracket             | <> 括る/外す                         |
| nekoaisle.encloseCurlyBracket             | {} 括る/外す                         |
| nekoaisle.encloseDoubleCurlyBracket       | {{}} 括る/外す                       |
| nekoaisle.encloseCComment                 | /**/ 括る/外す                       |
| nekoaisle.encloseHtmlComment              | <!-- --> 括る/外す                   |
| nekoaisle.encloseHtmlDiv                  | <div class=""></div> 括る/外す       |

## nekoaisle.enclose
キー割当することで任意の文字列で括ることができます。
ctrl+k ctrl+e で '<span>', '</span>' で括る
${HOME}/.config/Code/User/keybindings.json
```json
[
	{
		"key": "ctrl+k ctrl+e",
		"command": "nekoaisle.enclose",
		"args": {"start": "<span>", "end": "</span>"}
	}
]
```

## encodeEval について

- expr-eval を使用しています。
- 範囲選択されていない時はカーソル付近の式を処理します。また、カーソルの直前に = がある時は、= の前の式を処理します。

## 問題点

### カーソル位置がくくる文字だった場合の処理ができていない＞＜；  
例: 'abcd' の 先頭の ' にカーソルがある場合正しく動作しない。

### 非選択時の式評価に関数が対応していない