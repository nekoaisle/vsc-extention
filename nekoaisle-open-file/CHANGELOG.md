# 変更履歴

## 0.0.1
ファーストリリース
それまで別々の拡張機能だったファイルを開く系を一つにまとめた。

## 0.0.2 2023-04-27
長らくメンテナンスしていなかったためにこの時点での環境ではトランスパイルできなくなっていたのを修正。

## 0.0.3 2023-05-11
open-hist のファイル登録をクリティカルセクションとして排他処理を追加した。
open-hist ファイル選択時に description への一致も含めるようにした

## 0.0.4 2023-05-31
1. nekoaisle.toggleTab を統合
2. "activationEvents" を "*" から "onStartupFinished" に変更
3. nekoaisle.openHistRemoveNonexistentFile ディレクトリも削除するようにした
4. nekoaisle.openHist 存在しないファイルやディレクトリを選択した際にエラーメッセージを出すようにした。
5. nekoaisle.openHist 下記のファイル名を記録しないようにした
   ディレクトリ名
   存在しないファイル名
   正規表現 /^Untitled-[0-9]+/ に一致するファイル名
   .git で終わるファイル名
