# CPSS のログを見やすくする

## 機能
CPSS のログを見やすくする

## 色分け
### ヘッダー(日時)
markup.heading.1.cpsslog
```js
/^\[\d{2}:\d{2}:\d{2}\]/
```

### SQL Keywords
keyword.control.cpsslog
```js
/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|INSERT|INTO|VALUES|UPDATE)\b/
/\b(select|from|where|group by|order by|insert|into|values|update)\b/
```

### タグジャンプ用ファイル名
comment.block.cpsslog
```js
/¥/var¥/www¥/ragdoll¥/.*?\(\d+\)/
```

### 所要時間等
entity.name.type.cpsslog
```js
/^.*所要時間:.*msec$/
```

### IPアドレス
constant.character.cpsslog
```js
/[1-9][0-9]{0,2}\\.[1-9][0-9]{0,2}\\.[1-9][0-9]{0,2}\\.[1-9][0-9]{0,2}/
```

### DB格納日時
constant.numeric.cpsslog
```js
/[12][0-9]{3}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([01][0-9]|2[0-3])[0-5][0-9][0-5][0-9]/
```

### リダイレクト先
invalid.illegal.cpsslog
```js
/^PageRedirect -> .*$/
```

### Record not found.
invalid.illegal.cpsslog",
```js
/^Record not found./
```

### HTTP情報 サブタイトル
markup.italic
```js
/^--- .* [-]+$/
```

### 命名規則
[公式ページ](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
[TextMate 文法](https://macromates.com/manual/en/language_grammars)

## todo

折りたたみ設定が何故かうまくゆかない

"foldingStartMarker": "^[([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\\])",
