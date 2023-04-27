# nekoaisle用 VSCode 拡張機能

## 機能
ステータスバーにカーソル位置の文字コードを表示します。

## 設定
settings.json にて表示フォーマットを変更できます。

"nekoaisle-disp-char-code.format": "%c %h (%d)"

| 記号 | 表示内容                         |
|------|----------------------------------|
| %c   | カーソル位置の文字               |
| %n   | カーソル位置の文字コード10進表記 |
| %h   | カーソル位置の文字コード16進表記 |