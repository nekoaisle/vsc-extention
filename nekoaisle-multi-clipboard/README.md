# nekoaisle-multi-clipbord README

## 機能

0 〜 9 までの 10 個のスロットをもち、テキストをコピー＆ペーストできます。

※名前は clipbord と言っていますが、クリップボードとの連係は一切ありません。

### コピー系の動作
範囲選択している場合はその範囲を、範囲選択されていない場合はカーソル行を対象とします。  

`対象 copy, add, push`

### ペースト系の動作
範囲選択している場合は置換、範囲選択されているない場合は挿入します。

### copy
対象をメニューから選択したスロットにコピーします。

### add
対象をメニューから選択したスロットの末尾に追加します。

### push
対象をメニューから選択したスロットの末尾に追加し、対象を削除します。

### paste
メニューから選択したスロットの内容をすべて貼り付けます。

### pop
メニューから選択したスロットの末尾の行をを貼り付けて削除します。

### fromClipboard
メニューから選択したスロットにクリップボードの内容をコピー

### toClipboard
メニューから選択したスロットの内容をクリップボードにコピー

## コマンド

|                コマンド                |                  機能                  |
| -------------------------------------- | -------------------------------------- |
| nekoaisle.multiClipboard.copy          | 指定スロットにコピー                   |
| nekoaisle.multiClipboard.cut           | 指定スロットにコピーして削除           |
| nekoaisle.multiClipboard.add           | 指定スロットの末尾に追加               |
| nekoaisle.multiClipboard.push          | 指定スロットの末尾に追加して削除       |
| nekoaisle.multiClipboard.paste         | 指定スロットの内容をペースト           |
| nekoaisle.multiClipboard.pop           | 指定スロットの末尾をペーストして削除   |
| nekoaisle.multiClipboard.fromClipboard | 指定スロットへクリップボードをコピー   |
| nekoaisle.multiClipboard.toClipboard   | 指定スロットからクリップボードへコピー |

