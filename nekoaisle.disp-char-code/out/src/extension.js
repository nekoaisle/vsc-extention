'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
/**
 * エクステンション活性化
 * @param context
 */
function activate(context) {
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
        super(context, {
            name: 'Disp Char Code',
            commands: []
        });
        // エントリーを登録
        let subscriptions = [];
        vscode.window.onDidChangeActiveTextEditor(this.onEvent, this, subscriptions);
        vscode.window.onDidChangeTextEditorSelection(this.onEvent, this, subscriptions);
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        subscriptions.push(this.statusBarItem);
        // create a combined disposable from both event subscriptions
        this.disposable = vscode.Disposable.from(...subscriptions);
        // 初期表示
        this.dispCharCode();
    }
    dispose() {
        this.disposable.dispose();
    }
    /**
     * イベントハンドラ
     */
    onEvent() {
        this.dispCharCode();
    }
    dispCharCode() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            this.statusBarItem.hide();
            return;
        }
        let doc = editor.document;
        // カーソル位置を取得
        let cursor = editor.selection.start;
        // カーソルの行の内容を取得
        let line = doc.lineAt(cursor.line).text;
        // カーソル位置の文字コードを取得
        let str;
        if (line.length > cursor.character) {
            let c = line.charCodeAt(cursor.character);
            str = `0x${(c).toString(16)} (${c})`;
        }
        else {
            str = (doc.eol == vscode.EndOfLine.LF) ? 'LF' : 'CRLF';
        }
        this.statusBarItem.text = str;
        this.statusBarItem.show();
    }
}
//# sourceMappingURL=extension.js.map