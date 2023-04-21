'use strict';
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
/**
 * エクステンション本体
 */
class OpenTag extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'タグジャンプ',
            config: 'nekoaisle-openTag',
            commands: [
                {
                    command: 'nekoaisle.openTag',
                    callback: () => { this.exec(); }
                }
            ]
        });
    }
    /**
     * エントリー
     */
    exec() {
        // アクティブなエディター取得
        if (!vscode.window.activeTextEditor) {
            return;
        }
        let editor = vscode.window.activeTextEditor;
        let cwd = nekoaisle_1.Util.getWorkFolder();
        // 文字列が選択されていたらその文字列のファイルを開く
        let range = editor.selection;
        if (!range.isEmpty) {
            // 範囲選択されている
            let file = editor.document.getText(range);
            nekoaisle_1.Util.tagJump(file, cwd);
        }
        else {
            // ファイル名を入力
            vscode.window.showInputBox({
                placeHolder: 'タグジャンプを入力してください。',
                prompt: `絶対パスまたは${cwd}からの相対で指定してください。`
            }).then((file) => {
                if (!file || (file.length <= 0)) {
                    return;
                }
                nekoaisle_1.Util.tagJump(file, cwd);
            });
        }
    }
}
module.exports = OpenTag;
//# sourceMappingURL=OpenTag.js.map