# nekoaisle 指定行にジャンプ

## 機能

### jumpToLineNumber
指定された行にジャンプします。

### jumpAfterInput
行番号の最初の一文字を引数にして呼び出すとテキストボックスを表示して残りの行番号の入力を促しますます。

これは、独自メニューを表示した際にショートカット 'n' にて nekoaisle.jumpAfterInput を起動するのではなく ショートカット 1 〜 9 に nekoaisle.jumpToLineNumber('1') 〜 ('9') とすることでキータッチを1回減らすための機能です。

※ 通常 nekoaisle.command-menu とともに使います。
