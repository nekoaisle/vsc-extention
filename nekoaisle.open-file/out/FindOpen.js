'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
/**
 * エクステンション本体
 */
class FindOpen extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: '検索して開く',
            config: 'nekoaisle-findOpen',
            commands: [
                {
                    command: 'nekoaisle.findOpen',
                    callback: () => { this.exec(); }
                }
            ]
        });
    }
    /**
     * エントリー
     */
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            // // 基準ディレクトリを決める
            // let cwd = Util.getWorkFolder();
            // ファイル名を入力
            let pattern = yield vscode.window.showInputBox({
                placeHolder: '検索するglobパターンを入力してください。(複数指定は,区切り)',
            });
            if (!pattern || (pattern.length <= 0)) {
                return;
            }
            // // ファイル名を補正
            // pattern = Util.normalizePath(pattern, Util.getWorkFolder());
            // 除外ファイルを取得
            let excludes = [
                ...Object.keys((yield vscode.workspace.getConfiguration('search', null).get('exclude')) || {}),
                ...Object.keys((yield vscode.workspace.getConfiguration('files', null).get('exclude')) || {})
            ].join(',');
            // ファイルを検索
            const uris = yield vscode.workspace.findFiles(`{${pattern}}` /*, `{${excludes}}`*/);
            if (uris.length === 0) {
                nekoaisle_1.Util.putMess(`${pattern} は見つかりませんでした。`);
                return;
            }
            // メニュ作成
            let menu = [];
            for (let uri of uris) {
                let pinfo = new nekoaisle_1.PathInfo(uri.fsPath);
                menu.push({
                    label: pinfo.info.base,
                    description: pinfo.path,
                });
            }
            // メニュー選択
            let options = {
                placeHolder: '選択してください。',
                matchOnDetail: false,
                matchOnDescription: false
            };
            vscode.window.showQuickPick(menu, options).then((sel) => {
                if (!sel || !sel.description) {
                    // 未選択
                    return;
                }
                nekoaisle_1.Util.openFile(sel.description, false);
            });
        });
    }
    /**
     * エントリー
     */
    exec_ver1() {
        // 基準ディレクトリを決める
        let cwd = nekoaisle_1.Util.getWorkFolder();
        // ファイル名を入力
        vscode.window.showInputBox({
            placeHolder: '検索するファイル名を入力してください。',
            prompt: `絶対パスまたは ${cwd} からの相対で指定してください。`
        }).then((file) => {
            if (!file || (file.length <= 0)) {
                return;
            }
            // ファイル名を補正
            file = nekoaisle_1.Util.normalizePath(file, nekoaisle_1.Util.getWorkFolder());
            // ファイルを検索
            let files = this.findFile(file);
            if (files.length <= 0) {
                return;
            }
            // メニュ作成
            let menu = [];
            for (let file of files) {
                let pinfo = new nekoaisle_1.PathInfo(file);
                menu.push({
                    label: pinfo.info.base,
                    description: pinfo.path,
                });
            }
            // メニュー選択
            let options = {
                placeHolder: '選択してください。',
                matchOnDetail: false,
                matchOnDescription: false
            };
            vscode.window.showQuickPick(menu, options).then((sel) => {
                if (!sel || !sel.description) {
                    // 未選択
                    return;
                }
                nekoaisle_1.Util.openFile(sel.description, false);
            });
        });
    }
    findFile(filename) {
        let pinfo = new nekoaisle_1.PathInfo(filename, nekoaisle_1.Util.getWorkFolder());
        // let cmd = `find ${pinfo.info.dir} -type f -name "${pinfo.info.base}" ! -path "*/instemole-php/*"`;
        let cmd = `find ${pinfo.info.dir} -type f -name "${pinfo.info.base}"`;
        let res = nekoaisle_1.Util.execCmd(cmd);
        res = res.trim();
        if (res) {
            return res.split("\n");
        }
        else {
            return [];
        }
    }
}
module.exports = FindOpen;
//# sourceMappingURL=FindOpen.js.map