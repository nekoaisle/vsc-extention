"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
/**
 * 拡張機能基本クラス
 */
class Extention {
    /**
     * 構築
     * @param name 拡張機能名
     * @param cmd  contributes.commands.command
     */
    constructor(name, cmd) {
        this.extentionName = name;
        this.command = cmd;
        this.extentionKey = cmd.split('.');
        console.log(`${this.extentionName} が起動しました。`);
        this.config = vscode.workspace.getConfiguration(this.extentionKey[0]);
    }
    /**
     * エントリー
     */
    exec() {
    }
    /**
     * settings.json からこの拡張機能用の設定を取得
     * @param key 設定名
     * @param def 設定されていないときに返す値
     * @return string 設定
     */
    getConfig(key, def) {
        return this.config.get(key, def);
    }
    /**
     * コマンドを登録
     * @param context
     * @param ext
     */
    registerCommand(context) {
        let disp = vscode.commands.registerCommand(this.command, () => {
            this.exec();
        });
        context.subscriptions.push(disp);
    }
}
exports.Extention = Extention;
//# sourceMappingURL=Extention.js.map