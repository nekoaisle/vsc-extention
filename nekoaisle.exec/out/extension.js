/**
 * 任意のシェルコマンドを実行
 *
 * filename:  extension.ts
 *
 * @package
 * @version   1.0.0
 * @copyright Copyright (C) 2020 Yoshio Kiya All rights reserved.
 * @date      2020-03-26
 * @author    木屋善夫
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Util_1 = require("./nekoaisle.lib/Util");
const Extension_1 = require("./nekoaisle.lib/Extension");
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
 * 任意のシェルコマンドを実行
 */
class MyExtention extends Extension_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: '任意のシェルコマンドを実行',
            config: 'nekoaisle-exec',
            commands: [
                {
                    command: 'nekoaisle.exec',
                    callback: (arg) => {
                        this.exec(arg);
                    }
                }
            ]
        });
    }
    /**
     * 実行
     */
    exec(cmd) {
        if (!cmd) {
            // コマンドが指定されなかったので選択範囲かカーソル行
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            // 選択範囲はある？
            if (!editor.selection.isEmpty) {
                // 選択範囲を取得
                cmd = editor.document.getText(editor.selection);
            }
            else {
                // 選択範囲がないのでカーソル行を取得
                cmd = Util_1.Util.getCursorLine(editor);
            }
        }
        // 実行
        Util_1.Util.execCmd(cmd);
    }
}
//# sourceMappingURL=extension.js.map