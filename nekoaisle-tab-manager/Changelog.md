# 変更履歴

## 0.0.1
### nekoaisle-tab-manager.saveTabGroup
「タブグループを記録」を実装
### nekoaisle-tab-manager.restoreTabGroup
「タブグループを復元」を実装

## 0.0.2 2023-04-20
### nekoaisle-tab-manager.editSaveFile
「タブグループ保存ファイルを編集」を実装
### nekoaisle-tab-manager.reloadSaveFile
「タブグループ保存ファイルを再読込」を実装

## 0.0.3 2023-04-26
### nekoaisle-tab-manager.undoTabGroup
「復元したタブグループをもとに戻す」を実装

### nekoaisle-tab-manager.restoreTabGroup
タブグループを復元する際に開こうとしたファイルがすでに別のタブグループで開かれている場合は一旦閉じてから開くようにした。

※todo: 閉じて開くか無視するかを設定で選べるようにする

## 0.0.4 2023-04-27
### nekoaisle-tab-manager.openMenu
「タブグループ管理メニューからコマンドを選んで実行」を実装

### nekoaisle-tab-manager.restoreTabGroup
復元時に他のタブグループにてファイルが開かれている際に「閉じて開く」「そのまま」の選択肢を表示するようにした。

## 0.0.5 2023-04-28
### nekoaisle-tab-manager.restoreTabGroup
「restoreTabGroup タブグループを復元」をメニュー最上部にした。

## 0.0.6 2023-05-17
### nekoaisle-tab-manager.restoreTabGroup
タブグループを復元する際にまずすべてのタブを閉じるのだがこの処理が終わる前に復元しようとしてファイル型のタブで開かれていると勘違いしていたバグを修正

## 0.0.7 2023-06-20
1. publisher を nekoaisle に変更
2. editor/title/context に restoreTabGroup, saveTabGroup, undoTabGroup を追加
   ※本当はエディターグループ右端のメニューに追加したかった…

## 0.0.8 2023-09-29
vscode.Tab.input.uri がundefinedの際の処理を追加

## 0.0.9 2024-04-01
「保存するスロット」→「保存スロット」