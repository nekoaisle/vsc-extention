# insert-code README

現在の状態やユーザー作成のテンプレートをメニューから選択してカーソル位置に挿入します。  
テンプレート内にキーワードを入れることにより、現在の日時やファイル名、クリップボードの中身、選択範囲などと置き換えることができます。

---
## 使い方

### 直接起動
キー割り当てファイル(keybindings.json)に、"command": "nekoaisle.insertCode.cmd", "args": "コマンド" を記載してカーソル位置に挿入します。

ex.  
編集中のファイルのベース名をカーソル位置に挿入  
```json
{"key": "ctrl+l","command": "nekoaisle.insertCode.cmd", "args": "pinfo.base" }, "when": "editorTextFocus && !editorReadonly"},
```

### メニューから選択
nekoaisle.insertCode を実行するとメニューが開きます。

任意のディレクトリに拡張子ごとのメニュー及びテンプレートを格納し、一覧の中から挿入したい項目を選択します。

---
## コマンド
|  コマンド  |                機能                |              設定              |
| ---------- | ---------------------------------- | ------------------------------ |
| author     | 著者                               | nekoaisle-insertCode.author    |
| copyright  | 著者権所有者                       | nekoaisle-insertCode.copyright |
| selection  | 選択範囲                           |                                |
| clipboard  | クリップボード                     |                                |
| now.year   | 年                                 |                                |
| now.month  | 月                                 |                                |
| now.date   | 日                                 |                                |
| now.hour   | 時                                 |                                |
| now.min    | 分                                 |                                |
| now.sec    | 秒                                 |                                |
| now.ymdhis | 年-月-日 時:分:秒                  |                                |
| now.ymd    | 年-月-日                           |                                |
| now.his    | 時:分:秒                           |                                |
| pinfo.path | フルパス名                         |                                |
| pinfo.dir  | ディレクトリ名                     |                                |
| pinfo.base | ファイル名+拡張子                  |                                |
| pinfo.name | ファイル名                         |                                |
| pinfo.ext  | 拡張子                             |                                |
| class.base | CPSS Baseクラス名                  |                                |
| class.cpp  | C++クラス名                        |                                |
| class.sql  | SQL テーブル名                     |                                |
| ls         | 編集中のファイルのディレクトリ一覧 |                                |
| ls.p       | フルパス                           |                                |
| ls.d       | ディレクトリ名                     |                                |
| ls.b       | ベース名                           |                                |
| ls.f       | 名前                               |                                |
| ls.e       | 拡張子                             |                                |

`ls.*コマンドは編集中のファイルのディレクトリーの一覧を取得します。`

---
### 共通のメニュー
すべてのファイルに適用する共通メニュのファイル名は「list.json」です。

### 拡張子ごとのメニュー
拡張子ごとに違うメニューを表示します。メニューのファイル名は「list-`拡張子`.json」です。

1. 拡張子ごとにメニュー情報を記述した json ファイルを作成します。  
2. 作成したファイルをこの拡張機能が格納されているディレクトリ直下の templates ディレクトリまたは settings.json の insertCode.tempDir に指定したディレクトリ直下に配置します。

```json
{
    "[名前]": {
        "label":       "ラベル",
        "detail":      "詳細",
        "description": "説明文",
        "filename":    "テンプレートファイル名",
        "command":     "コマンド指定",
        "inline":      "インラインテンプレート",
        "position":    "挿入位置",
        "method":      "呼び出すeditメソッド",
    }
}
```

filename, command, inline はいずれか1つを指定します。複数指定した場合は filename, command, inline の優先順位で1つだけ実行されます。

#### 名前
現在特に使用していませんのでユニークであれば何でも構いません。

#### ラベル
メニュー選択する際の一覧に表示されるラベルです。キー入力によるフィルタリングの対象となります。

#### 詳細
メニューのラベルの右に表示される文字列です。キー入力によるフィルタリングの対象となります。

