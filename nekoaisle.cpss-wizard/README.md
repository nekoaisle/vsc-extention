## 特徴

CPSS 用の初期ファイルを自動生成します。  
また、SQLファイルを指定することにより,テーブルの一覧および行の編集機能を実装する際の雛形を作成します。  

## 要件

PHP 5.1 以上が必要です。

## テンプレートファイル名

### ファイル名

拡張子は現在開いているファイルと同じものを使います。  

|種類              |ファイル名  |
|------------------|------------|
|標準テンプレート  |template    |
|編集 基本クラス   |TransBase   |
|編集 初期化ページ |TransInit   |
|編集 編集ページ   |TransEdit   |
|編集 確認ページ   |TransConfirm|
|編集 完了ページ   |Completed   |
|一覧 基本クラス   |ListBase    |
|一覧 初期化ページ |ListInit    |
|一覧 表示ページ   |ListList    |
|CCamRow 派生クラス|Row         |

### 拡張子
テンプレートのファイル名は template.[現在開いているファイルの拡張子] を使います。  

### ディレクトリ
下記の順でディレクトリを探索します。
1. 現在編集中のファイルが格納されているディレクトリ直下の **templates** ディレクトリ内の種類ごとのファイル名
2. 現在編集中のファイルが格納されているディレクトリ内の種類ごとのファイル名
3. 現在編集中のファイルが格納されているディレクトリ内の **template** ファイル
4. この拡張機能が格納されているディレクトリ内の **templates** ディレクトリ内の **template** ファイル

例:
* 現在編集中のファイル: ~/Documents/hoge/test.php
* 種類: 編集 基本クラス

1. ~/Documents/hoge/templates/TransBase.php
2. ~/Documents/hoge/TransBase.php
3. ~/Documents/hoge/template.php
4. ~/.vscode/extensions/nekoaisle.cpss-wizard/templates/template.php

## 拡張機能の設定

settings.json に下記を記載することにより動作を変更できます。

* `cpssWizard.wizard`     : PHP で作成された Wizard のファイル名
* `cpssWizard.templateDir`: テンプレートが格納されたディレクトリ名
* `cpssWizard.php`        : PHP の実行ファイル
* `cpssWizard.outFile`    : 出力先 (php://stdoutにすればカーソル位置に挿入されます)
* `cpssWizard.author`     : 著者名

例:  
    "cpssWizard.wizard"     : "~/documents/PHP/CpssWizardUTF8.php",  
    "cpssWizard.templateDir": "~/documents/templates",  
    "cpssWizard.php"        : "/usr/bin/php",  
    "cpssWizard.outFile"    : "php://stdout",  
    "cpssWizard.author"     : "Yoshio Kiya",  

## 既知の問題点
