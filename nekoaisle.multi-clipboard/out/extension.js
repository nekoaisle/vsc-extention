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
 * マルチクリップボード
 *
 * filename:  extension.ts
 *
 * @package
 * @version   1.0.0
 * @copyright Copyright (C) 2019 Yoshio Kiya All rights reserved.
 * @date      2019-11-19
 * @author    木屋善夫
 */
class MyExtention extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'マルチクリップボード',
            config: 'nekoaisle-multiClipboard',
            commands: [
                {
                    command: 'nekoaisle.multiClipboard.menu',
                    callback: () => { this.menu(); }
                },
                {
                    command: 'nekoaisle.multiClipboard.copy',
                    callback: () => { this.copy(); }
                },
                {
                    command: 'nekoaisle.multiClipboard.cut',
                    callback: () => { this.cut(); }
                },
                {
                    command: 'nekoaisle.multiClipboard.paste',
                    callback: () => { this.paste(); }
                },
                {
                    command: 'nekoaisle.multiClipboard.push',
                    callback: () => { this.push(); }
                },
                {
                    command: 'nekoaisle.multiClipboard.pop',
                    callback: () => { this.pop(); }
                },
                {
                    command: 'nekoaisle.multiClipboard.fromClipboard',
                    callback: () => { this.fromClipboard(); }
                },
                {
                    command: 'nekoaisle.multiClipboard.toClipboard',
                    callback: () => { this.toClipboard(); }
                }
            ]
        });
        // クリップボード
        this.clipboards = {};
        this.slots = 10;
        this.lastSlot = "0";
        // クリップボードを初期化
        for (let n = 0; n < this.slots; ++n) {
            let key = n.toString();
            this.clipboards[key] = [];
        }
    }
    /**
     * メニューを表示
     */
    menu() {
        let menu = [
            {
                label: 'c',
                description: 'copy コピー'
            },
            {
                label: 'x',
                description: 'cut カット'
            },
            {
                label: 'v',
                description: 'paset ペースト'
            },
            {
                label: 'a',
                description: 'add スロット末尾に追加'
            },
            {
                label: 'u',
                description: 'push スロット末尾に追加して削除'
            },
            {
                label: 'o',
                description: 'pop スロット末尾をペーストして削除'
            },
            {
                label: 'f',
                description: 'fromClipboard クリップボードをコピー'
            },
            {
                label: 't',
                description: 'toClipboard クリップボードへコピー'
            },
        ];
        let _this = this;
        const exec = (key) => {
            switch (key) {
                case 'c':
                    _this.copy();
                    return true;
                case 'x':
                    _this.cut();
                    return true;
                case 'v':
                    _this.paste();
                    return true;
                case 'a':
                    _this.add();
                    return true;
                case 'u':
                    _this.push();
                    return true;
                case 'o':
                    _this.pop();
                    return true;
                case 'f':
                    _this.fromClipboard();
                    return true;
                case 't':
                    _this.toClipboard();
                    return true;
            }
            return false;
        };
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
            if (value.length === 0) {
                return;
            }
            // 先頭１文字を取得
            let char = value.substr(0, 1);
            // 全角→半角に変換
            char = this.zenToHan(char);
            // 実行
            if (exec(char)) {
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
                    exec(pick.label.substr(0, 1));
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
     * 選択範囲もしくは行を指定スロットにコピー
     */
    copy() {
        /**
         * コピー処理
         * @param slot スロット名
         * @param editor エディター
         */
        const job = (key, editor) => {
            if (this.clipboards[key] === undefined) {
                // そんな名前のスロットはない
                return false;
            }
            // 全カーソル位置の文字列を取得
            let clipboard = this.getText(editor);
            // 保存
            this.clipboards[key] = clipboard;
            // 
            return true;
        };
        // スロットを選択
        this.showQuickPick(true, job);
    }
    /**
     * 選択範囲もしくは行を指定スロットにコピーして削除
     */
    cut() {
        /**
         * コピー処理
         * @param slot スロット名
         * @param editor エディター
         */
        const job = (key, editor) => {
            if (this.clipboards[key] === undefined) {
                // そんな名前のスロットはない
                return false;
            }
            // 全カーソル位置の文字列を取得
            let clipboard = this.getText(editor);
            // 保存
            this.clipboards[key] = clipboard;
            // 対象文字列を削除
            this.delText(editor);
            //
            return true;
        };
        // スロットを選択
        this.showQuickPick(true, job);
    }
    /**
     * 選択範囲もしくは行を指定スロットに追加
     */
    add() {
        /**
         * コピー処理
         * @param slot スロット名
         * @param editor エディター
         */
        const job = (slot, editor) => {
            // 全カーソル位置の文字列を取得
            let clipboard = this.getText(editor);
            // 保存
            this.clipboards[slot] = this.clipboards[slot].concat(clipboard);
            // 
            return true;
        };
        // スロットを選択
        this.showQuickPick(true, job);
    }
    /**
     * 選択範囲もしくは行を指定スロットに追加して削除
     */
    push() {
        /**
         * コピー処理
         * @param slot スロット名
         * @param editor エディター
         */
        const job = (slot, editor) => {
            // 全カーソル位置の文字列を取得
            let clipboard = this.getText(editor);
            // 保存
            this.clipboards[slot] = this.clipboards[slot].concat(clipboard);
            // 対象文字列を削除
            this.delText(editor);
            //
            return true;
        };
        // スロットを選択
        this.showQuickPick(true, job);
    }
    /**
     * 指定スロットを貼り付け
     */
    paste() {
        /**
         * コピー処理
         * @param slot スロット名
         * @param editor エディター
         */
        const job = (slot, editor) => {
            let clipboard = this.clipboards[slot];
            if (clipboard.length === 0) {
                // そのスロットは空
                return false;
            }
            // 行を現在のドキュメント改行コードで連結
            const cr = nekoaisle_1.Util.getEndOfLine(editor);
            let text = clipboard.join(cr);
            if (cr !== "\n") {
                // 改行コードが\n でない時は変換
                text = text.replace("\n", cr);
            }
            // 挿入または置換
            this.putText(editor, text);
            //
            return true;
        };
        // スロットを選択
        this.showQuickPick(false, job);
    }
    /**
     * 指定スロットの末尾を貼り付けて削除
     */
    pop() {
        /**
         * コピー処理
         * @param slot スロット名
         * @param editor エディター
         */
        const job = (slot, editor) => {
            let clipboard = this.clipboards[slot];
            if (clipboard.length === 0) {
                // そのスロットは空
                return false;
            }
            // 行を現在のドキュメント改行コードで連結
            let text = clipboard.pop();
            if (text) {
                // 挿入または置換
                let cr = nekoaisle_1.Util.getEndOfLine(editor);
                if (cr !== "\n") {
                    // 改行コードが\n でない時は変換
                    text = text.replace("\n", cr);
                }
                this.putText(editor, text);
            }
            // 
            return true;
        };
        // スロットを選択
        this.showQuickPick(false, job);
    }
    /**
     * 選択範囲もしくは行を指定スロットにコピー
     */
    fromClipboard() {
        /**
         * コピー処理
         * @param slot スロット名
         * @param editor エディター
         */
        const job = (key, editor) => {
            if (this.clipboards[key] === undefined) {
                // そんな名前のスロットはない
                return false;
            }
            // クリップボードを取得
            let text = nekoaisle_1.Util.getClipboard();
            // 改行文字が\n 以外ならば変換
            const cr = nekoaisle_1.Util.getEndOfLine(editor);
            if (cr !== "\n") {
                text = text.replace(cr, "\n");
            }
            // 保存
            this.clipboards[key] = [text];
            // 
            return true;
        };
        // スロットを選択
        this.showQuickPick(true, job);
    }
    /**
     * 指定スロットをクリップボードへ
     */
    toClipboard() {
        /**
         * 処理
         * @param slot スロット名
         * @param editor エディター
         */
        const job = (slot, editor) => {
            let clipboard = this.clipboards[slot];
            if (clipboard.length === 0) {
                // そのスロットは空
                return false;
            }
            // 行を現在のドキュメント改行コードで連結
            let cr = nekoaisle_1.Util.getEndOfLine(editor);
            let text = clipboard.join(cr);
            nekoaisle_1.Util.putClipboard(text);
            // 
            return true;
        };
        // スロットを選択
        this.showQuickPick(false, job);
    }
    /**
     * カーソル位置の文字列を取得
     *
     * @param editor 対象エディター
     */
    getText(editor) {
        const cr = nekoaisle_1.Util.getEndOfLine(editor);
        // 全カーソル位置を処理
        let ret = [];
        for (let sel of editor.selections) {
            let text;
            if (!sel.isEmpty) {
                // 選択範囲を取得
                text = editor.document.getText(sel);
                // 改行文字が\n 以外ならば変換
                if (cr !== "\n") {
                    text = text.replace(cr, "\n");
                }
            }
            else {
                // 範囲指定がなければ行全体
                text = editor.document.lineAt(sel.anchor.line).text;
            }
            // 追加
            ret.push(text);
        }
        return ret;
    }
    /**
     * カーソル位置に文字列を挿入/置換
     *
     * @param editor 対象エディター
     */
    putText(editor, text) {
        // すべてのカーソルについて処理
        // ※非同期で編集すると最初の編集以外が無視される
        // for (let sel of editor.selections) {
        // 	// 選択範囲を置換
        // 	editor.edit(function (edit) {
        // 		if (sel.isEmpty) {
        // 			// 選択していないので貼り付け
        // 			edit.insert(sel.anchor, text);
        // 		} else {
        // 			// 選択範囲と置換
        // 			// edit.replace だと選択されたままになる
        // 			edit.delete(sel);
        // 			edit.insert(sel.start, text);
        // 		}
        // 	});
        // }
        // すべてのカーソルについて処理
        let sels = [];
        for (let sel of editor.selections) {
            sels.unshift(sel);
        }
        let i = 0;
        let e = (sel) => {
            editor.edit(editor2 => {
                if (sel.isEmpty) {
                    editor2.insert(sel.anchor, text);
                }
                else {
                    // 選択範囲と置換
                    // edit.replace だと選択されたままになる
                    editor2.delete(sel);
                    editor2.insert(sel.start, text);
                }
            }).then((val) => {
                if (val) {
                    // 成功しているの次の編集操作
                    ++i;
                    if (sels[i]) {
                        e(sels[i]);
                    }
                }
            });
        };
        // 起動
        e(sels[i]);
    }
    /**
     * カーソル位置の文字列を削除
     *
     * @param editor 対象エディター
     */
    delText(editor) {
        // すべてのカーソルについて処理
        for (let sel of editor.selections) {
            // 選択範囲を置換
            editor.edit(function (edit) {
                if (sel.isEmpty) {
                    // 選択していないので行を削除
                    let line = sel.anchor.line;
                    let range = new vscode.Range(line, 0, line + 1, 0);
                    edit.delete(range);
                }
                else {
                    // 選択範囲を削除
                    edit.delete(sel);
                }
            });
        }
    }
    /**
     * クリップボードスロット選択
     * @param allowBlank 空行を許可する
     * @return QuickPick
     */
    showQuickPick(allowBlank, callback) {
        if (!vscode.window.activeTextEditor) {
            return null;
        }
        const editor = vscode.window.activeTextEditor;
        // メーニューを作成
        let menu = [];
        const cr = nekoaisle_1.Util.getEndOfLine(editor);
        // quickPick.selectedItems を設定しても何も起こらない
        // let selectedItem: vscode.QuickPickItem | null = null;
        for (let key in this.clipboards) {
            let item = {
                label: key,
            };
            let clipboard = this.clipboards[key];
            if (clipboard.length > 0) {
                // 保存されているので説明などを設定
                // 末尾が改行だったら除去,末尾が改行だと１行増えてしまう
                let clipboard = this.clipboards[key].map((value) => {
                    if (value.substr(-1) === "\n") {
                        value = value.slice(0, -1);
                    }
                    return value;
                });
                // 段落を連結してから行で分解
                let lines = clipboard.join(cr).split(cr);
                // lines = lines.map<string>((line) => {
                // 	return line.trim();
                // });
                // item.description = lines.join("cr");
                let desc = ""; // 最初の空でない行の先頭64文字
                lines = lines.map((line) => {
                    // 前後の空白を除去
                    line = line.trim();
                    // 説明文を抽出
                    if (desc.length === 0) {
                        if ((desc.length === 0) && (line.length !== 0)) {
                            // 最初に見つけた空行以外が説明
                            desc = line.substr(0, 64);
                        }
                    }
                    return line;
                });
                if (desc.length === 0) {
                    // 空行のみだった
                    desc = `${lines.length}行の空行`;
                }
                else if (lines.length === 1) {
                    // 1行のみ
                }
                else {
                    // 複数行
                    desc = ` ${desc} (${lines.length}行)`;
                }
                item.description = desc;
            }
            else if (!allowBlank) {
                // 空行許可が指定されていない
                continue;
            }
            menu.push(item);
            // if (key === this.lastSlot) {
            // 	// このアイテムが初期選択位置
            // 	selectedItem = item;
            // }
        }
        // QuickPick オブジェクトを作成
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = 'スロットを選択してください。';
        quickPick.items = menu;
        quickPick.matchOnDetail = false;
        quickPick.matchOnDescription = false;
        // if (selectedItem) {
        // 	quickPick.selectedItems = [selectedItem];
        // }
        // エンターを押した処理を設定
        quickPick.onDidAccept(() => {
            let editor = vscode.window.activeTextEditor;
            if (editor) {
                // アクティブエディターは必須
                let picks = quickPick.selectedItems;
                if (picks.length === 1) {
                    let slot = picks[0].label;
                    if (this.clipboards[slot]) {
                        // スロット名は有効なので実行
                        callback(slot, editor);
                        // スロット名を記憶(次回のデフォルト)
                        this.lastSlot = slot;
                    }
                }
            }
            // エンター押した場合は必ず閉じる
            quickPick.hide();
        });
        /**
         * 入力文字列が変更された処理設定
         */
        quickPick.onDidChangeValue((value) => {
            if (value.length === 0) {
                return;
            }
            let editor = vscode.window.activeTextEditor;
            if (editor) {
                // 先頭１文字を取得
                let slot = value.substr(0, 1);
                // 全角→半角に変換
                slot = this.zenToHan(slot);
                if (this.clipboards[slot]) {
                    // スロット名は有効なので実行
                    if (callback(slot, editor)) {
                        // 実行したのでクイックピックを閉じる
                        quickPick.hide();
                    }
                    // スロット名を記憶(次回のデフォルト)
                    this.lastSlot = slot;
                }
            }
        });
        // 非表示にしたら破棄設定
        quickPick.onDidHide(() => quickPick.dispose());
        // 開く
        quickPick.show();
        // 作成した QuickPick を返す
        return quickPick;
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