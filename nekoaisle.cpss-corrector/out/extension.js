/**
 * CPSSコンバーター
 *
 * filename:  extension.ts
 *
 * @package
 * @version   1.0.0
 * @copyright Copyright (C) 2019 Yoshio Kiya All rights reserved.
 * @date      2019-11-28
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
 * CPSSコンバーター
 */
class MyExtention extends Extension_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'CPSSソース訂正',
            config: 'nekoaisle-cpssCorrector',
            commands: [
                {
                    command: 'nekoaisle.cpssCorrector',
                    callback: () => { this.onExec(); }
                },
                {
                    command: 'nekoaisle.cpssCorrector-header',
                    callback: () => { this.onHeader(); }
                },
                {
                    command: 'nekoaisle.cpssCorrector-control',
                    callback: () => { this.onControl(); }
                },
                {
                    command: 'nekoaisle.cpssCorrector-paren',
                    callback: () => { this.onParen(); }
                },
                {
                    command: 'nekoaisle.cpssCorrector-mulrem',
                    callback: () => { this.onMultiLineRem(); }
                }
            ]
        });
    }
    /**
     * すべて実行
     */
    onExec() {
        this.correctJob([
            (text) => { return this.header(text); },
            (text) => { return this.control(text); },
            (text) => { return this.paren(text); },
        ]);
    }
    /**
     * メソッドヘッダー
     */
    onHeader() {
        this.correctJob([
            (text) => { return this.header(text); },
        ]);
    }
    /**
     * 制御構造
     */
    onControl() {
        this.correctJob([
            (text) => { return this.control(text); },
        ]);
    }
    /**
     * 丸括弧
     */
    onParen() {
        this.correctJob([
            (text) => { return this.paren(text); },
        ]);
    }
    /**
     * 複数行コメント
     * @param text
     */
    onMultiLineRem() {
        this.correctJob([
            (text) => { return this.multiLineRem(text); },
        ]);
    }
    /**
     * 関数ヘッダー
     */
    header(text) {
        // メソッドヘッダー修正
        text = this.correctMethodHeader(text);
        // インデントなしのコメントを処理(クラスヘッダーとグローバル変数)
        text = this.correctRem(text, "");
        // コメント
        let re = new RegExp("^(\t+)//=== ([^=]*)=*$\n", "gm");
        text = text.replace(re, "$1// $2\n");
        // //=
        re = new RegExp("^(\t+)//=+\s*$\n", "gm");
        text = text.replace(re, "$1//\n");
        //
        return text;
    }
    /**
     * 制御構造
     */
    control(text) {
        // 制御構造修正
        text = this.correctControl(text, 'if');
        text = this.correctElse(text, 'else');
        text = this.correctElif(text, 'else if');
        text = this.correctElif(text, 'catch');
        text = this.correctControl(text, 'switch');
        text = this.correctControl(text, 'while');
        // foreach ※for の前に処理
        text = this.correctControl(text, 'foreach');
        text = this.correctControl(text, 'for');
        text = this.correctDo(text, 'do');
        text = this.correctDo(text, 'try');
        //
        return text;
    }
    /**
     * 丸括弧
     */
    paren(text) {
        // () の修正
        text = this.correctParen(text);
        //
        return text;
    }
    /**
     * 複数行コメント
     */
    multiLineRem(text) {
        text = this.correctMultiLineRem(text);
        return text;
    }
    /**
     *
     * @param jobs
     */
    correctJob(jobs) {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (editor.selection.isEmpty) {
            // 全テキストの取得
            let text = editor.document.getText();
            // 処理の実行
            for (let job of jobs) {
                text = job(text);
            }
            // テキストを差し替える
            Util_1.Util.replaceAllText(editor, text);
        }
        else {
            // 選択範囲あり
            for (let sel of editor.selections) {
                // テキストの取得
                let text = editor.document.getText(sel);
                // 処理の実行
                for (let job of jobs) {
                    text = job(text);
                }
                // テキストを差し替える
                editor.edit((edit) => {
                    edit.replace(sel, text);
                });
            }
        }
    }
    /**
     * メソッドのヘッダーを修正
     */
    correctMethodHeader(text) {
        let re, mid;
        // セクションタイトルを削除
        re = new RegExp("^\t//=+$\n\t//!@name .*$\n\t//=+$\n", "gm");
        text = text.replace(re, "");
        // 不要な行の削除
        text = text.replace(new RegExp("^\t//@{$\n", "gm"), "");
        text = text.replace(new RegExp("^\t//@}$\n", "gm"), "");
        // @retval 修正
        re = new RegExp("@retval", "gm");
        text = text.replace(re, "@return");
        // クラスメンバーのヘッダー
        text = this.correctRem(text, "\t"); // 本当は \\t にしたいのだが…
        //
        return text;
    }
    /**
     * コメントを変換
     * @param text 処理対象
     * @param pre 行頭の文字列
     */
    correctRem(text, pre) {
        let re = new RegExp(`(^${pre}//=+$\n)+(${pre}//!.*$\n)+(${pre}//=+$\n)+`, "mg");
        let mid = new RegExp(`^${pre}//\!`);
        let midLen = pre.length + 3;
        let conv = text;
        let res;
        while ((res = re.exec(text)) !== null) {
            // 一致した全体
            let search = res[0];
            let replace = "";
            let lines = search.split("\n");
            // 最初の行
            replace += `${pre}/**\n`;
            // 最後の行の１つ前まで
            for (let i = 1; i < lines.length - 1; ++i) {
                let line = lines[i];
                if (line.match(mid)) {
                    // //! だったので * に変換
                    line = line.substr(midLen);
                    replace += `${pre} *${line}\n`;
                }
            }
            // 最後の行
            replace += `${pre} */\n`;
            conv = conv.replace(search, replace);
        }
        return conv;
    }
    /**
     * // 複数行を変換
     * @param text 対象文字列
     * @return 処理後の文字列
     */
    correctMultiLineRem(text) {
        let re = new RegExp("(^\t+//.*\n){3,}", "gm");
        let res;
        while ((res = re.exec(text)) !== null) {
            // 一致した全体取得
            let org = res[0];
            // 改行文字で分解
            let ary = org.split("\n");
            // 末尾の空行を除去
            ary.pop();
            if (ary[0].match(/^\t+\/\/\s*$/)) {
                // 先頭 // の後ろが空だったので除去
                ary.shift();
            }
            if (ary[ary.length - 1].match(/^\t+\/\/\s*$/)) {
                // 末尾 // の後ろが空だったので除去
                ary.pop();
            }
            // "//" を " *" に変換
            for (let k in ary) {
                ary[k] = ary[k].replace(/^(\t+)\/\//, "$1 *");
            }
            // TAB 数を取得
            let re2 = new RegExp(/^(\t+)/);
            let res2 = re2.exec(ary[0]);
            let tab = "\t";
            if (res2 !== null) {
                tab = res2[1];
            }
            // 前後にコメントマークを追加
            ary.unshift(tab + '/**');
            ary.push(tab + ' */');
            // 配列を連結
            let rep = "";
            for (let l of ary) {
                rep += l + "\n";
            }
            // 置換
            text = text.replace(org, rep);
        }
        //
        return text;
    }
    /**
     * () を校正
     * @param text 処理対象
     * @return 処理後の文字列
     */
    correctParen(text) {
        // '( ' -> '(' 開き括弧の後ろのスペースを除去
        text = text.replace(/\(\s+/g, '(');
        // ' )' -> ')' 閉じ括弧の前のスペースを除去
        text = text.replace(/\s+\)/g, ')');
        //
        return text;
    }
    /**
     * 制御構造の {} の位置補正
     * @param text 処理対象テキスト
     * @param control 制御構造名
     */
    correctControl(text, control) {
        let re = new RegExp(`^(\t+)${control}\\s*\\((.*)\\)\\s*\n\t+{\\s*\n`, 'gm');
        text = text.replace(re, `\$1${control} ($2) {\n`);
        return text;
    }
    /**
     * elseの {} の位置補正
     * @param text 処理対象テキスト
     * @param control 制御構造名
     */
    correctElse(text, control) {
        let re = new RegExp(`}\\s*\n\t+${control}\\s*\n\t+{\\s*\n`, 'gm');
        text = text.replace(re, `\} ${control} {\n`);
        return text;
    }
    /**
     * else if の {} の位置補正
     * @param text 処理対象テキスト
     * @param control 制御構造名
     */
    correctElif(text, control) {
        let re = new RegExp(`}\\s*\n\t+${control}\\s*\\((.*)\\)\\s*\n\t+{\\s*\n`, 'gm');
        text = text.replace(re, `\} ${control} ($1) {\n`);
        return text;
    }
    /**
     * do の {} の位置補正
     * @param text 処理対象テキスト
     * @param control 制御構造名
     */
    correctDo(text, control) {
        let re = new RegExp(`^(\t+)${control}\\s*\n\t+{\\s*\n`, 'gm');
        text = text.replace(re, `\$1${control} {\n`);
        return text;
    }
}
//# sourceMappingURL=extension.js.map