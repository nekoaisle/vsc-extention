'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
/**
 * エクステンション活性化
 * @param context
 */
function activate(context) {
    /* tslint:disable:no-unused-expression */
    let ext = new MyExtention(context);
}
exports.activate = activate;
/**
 * 非活性化
 */
function deactivate() {
}
exports.deactivate = deactivate;
/**
 * エクステンション本体
 */
class MyExtention extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        // 登録するコマンド配列を作成
        super(context, {
            name: '行番号ジャンプ',
            config: 'jumpToLineNumber',
            commands: [
                {
                    command: `nekoaisle.jumpToLineNumber`,
                    callback: (options) => {
                        this.jumpAfterInput(options);
                    }
                }
            ]
        });
    }
    /**
     * 指定行番号へジャンプ
     * @param line ジャンプする行番号
     */
    jump(line) {
        // 行が指定されていないときは何もしない
        if (line.length <= 0) {
            return;
        }
        let l = parseInt(line);
        //ドキュメントを取得
        let editor = vscode.window.activeTextEditor;
        // 指定行の範囲を取得
        const range = editor.document.lineAt(l - 1).range;
        // 指定行の開始位置にカーソルを移動
        editor.selection = new vscode.Selection(range.start, range.start);
        // 指定レンジが画面に表示される位置にスクロール
        editor.revealRange(range);
    }
    /**
     * 行番号指定ジャンプ
     * @param top 行版の先頭の数字
     */
    jumpAfterInput(options) {
        // InputBoxを表示して行番号を求める
        var option = {
            prompt: "ジャンプする行番号を入力してください。",
            password: false,
            value: options.default,
            valueSelection: [1, 1]
        };
        vscode.window.showInputBox(option).then(this.jump);
    }
}
//# sourceMappingURL=extension.js.map