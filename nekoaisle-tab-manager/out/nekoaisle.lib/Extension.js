"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Extension = void 0;
const vscode = require("vscode");
const path = require("path");
const Util_1 = require("./Util");
/**
 * 拡張機能基本クラス
 */
class Extension {
    /**
     * 構築
     * @param name 拡張機能名
     * @param cmd  contributes.commands.command
     */
    constructor(context, options) {
        //		console.log(`${options.name} が起動しました。`);
        // この拡張機能が格納されているディレクトリ名
        this.extensionRoot = context.extensionPath;
        // 起動オプションを記憶
        this.options = options;
        // コマンドがあれば登録
        if (options.commands) {
            this.registerCommands(context, options.commands);
        }
    }
    getConfiguration() {
        return vscode.workspace.getConfiguration(this.options.config);
    }
    /**
     * settings.json からこの拡張機能用の設定を取得
     * @param key 設定名
     * @param def 設定されていないときに返す値
     * @return string 設定
     */
    getConfig(key, def) {
        let config = this.getConfiguration();
        let ret = config.get(key, def);
        if (ret) {
            return ret;
        }
        return def;
    }
    /**
     * コマンドを登録
     * @param context
     * @param ext
     */
    registerCommand(context, command, callback) {
        let disp = vscode.commands.registerCommand(command, callback);
        context.subscriptions.push(disp);
    }
    /**
     * コマンドを登録
     * @param context
     * @param ext
     */
    registerCommands(context, commands) {
        for (let cmd of commands) {
            let disp = vscode.commands.registerCommand(cmd.command, cmd.callback);
            context.subscriptions.push(disp);
        }
    }
    /**
     * 拡張機能フォルダー内に格納されているファイル名をフルパスにする
     * @param filename ファイル名
     */
    joinExtensionRoot(filename) {
        return path.join(this.extensionRoot, filename);
    }
    /**
 * setting.jsonからファイル名を取得
 * @param key setting.json のキー
 * @param def 設定がないときの名前
 * @return ファイル名
 */
    getFilenameAccordingConfig(key, def) {
        // デフォルトのリストファイル名
        let fn = this.joinExtensionRoot(def);
        // settings.json より履歴ファイル名を取得
        fn = this.getConfig(key, fn);
        // 先頭の ~ を置換
        fn = Util_1.Util.normalizePath(fn);
        //
        return fn;
    }
    /**
     * テンプレート格納ディレクトリ名を取得
     * ※互換性の為残します
     * @param dirName ディレクトリ名
     * @param settingsKey settings.json のサブキー
     * @return string テンプレート格納ディレクトリ名
     */
    getConfigDir(dirName, settingsKey) {
        return this.getFilenameAccordingConfig(settingsKey, dirName);
    }
    /**
     * 複数挿入
     * @param editor 対象エディター
     * @param pos 編集座標
     * @param str 挿入文字列
     * @param ary 編集情報配列
     */
    syncInsert(editor, ary) {
        // 非同期編集を実行
        let i = 0;
        let e = (pos, str) => {
            // 大文字・小文字変換した文字と置換
            editor.edit(edit => edit.insert(pos, str)).then((val) => {
                if (val) {
                    ++i;
                    if (ary[i]) {
                        e(ary[i].pos, ary[i].str);
                    }
                }
            });
        };
        e(ary[i].pos, ary[i].str);
    }
    /**
     * 複数置換
     * @param editor 対象エディター
     * @param pos 編集座標
     * @param str 挿入文字列
     * @param ary 編集情報配列
     */
    syncReplace(editor, ary) {
        // 非同期編集を実行
        let i = 0;
        let e = (sel, str) => {
            // 大文字・小文字変換した文字と置換
            editor.edit(edit => edit.replace(sel, str)).then((val) => {
                if (val) {
                    ++i;
                    if (ary[i]) {
                        e(ary[i].range, ary[i].str);
                    }
                }
            });
        };
        e(ary[i].range, ary[i].str);
    }
}
exports.Extension = Extension;
//# sourceMappingURL=Extension.js.map