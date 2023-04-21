# CPSS のログを見やすくする

## 機能
CPSS のログを見やすくする

## 色分け
### 日付
storage.type.function.cpsslog
```js
/^\[\d{2}:\d{2}:\d{2}\]/
```

### SQL
keyword.control.cpsslog
```js
/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|INSERT|INTO|VALUES|UPDATE)\b/
/\b(select|from|where|group by|order by|insert|into|values|update)\b/
```

### ファイル名
comment.block.cpsslog
```js
/¥/var¥/www¥/ragdoll¥/.*?\(\d+\)/
```
