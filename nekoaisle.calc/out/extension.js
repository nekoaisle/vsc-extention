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
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
const sprintf_js_1 = require("sprintf-js");
function activate(context) {
    let ext = new MyExtension(context);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
class MyExtension extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'nekoaisle-calc',
            config: 'nekoaisle-calc',
            commands: [{
                    command: 'nekoaisle.calc',
                    callback: () => { this.entry(); }
                }]
        });
    }
    /**
     * エントリー
     */
    entry() {
        return __awaiter(this, void 0, void 0, function* () {
            // まずは計算式入力
            let exp = yield vscode.window.showInputBox({
                placeHolder: "計算式を入力してください。"
            });
            if (typeof exp !== "string") {
                // キャンセルされた
                return;
            }
            // // 数式チェック
            // const re = /^[0-9-+*/&|^()]+$/;
            // let res = re.exec(exp);
            // if (!isArray(res)) {
            //   // 計算できない文字列だった
            //   Util.putMess(`数式に使えない文字が含まれています。 ${exp}`);
            //   return;
            // }
            // 計算
            let ev;
            try {
                ev = eval(`${exp}`);
            }
            catch (e) {
                // 計算できない文字列だった
                nekoaisle_1.Util.putMess(`計算できませんでした。 ${exp}`);
                return;
            }
            let value = parseFloat(ev);
            if (isNaN(value)) {
                // 計算できない文字列だった
                nekoaisle_1.Util.putMess(`計算できませんでした。 ${exp}`);
                return;
            }
            // 書式入力
            let format = yield vscode.window.showInputBox({
                value: this.getConfig('format', '%f'),
                placeHolder: "出力書式を入力してください。"
            });
            if (typeof format !== "string") {
                // キャンセルされた
                return;
            }
            // フォーマット変換
            // let cmd = `printf "${format}" "${value}"`;
            // let valString: string = Util.execCmd(cmd);
            let valString = sprintf_js_1.sprintf(format, value);
            // 現在のエディタを取得
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                // 編集中ではないのでメッセージ出力
                nekoaisle_1.Util.putMess(valString);
            }
            else {
                // カーソル位置に挿入
                let inserts = [];
                for (let sels of editor.selections) {
                    inserts.push({
                        pos: sels.anchor,
                        str: valString,
                    });
                }
                this.syncInsert(editor, inserts);
            }
        });
    }
}
//# sourceMappingURL=extension.js.map