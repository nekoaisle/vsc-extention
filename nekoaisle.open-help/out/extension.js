'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
/**
 * エクステンション活性化
 * @param context
 */
function activate(context) {
    let ext = new MyExtension(context);
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
class MyExtension extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'カーソル位置の単語でマニュアルなどを開く',
            config: 'nekoaisle-openHelp',
            commands: [
                {
                    command: 'nekoaisle.openHelp',
                    callback: () => { this.exec(); }
                }
            ]
        });
    }
    /**
     * エントリー
     */
    exec() {
        //
        let editor = vscode.window.activeTextEditor;
        // カーソル位置の単語を取得
        let word;
        if (editor.selection.isEmpty) {
            word = nekoaisle_1.Util.getCursorWord(editor);
        }
        else {
            word = editor.document.getText(editor.selection);
        }
        // デフォルトのリストファイル名
        let deffn = this.joinExtensionRoot("data/openHelp.json");
        let defaults = nekoaisle_1.Util.loadFileJson(deffn);
        // settings.json よりテンプレートディレクトリを取得
        let list = this.getConfig("exts", defaults);
        // 設定ファイルの読み込み
        // 継承を解決
        for (let key in list) {
            let item = list[key];
            if (item['inherit']) {
                // このアイテムは継承が指定されている
                let inherit = list[item['inherit']];
                if (inherit) {
                    // このオブジェクトで定義されていない要素は継承元から取得
                    for (let k in inherit) {
                        if (typeof item[k] === "undefined") {
                            // このオブジェクトでは指定されていない
                            item[k] = inherit[k];
                        }
                    }
                }
            }
        }
        // どのセクションを使用するか決める
        let lang;
        if (list[editor.document.languageId]) {
            // この言語用のセクションがあった
            lang = editor.document.languageId;
        }
        else if (list['default']) {
            // なかったのでデフォルトを使用
            lang = "default";
        }
        else {
            // default 設定がない
            nekoaisle_1.Util.putMess('このファイルタイプ用の設定がありません。');
        }
        let item = list[lang];
        switch (item.method) {
            case 'chrome': {
                for (let key in item.options) {
                    item.options[key] = item.options[key].replace("{{word}}", word);
                }
                nekoaisle_1.Util.browsURL(item.path, item.options);
                break;
            }
            default: {
                break;
            }
        }
    }
}
//# sourceMappingURL=extension.js.map