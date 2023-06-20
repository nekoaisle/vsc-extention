# Nekoaisle Tab Group Manager

現在編集中のエディターを含むタブグループ内のファイル名を保存しタブグループ復元できるようにします。

## Contribution Points

### nekoaisle-tab-manager.openMenu
タブグループ管理メニューからコマンドを選んで実行します。

### nekoaisle-tab-manager.saveTabFilenames
現在編集中のエディターを含むタブグループ内の全ファイル名を保存スロットを指定して保存します。

### nekoaisle-tab-manager.restoreTabGroup
現在編集中のエディターを含むタブグループの全エディタを閉じ、指定された保存スロットに保存されている全ファイルを開きます。

### nekoaisle-tab-manager.undoTabGroup
タブグループを復元前に戻す

### nekoaisle-tab-manager.editSaveFile
タブグループ保存ファイルを編集する

### nekoaisle-tab-manager.reload
タブグループ保存ファイルを再読込

### 保存ファイル
保存スロットに保存したスロット名やファイル名は保存ファイルに保存されます。
デフォルトの保存ファイル名は ~/Documents/nekoaisle-tab-manager.json です。

settings.json の nekoaisle-tab-manager.save-file にて変更できます。