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
function activate(context) {
    let ext = new CommandMenu(context);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
class CommandMenu extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'nekoaisle-command-menu',
            config: 'nekoaisle-commandMenu',
            commands: [{
                    command: 'nekoaisle.commandMenu',
                    callback: (menuName) => { this.entry(menuName); }
                }, {
                    command: 'nekoaisle.multiCommand',
                    callback: (commands) => { this.multiCommand(commands); }
                }]
        });
    }
    /**
     * エントリー
     */
    entry(menuName = 'default') {
        // メニューJsonの読み込み
        let menuInfo = this.loadMenuInfo(menuName);
        if (menuInfo.length === 0) {
            nekoaisle_1.Util.putMess(`menuName が見つかりません。`);
            return;
        }
        // メニューの作成
        let menu = this.makeMenu(menuInfo);
        // QuickPick オブジェクトを作成
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = menu;
        quickPick.placeholder = '選択してください。';
        quickPick.matchOnDetail = false;
        quickPick.matchOnDescription = false;
        /**
         * 入力文字列が変更された処理設定
         */
        quickPick.onDidChangeValue((value) => {
            // 全角→半角に変換
            value = this.zenToHan(value);
            // 小文字を大文字に変換
            value = value.toUpperCase();
            // 実行
            if (this.exec(menuInfo, value)) {
                // 実行したのでクイックピックを閉じる
                quickPick.hide();
            }
        });
        /**
         * エンターを押した処理設定
         */
        quickPick.onDidAccept(() => {
            let picks = quickPick.selectedItems;
            if (picks.length === 1) {
                let pick = picks[0];
                if (pick) {
                    // 選択しているので実行
                    this.exec(menuInfo, pick);
                }
            }
            // エンター押した場合は必ず閉じる
            quickPick.hide();
        });
        // 非表示にしたら破棄設定
        quickPick.onDidHide(() => quickPick.dispose());
        // 開く
        quickPick.show();
    }
    /**
     * 複数コマンド実行
     * @param commands コマンド
     */
    multiCommand(commands) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd;
            if (!Array.isArray(commands)) {
                commands = [commands];
            }
            for (let cmd of commands) {
                yield vscode.commands.executeCommand(cmd.command, cmd.args);
            }
        });
    }
    /**
     * メニューを読み込む
     * @param menuName メニュー名もしくはメニューファイル名
     */
    loadMenuInfo(menuName = 'default') {
        let menu = [];
        // デフォルトの読み込み
        let fn = this.joinExtensionRoot("data/defaults.json");
        let menus = nekoaisle_1.Util.loadFileJson(fn);
        if (menus && menus[menuName]) {
            menu = menus[menuName];
        }
        // ユーザー設定メニューの読み込み
        let userMenus = this.getConfig('menus', null);
        // ユーザーメニューを上書き
        if (userMenus && userMenus[menuName]) {
            // 拡張メニューをデフォルトにかぶせる
            let adds = userMenus[menuName];
            for (let key in adds) {
                menu[key] = adds[key];
            }
        }
        // 指定メニューの存在チェック
        if (!menus || !menus[menuName]) {
            if (!menus) {
                // 指定メニューが見つからない
                return [];
            }
        }
        // メニューを返す
        return menus[menuName];
    }
    /**
     * メニューの作成
     * @param menuInfo メニュー情報配列
     */
    makeMenu(menuInfo) {
        let langID;
        if (!vscode.window.activeTextEditor) {
            // エディターがないので言語指定はなし
            langID = undefined;
        }
        else {
            let editor = vscode.window.activeTextEditor;
            langID = editor.document.languageId;
        }
        // メニューを作成
        let menu = [];
        for (let item of menuInfo) {
            if (item.hide) {
                // 非表示は無視
                continue;
            }
            if (item.languageID) {
                // 言語が限定されている
                let langs;
                if (typeof item.languageID === 'string') {
                    // 単一指定は配列に変換
                    langs = [item.languageID];
                }
                else if (Array.isArray(item.languageID)) {
                    // 配列はそのまま使用
                    langs = item.languageID;
                }
                else {
                    // それ以外はエラー
                    nekoaisle_1.Util.putMess(`"${item.label} ${item.description}" の "languageID" が不正です。文字列または文字列の配列で指定してください。 `);
                    continue;
                }
                let equ = false;
                for (let l of langs) {
                    if (l === langID) {
                        equ = true;
                        break;
                    }
                }
                if (!equ) {
                    // 一致する言語がなかったのでメニューから除外
                    continue;
                }
            }
            // メニューに設定
            menu.push({
                label: item.label,
                description: item.description,
                detail: item.detail,
            });
        }
        return menu;
    }
    exec(menuInfo, arg) {
        switch (typeof arg) {
            // オブジェクト
            case 'object': {
                // vscode.QuickPickItem
                const item = arg;
                for (let info of menuInfo) {
                    if (info.command) {
                        // コマンドがある
                        if (item.label === info.label) {
                            if (item.description === info.description) {
                                if (item.detail === info.detail) {
                                    // すべて一致したので実行
                                    vscode.commands.executeCommand(info.command, info.args);
                                    return true;
                                }
                            }
                        }
                    }
                }
                break;
            }
            // 文字列
            case 'string': {
                const label = arg;
                // 入力された文字の長さを取得
                let len = arg.length;
                if (!len) {
                    // 入力されていないので実行しない
                    break;
                }
                // 文字列が一致するものをピックアップ
                let sels = [];
                for (let item of menuInfo) {
                    if (!item.command) {
                        // コマンドなしは無視
                        continue;
                    }
                    // 各メニューの先頭を比較
                    if (item.label.substr(0, len) === label) {
                        // 一致した
                        sels.push(item);
                    }
                }
                if (sels.length !== 1) {
                    // 一致しないか複数一致した
                    break;
                }
                // 存在したので実行
                let sel = sels[0];
                vscode.commands.executeCommand(sel.command, sel.args);
                return true;
            }
        }
        // 実行しなかった
        return false;
    }
    /**
     * 全角文字を半角文字に変換（キー入力専用）
     * @param zen 全角文字
     */
    zenToHan(zen) {
        // 変換辞書
        const zenHanDic = {
            "０": "0", "１": "1", "２": "2", "３": "3", "４": "4",
            "５": "5", "６": "6", "７": "7", "８": "8", "９": "9",
            "ａ": "a", "ｂ": "b", "ｃ": "c", "ｄ": "d", "ｅ": "e", "ｆ": "f",
            "ｇ": "g", "ｈ": "h", "ｉ": "i", "ｊ": "j", "ｋ": "k", "ｌ": "l",
            "ｍ": "m", "ｎ": "n", "ｏ": "o", "ｐ": "p", "ｑ": "q", "ｒ": "r",
            "ｓ": "s", "ｔ": "t", "ｕ": "u", "ｖ": "v", "ｗ": "w", "ｘ": "x",
            "ｙ": "y", "ｚ": "z",
            "ー": "-", "＾": "^", "￥": "\\", "＠": "@", "「": "[", "；": ";",
            "：": ":", "」": "]", "、": ",", "。": ".", "・": "/", "＿": "_",
            "！": "!", "”": "\"", "＃": "#", "＄": "$", "％": "%", "＆": "&",
            "’": "'", "（": "(", "）": ")", "＝": "=", "〜": "~", "｜": "|",
            "｀": "`", "｛": "{", "＋": "+", "＊": "*", "｝": "}", "＜": "<",
            "＞": ">", "？": "?",
            "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
        };
        let han = '';
        for (let i = 0; i < zen.length; ++i) {
            let c = zen.charAt(i);
            if (zenHanDic[c]) {
                han += zenHanDic[c];
            }
            else {
                // 辞書にないのでそのまま
                han += c;
            }
        }
        return han;
    }
}
//# sourceMappingURL=extension.js.map