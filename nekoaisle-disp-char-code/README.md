# nekoaisle用 VSCode 拡張機能

## 機能
ステータスバーにカーソル位置の文字コードを表示します。

## 設定
### nekoaisle-disp-char-code.format
表示フォーマットを指定します。

"nekoaisle-disp-char-code.format": "%c %h (%d)"

| 記号 | 表示内容                                 |
| ---- | ---------------------------------------- |
| %c   | カーソル位置の文字                       |
| %d   | カーソル位置の文字コード10進表記         |
| %h   | カーソル位置の文字コード16進表記(小文字) |
| %H   | カーソル位置の文字コード16進表記(大文字) |

※ %c: 制御文字は略号を通常文字は '' でくくって表示します。

### nekoaisle-disp-char-code.charBefore, charAfter
通常文字をくくる文字列を指定します。

"nekoaisle-disp-char-code.charBefore": "'"
"nekoaisle-disp-char-code.charAfter": "'"