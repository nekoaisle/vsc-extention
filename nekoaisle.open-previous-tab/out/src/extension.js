'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
function activate(context) {
    let openPreviousTab = new OpenPreviousTab(context);
    context.subscriptions.push(openPreviousTab);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
class OpenPreviousTab extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: '拡張機能名',
            config: 'nekoaisle-toggleTab',
            commands: [
                {
                    command: 'nekoaisle.toggleTab',
                    callback: () => {
                        this.exec();
                    }
                }
            ]
        });
        this.history = [];
        // イベントハンドラーを登録
        let subscriptions = [];
        vscode.window.onDidChangeActiveTextEditor(this.onEvent, this, subscriptions);
        // create a combined disposable from both event subscriptions
        this.disposable = vscode.Disposable.from(...subscriptions);
        // 現在のアクティブタブを記憶
        if (vscode.window.activeTextEditor) {
            this.history[0] = {
                fileName: vscode.window.activeTextEditor.document.fileName,
                editor: vscode.window.activeTextEditor,
            };
        }
    }
    /**
     * エントリー
     */
    exec() {
        if (!this.history[1]) {
            return;
        }
        let fileName = this.history[1].fileName;
        for (let doc of vscode.workspace.textDocuments) {
            let fn = doc.fileName;
            if (doc.fileName == fileName) {
                vscode.window.showTextDocument(doc);
                break;
            }
        }
    }
    /**
     * イベントハンドラ
     */
    onEvent(e) {
        if (vscode.window.activeTextEditor) {
            // 現在のアクティブファイル名を取得
            let editor = vscode.window.activeTextEditor;
            let fileName = editor.document.fileName;
            if (this.history.length === 0) {
                // 初
                this.history[0] = {
                    fileName: fileName,
                    editor: editor,
                };
            }
            else if (this.history[0].fileName != fileName) {
                // 同違っているので記憶
                // 前回のアクティブタブを記憶
                this.history[1] = this.history[0];
                // 現在のアクティブタブを記憶
                this.history[0] = {
                    fileName: fileName,
                    editor: editor,
                };
            }
        }
    }
    dispose() {
        this.disposable.dispose();
    }
}
//# sourceMappingURL=extension.js.map