#### 説明文
メニューのラベルの下に表示される文字列です。

#### テンプレートファイル名
指定されたファイルを読み込みその内容をテンプレートとして挿入します。

#### コマンド
指定されたコマンドを実行します。


#### インラインテンプレート
ここに記述されている文字列をテンプレートとして挿入します。

#### 挿入位置

|    挿入位置    |          キーワード           |
| -------------- | ----------------------------- |
| ファイルの先頭 | top, file-start, file-top     |
| ファイルの末尾 | bottom, file-end, file-bottom |
| 行頭           | home, line-start, line-top    |
| 行末           | end, line-end, line-bottom    |
| 次の行         | new, line-new, new-line       |

#### メソッド
挿入方法を選択します。
| メソッド |            説明            |
| -------- | -------------------------- |
| insert   | カーソル位置に挿入します   |
| replace  | 選択範囲を置き換えます     |
| snippet  | スニペットとして挿入します |

※省略時は insert

---
### テンプレート
カーソル位置に挿入する文字列。ファイルまたはインラインで指定します。  
テンプレート内の特定のキーワードは動的に置換します。

#### 置換キーワード
置換キーワードは、上記の「コマンド」を {{}} で括ったものとなります。

例: `{{author}}`

また、上記のキーワードを ' または " で括ると置換する文字列中の \ や ' をクオートします。

#### "method": "snippet"
メソッドに snippet を選択すると $1 や ${1:プレースホルダ} と言ったプレースホルダ機能に加え、下記の変数も使えます。

|      変数名       |                    置換内容                    |
| ----------------- | ---------------------------------------------- |
| $TM_SELECTED_TEXT | 現在選択されたテキストや空の文字列             |
| $TM_CURRENT_LINE  | 現在の行の内容                                 |
| $TM_CURRENT_WORD  | カーソルの下の単語の内容、あるいは、空の文字列 |
| $TM_LINE_INDEX    | ゼロ・インデックスに基づく行番号               |
| $TM_LINE_NUMBER   | 1つのインデックスに基づく行番号                |
| $TM_FILENAME      | 現在のドキュメントのファイル名                 |
| $TM_DIRECTORY     | 現在のドキュメントのディレクトリ               |
| $TM_FILEPATH      | 現在のドキュメントの完全なファイルパス         |

$ をそのまま入力したい場合は \$ としてください。

#### 不要行の削除
言語によっては先頭や末尾に特別な記述がないと構文表示を行えないことがあります。例えば PHP の場合 &lt;?php がないと PHPコードとして扱ってくれませんし ?&gt; がないと構文エラーとなってしまいます。テンプレートはそのまま実行するものではありませんが、記述する際に書きにくいので、挿入する際にこれらを削除する機能をつけました。

下記のキーワードが含まれる行を削除します。

`nekoaisle.insert-code delete line`

例:
```php
<?php /* nekoaisle.insert-code delete line */  
echo print_r({{clipbord}}, true), "\n";  
/* nekoaisle.insert-code delete line */ ?>
```
↓
```php
echo print_r({{clipbord}}, true), "\n";  
```

---
## 設定

* `nekoaisle-insertCode.author: string` 著者名
* `nekoaisle-insertCode.copyright: string` 著作権所有者
* `nekoaisle-insertCode.tempDir: string` メニュー及びテンプレート格納ディレクトリ
* `nekoaisle-insertCode.autoIndent: boolean` trueを指定するとオートインデントします。

For example:

```json
nekoaisle-insertCode.author: "木屋善夫", 
nekoaisle-insertCode.copyright: "Creansmaerd.CO.,LTD.", 
nekoaisle-insertCode.tempDir: "~/Documents/vsc/insertCode", 
nekoaisle-insertCode.autoIndent: true, 
```

---
## 推奨キー割り当て
```JSON
    {
        "key": "escape i",
        "command": "nekoaisle.insertCode",
        "when": "editorTextFocus && !editorReadonly"
    },
```