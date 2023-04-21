# open-help
F1 キーを押すとカーソル位置の単語に関するページを表示します。

## 設定
デフォルトでは拡張機能が格納されているフォルダー直下の `openHelp.json` にしたがって動作します。  
ユーザーが好みの動作をさせる場合はこのファイルを編集するかカスタマイズしたファイルの名前を settings.json に記述します。

### 設定ファイル
```json
"typescript": {
    "method": "chrome", 
    "path": "https://developer.mozilla.org/ja/search",
    "options": {
        "locale": "ja",
        "q": "{{word}}"
    }
},
```
### method
現在のところ "chrome" のみサポートします。

### path
開く URL です。

### options
URL の query 部を表す連想配列です。

## 設定
`openHelp.list-file:` 拡張仕事の設定を記述したファイル名 

例：
```json
"openHelp.list-file": "~/Document/vsc/openHelp.json"
```
