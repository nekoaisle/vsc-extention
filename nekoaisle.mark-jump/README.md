# markjump について

現在のカーソル位置を記憶しそこにジャンプすることができます。  
また、前回のカーソル位置に戻ることができます。操作を間違えてわけのわからないところにジャンプしてしまった後などに便利だと思います。

マークを複数記憶できるようにしました。ただし、ファイルを閉じるとそのファイルに関するマークは破棄されます。

## Features

|コマンド                |機能                          |
|------------------------|------------------------------|
|nekoaisle.markjumpMark  |現在のカーソル位置をマーク    |
|nekoaisle.markjumpJump  |最後にマークした位置にジャンプ|
|nekoaisle.markjumpReturn|前回のカーソル位置にジャンプ  |

markjumpMark, markjumpJump は引数にスロット番号を指定することができます。

### nekoaisle.markjumpReturn
Ver.1.40 にて cursorUndo が実装されたので廃止予定