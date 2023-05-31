# 変更履歴

## 0.0.1 2023-05-23
ファーストリリース

下記の拡張機能を1つにまとめました。
1. nekoaisle-select-word-0.0.3
2. nekoaisle-jump-to-line-number-0.0.2
3. nekoaisle-mark-jump-0.1.3

## 0.0.2 2023-05-23
下記の機能を追加

### nekoaisle-cursor.undo
カーソルをもとの位置に戻す
システムの cursorUndo はスクロール位置の調整をしないため画面外にカーソルが移動するとカーソルが見えなくなってしまうので、 cursorUndo を呼び出したあとに revealRange() しています。
※ cursorUndo が修正されるまでの応急処置です。

### nekoaisle-cursor.revealRange
カーソルが表示される位置にスクロール位置を調整

## 0.0.3 2023-05-30
nekoaisle-cursor.markjumpMenu
マークジャンプ メニューを表示
