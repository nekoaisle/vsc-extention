/**
 * 選択範囲をエンコード
 *
 * filename:  extension.ts
 *
 * @package
 * @version   1.0.0
 * @copyright Copyright (C) 2017 Yoshio Kiya All rights reserved.
 * @date      2017-08-23
 * @author    木屋善夫
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
const expr_eval_1 = require("expr-eval");
const querystring_1 = require("querystring");
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
;
;
/**
 * 選択範囲をエンコード
 */
class MyExtention extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: '選択範囲をエンコード',
            config: 'nekoaisle-encode',
            commands: (() => {
                // 戻り値
                let cmds = [];
                // メニューコマンド
                cmds.push({
                    // メニュー表示
                    command: 'nekoaisle.encode',
                    callback: () => { this.menu(); }
                });
                // 任意の文字列で括るコマンド
                cmds.push({
                    command: 'nekoaisle.enclose',
                    callback: (arg) => {
                        this.enclose(arg.start, arg.end);
                    }
                });
                // 機能を登録
                for (let data of MyExtention.commandInfo) {
                    if (!data.funcName) {
                        continue;
                    }
                    // コールバックを作成
                    let callback;
                    switch (data.funcName) {
                        // エンコーダー
                        case 'encodeJob': {
                            callback = () => {
                                let cmd = data.args;
                                this.encodeJob(cmd);
                            };
                            break;
                        }
                        // デコーダー
                        case 'decodeJob': {
                            callback = () => {
                                let cmd = data.args;
                                this.decodeJob(cmd);
                            };
                            break;
                        }
                        // エンクロージャ
                        case 'enclose': {
                            callback = () => {
                                let left = data.args[0];
                                let right = data.args[1];
                                this.enclose(left, right);
                            };
                            break;
                        }
                    }
                    // 登録するコマンド作成
                    cmds.push({
                        command: data.vscCommand,
                        callback: callback,
                    });
                }
                return cmds;
            })()
        });
    }
    /**
     * メニューから選択して実行
     */
    menu() {
        // メニューを作成
        let menu = [];
        for (let data of MyExtention.commandInfo) {
            menu.push({
                label: data.label,
                description: data.description,
            });
        }
        // ファイルを選択
        let popt = {
            placeHolder: 'エンコードの種類を選択してください。',
        };
        vscode.window.showQuickPick(menu, popt)
            .then((sel) => {
            let editor = vscode.window.activeTextEditor;
            switch (sel.label) {
                case "''":
                    this.enclose("'", "'");
                    return;
                case '""':
                    this.enclose('"', '"');
                    return;
                case '``':
                    this.enclose('`', '`');
                    return;
                case '()':
                    this.enclose('(', ')');
                    return;
                case '[]':
                    this.enclose('[', ']');
                    return;
                case '{}':
                    this.enclose('{', '}');
                    return;
                case '{{}}':
                    this.enclose('{{', '}}');
                    return;
                case '/**/':
                    this.enclose('/*', '*/');
                    return;
                case '<!-- -->':
                    this.enclose('<!-- ', ' -->');
                    return;
                case '<div class="">':
                    this.enclose('<div class="">\n', '\n</div>');
                    return;
            }
            let cmd = sel.label.split(' ');
            switch (cmd[1]) {
                case '':
                default:
                case 'encode': {
                    this.encodeJob(cmd[0]);
                    break;
                }
                case 'decode': {
                    this.decodeJob(cmd[0]);
                    break;
                }
            }
        });
    }
    /**
     * すべてのカーソル位置をエンコードする
     * @param type 変換名
     */
    encodeJob(type) {
        let editor = vscode.window.activeTextEditor;
        let datas = [];
        for (let r of editor.selections) {
            let range = nekoaisle_1.Util.cloneObject(r);
            let str;
            if (!range.isEmpty) {
                // 範囲選択されているのでそれを対象とする
                str = editor.document.getText(range);
            }
            else {
                // // 範囲選択されていないのでクリップボード
                // str = Util.getClipboard();
                // // 範囲選択されていないのでカーソル位置の単語
                switch (type) {
                    // 式の時は式に使える文字列
                    case "eval": {
                        str = editor.document.lineAt(range.anchor.line).text;
                        str = this.getExpression(str, range.anchor.character);
                        break;
                    }
                    // カーソル位置の単語
                    default: {
                        // カーソル位置の単語の範囲を取得
                        let wordRange = nekoaisle_1.Util.getCursorWordRange(editor, range.start);
                        // 単語の範囲の文字列を返す
                        str = editor.document.getText(wordRange);
                    }
                }
            }
            // エンコードする
            str = this.encode(str, type);
            // 処理を配列に保存
            datas.push({
                range: range,
                str: str,
            });
        }
        // 結果に置換
        this.syncReplace(editor, datas);
    }
    /**
     * すべてのカーソル位置をデコードする
     * @param type 変換名
     * @param editor 対象エディター
     */
    decodeJob(type) {
        let editor = vscode.window.activeTextEditor;
        let datas = [];
        for (let range of editor.selections) {
            let str;
            if (!range.isEmpty) {
                // 範囲選択されているのでそれを対象とする
                str = editor.document.getText(range);
            }
            else {
                // // 範囲選択されていないのでクリップボード
                // str = Util.getClipboard();
                // // 範囲選択されていないのでカーソル位置の単語
                // カーソル位置の単語の範囲を取得
                let r = nekoaisle_1.Util.getCursorWordRange(editor, range.start);
                // 単語の範囲の文字列を返す
                str = editor.document.getText(r);
            }
            // デコードする
            str = this.decode(str, type, editor);
            // 処理を配列に保存
            datas.push({
                range: range,
                str: str,
            });
        }
        // 結果に置換
        this.syncReplace(editor, datas);
    }
    /**
     * 指定文字列をエンコードする
     * @param str 対象文字列
     * @param type 変換方法
     * @param editor 対象エディター
     */
    encode(str, type) {
        // 変換
        switch (type) {
            // toUpperCase
            case 'toUpperCase':
                str = str.toLocaleUpperCase();
                break;
            // toLoweCase
            case 'toLowerCase':
                str = str.toLocaleLowerCase();
                break;
            // HTML encode
            case 'HTML':
                str = nekoaisle_1.Util.encodeHtml(str);
                break;
            // URL encode
            case 'URL':
                str = encodeURIComponent(str);
                break;
            // BASE64
            case 'BASE64':
                str = new Buffer(str).toString('base64');
                break;
            // C言語文字列
            case 'c-string':
                str = this.encodeCString(str);
                break;
                ;
            // 正規表現
            case 'preg':
                str = this.encodePreg(str);
                break;
            // ""囲み文字列
            case '"':
                str = str.replace(/\\/g, '\\\\');
                str = str.replace(/"/g, '\\"');
                break;
            // ''囲み文字列
            case "'":
                str = str.replace(/\\/g, '\\\\');
                str = str.replace(/'/g, "\\'");
                break;
            // ``囲み文字列
            case "\u0060":
                str = str.replace(/\u0060/g, "\\u0060");
                break;
            // \n -> <br />
            case '<br>': {
                str = str.replace(/(<br(\str*\/)?>)?(\r?\n)/gi, '<br />\n');
                break;
            }
            // 日時文字列をUNIXTIMEに変換	
            case 'UNIXTIME': {
                let ux = Date.parse(str) / 1000;
                str = '' + ux;
                break;
            }
            // ASCIIコードに変換	
            case 'ASCII': {
                let a = [];
                for (let i = 0; i < str.length; ++i) {
                    a.push("0x" + str.charCodeAt(i).toString(16));
                }
                str = a.join(', ');
                break;
            }
            // キャメルケースに変換	
            case 'Camel': {
                let a = [];
                for (let s of str.split("_")) {
                    a.push(s.substr(0, 1).toLocaleUpperCase() + s.substr(1).toLocaleLowerCase());
                }
                str = a.join('');
                break;
            }
            // スネークケースに変換
            case 'Snake': {
                let a = [];
                let re = /[A-Z][^A-Z]*/g;
                let m;
                while (m = re.exec(str)) {
                    a.push(m[0].toLocaleLowerCase());
                }
                str = a.join('_');
                break;
            }
            // 式を評価
            case 'eval': {
                try {
                    str = expr_eval_1.Parser.evaluate(str).toString();
                }
                catch (e) {
                    str = "error!";
                }
                break;
            }
            // 10進数を16進数に変換
            case 'Hex': {
                let n = parseInt(str, 10);
                str = n.toString(16);
                break;
            }
            // 10進数を2進数に変換
            case 'Bit': {
                let n = parseInt(str, 10);
                str = n.toString(2);
                break;
            }
        }
        return str;
    }
    /**
     * 指定文字列をデコードする
     * @param str 対象文字列
     * @param type 変換方法
     * @param editor 対象エディター
     */
    decode(str, type, editor) {
        // 変換
        switch (type) {
            // HTML encode
            case 'HTML':
                str = nekoaisle_1.Util.decodeHtml(str);
                break;
            // URL encode
            case 'URL':
                str = decodeURIComponent(str);
                break;
            // BASE64
            case 'BASE64':
                str = new Buffer(str, 'base64').toString();
                break;
            // C言語文字列
            case 'c-string':
                str = this.decodeCString(str);
                break;
            // 正規表現
            case 'preg':
                str = this.decodePreg(str);
                break;
            // ""囲み文字列
            case '"': {
                str = str.replace(/\\"/g, '"');
                str = str.replace(/\\\\"/g, '\\');
                break;
            }
            // ''囲み文字列
            case "'": {
                str = str.replace(/\\'/g, "'");
                str = str.replace(/\\\\"/g, '\\');
                break;
            }
            // ``囲み文字列
            case "\\u0060": {
                str = str.replace(/\\u0060/g, "\u0060");
                break;
            }
            // \n -> <br />
            case '<br>': {
                str = str.replace(/(<br(\str*\/)?>)(\r?\n)?/gi, '\n');
                break;
            }
            // UNIXTIME を日時文字列に変換
            case 'UNIXTIME': {
                let di = new nekoaisle_1.DateInfo(parseInt(str, 10) * 1000);
                str = di.ymdhis;
                break;
            }
            // 16進数を10進数に変換
            case 'Hex': {
                let n = parseInt(str, 16);
                str = n.toString(10);
                break;
            }
            // 2進数を10進数に変換
            case 'Bit': {
                let n = parseInt(str, 2);
                str = n.toString(10);
                break;
            }
        }
        return str;
    }
    /**
     * C言語用文字列にエンコード
     * @param s エンコードする文字列
     */
    encodeCString(s) {
        return s.replace(/[\\\x00-\x1f]|/g, (s) => {
            const tbl = {
                0x00: '\\0',
                0x07: '\\a',
                0x08: '\\b',
                0x09: '\\t',
                0x0a: '\\n',
                0x0b: '\\v',
                0x0c: '\\f',
                0x0d: '\\r',
                '\\': '\\\\' // \
            };
            let c = s.charCodeAt(0);
            if (tbl[c]) {
                // 制御コード
                s = tbl[c];
            }
            return s;
        });
    }
    /**
     * C言語用文字列をデコードする
     * @param s デコードする文字列
     */
    decodeCString(s) {
        return s.replace(/\\(?:([0-7]+)|x([0-9a-fA-F]+)|(.))/g, (s, p1, p2, p3) => {
            if (p1) {
                // ８進数
                s = String.fromCharCode(parseInt(p1, 8));
            }
            else if (p2) {
                // １６進数
                s = String.fromCharCode(parseInt(p2, 16));
            }
            else if (p3) {
                // \に続く１文字
                const tbl = {
                    'a': '\x07',
                    'b': '\x08',
                    't': '\x09',
                    'n': '\x0a',
                    'v': '\x0b',
                    'f': '\x0c',
                    'r': '\x0d', // M CR   復帰
                };
                if (tbl[p3]) {
                    s = tbl[p3];
                }
                else {
                    s = p3;
                }
            }
            return s;
        });
    }
    /**
     * 正規表現構文の特殊文字の前にバックスラッシュを挿入します。
     * @param s エンコードする文字列
     */
    encodePreg(s) {
        let r = '';
        for (let i = 0; i < s.length; ++i) {
            let c = s.substr(i, 1);
            if ('.\\+*?[^]$(){}=!<>|:-/'.indexOf(c) >= 0) {
                c = '\\' + c;
            }
            r += c;
        }
        return r;
    }
    /**
     * 正規表現構文のエスケープシーケンスのバックスラッシュを取り除きます
     * @param s デコードする文字列
     */
    decodePreg(s) {
        return s.replace(/\\(.)/g, (s, p1) => {
            return p1;
        });
    }
    /**
     * 選択範囲もしくはカーソル位置の単語を指定文字で括る
     * @param start 開始文字
     * @param end 終了文字
     */
    // protected encloseAll(start: string, end: string) {
    // 	// カーソル位置の単語の範囲を取得
    // 	let editor = vscode.window.activeTextEditor;
    // 	let sels = editor.selections;
    // 	let newSels: vscode.Selection[];
    // 	for (let key in sels) {
    // 		let sels = this.enclose(start, end);
    // 		newSels.push(sels);
    // 	}
    // 	editor.selections = newSels;
    // }
    enclose(start, end) {
        // 現在のカーソルを後ろから順に並べ替える
        // 置換で文字数が変わると以降のカーソル位置がずれるので後ろから処理する
        // @@todo 本来この処理は syncReplace() にて行うべき
        // @@todo 上記の現象を回避するため syncReplace と syncInsert は統合する必要がある
        const editor = vscode.window.activeTextEditor;
        // editor.selections は readonly なのでクローンしてからソート
        let sels = [];
        for (let sel of editor.selections) {
            sels.push(sel);
        }
        sels.sort((a, b) => {
            if (a.start.line < b.start.line) {
                return 1;
            }
            else if (a.start.line > b.start.line) {
                return -1;
            }
            else if (a.start.character < b.start.character) {
                return 1;
            }
            else if (a.start.character > b.start.character) {
                return -1;
            }
            else {
                return 0;
            }
        });
        // 全カーソルについて処理
        let ary = [];
        let sel2 = [];
        for (let sel of sels) {
            ary.push(this.encloseSub(sel, start, end, editor));
            // カーソル位置を開始文字数分戻す
            sel2.push(new vscode.Selection(sel.start.translate(0, -start.length), sel.end.translate(0, -start.length)));
        }
        // 編集実行
        this.syncReplace(editor, ary);
        // 選択範囲を設定
        editor.selections = sel2;
    }
    encloseSub(sel, start, end, editor) {
        let range;
        let newSel;
        let ret;
        if (sel.start.isEqual(sel.end)) {
            // 範囲選択されていないのでカーソル位置の単語の範囲を取得
            range = nekoaisle_1.Util.getCursorWordRange(editor, sel.active);
        }
        else {
            // 範囲選択されているのでその範囲を対象とする
            range = new vscode.Range(sel.start, sel.end);
        }
        // 対象となる文字列取得
        let word = editor.document.getText(range);
        // まずはこの文字列がすでに括られているかチェック
        if ((word.substr(0, start.length) == start) && (word.substr(-end.length) == end)) {
            // 括られているので外す
            word = word.substr(start.length, word.length - (start.length + end.length));
            //				editor.edit(edit => edit.replace(range, word));
            ret = { range: range, str: word };
        }
        else {
            // 括られた中身だけを選択している場合の対応
            // １文字ずつ前後に広げる
            let outRange;
            try {
                outRange = new vscode.Range(range.start.translate(0, -start.length), range.end.translate(0, end.length));
                let outWord = editor.document.getText(outRange);
                if ((outWord.substr(0, start.length) == start) && (outWord.substr(-end.length) == end)) {
                    // すでに括られているの外す
                    //						editor.edit(edit => edit.replace(outRange, word));
                    ret = { range: outRange, str: word };
                    //				newSel = new vscode.Selection(outRange.start, outRange.end);
                }
                else {
                    // 括られていないので括る
                    //						editor.edit(edit => edit.replace(range, `${start}${word}${end}`));
                    ret = { range: range, str: `${start}${word}${end}` };
                }
            }
            catch (err) {
                // 範囲を広げられなかったということは括られていない
                // 括られていないので括る
                //					editor.edit(edit => edit.replace(range, `${start}${word}${end}`));
                ret = { range: range, str: `${start}${word}${end}` };
            }
        }
        //
        return ret;
    }
    /**
     * 指定行の指定位置付近の式を取得
     * @param str 行
     * @param pos
     * @return 式
     */
    getExpression(str, x) {
        // カーソル位置直前のホワイトスペースをスキップ
        let c;
        do {
            c = str.charAt(x - 1);
            if (" \t=".indexOf(c) < 0) {
                // ホワイトスペースや = 以外なのでこの位置
                break;
            }
            // 起点を1文字前へ
            --x;
            // = 以外ならループ
        } while (c !== "=");
        // 開始位置と終了位置を探す
        const chars = "01234567890abcdefghijklmnopqrstuvwxyz.+-*/%&|^(),!?[]<> \t";
        let s = x;
        while (s > 0) {
            let c = str.charAt(s - 1).toLowerCase();
            if (chars.indexOf(c) < 0) {
                // 開始位置発見
                break;
            }
            // 開始位置を1文字前へ
            --s;
        }
        let e = x;
        while (e < querystring_1.stringify.length) {
            if (chars.indexOf(str.charAt(e)) < 0) {
                // 終了位置発見
                break;
            }
            // 終了位置を1文字前へ
            ++e;
        }
        return str.substring(s, e);
    }
}
/**
 * 機能データー
 */
MyExtention.commandInfo = [
    // 変換
    {
        label: '=== 変換 =======================================',
    }, {
        // 大文字
        vscCommand: 'nekoaisle.toUpperCase',
        funcName: 'encodeJob',
        args: 'toUpperCase',
        label: 'toUpperCase',
        description: '大文字に変換',
    }, {
        // 小文字
        vscCommand: 'nekoaisle.toLowerCase',
        funcName: 'encodeJob',
        args: 'toLowerCase',
        label: 'toLowerCase',
        description: '小文字に変換',
    }, {
        // 文字をASCIIコードに変換
        vscCommand: 'nekoaisle.encodeASCII',
        funcName: 'encodeJob',
        args: "ASCII",
        label: 'ASCII',
        description: '文字をASCIIコードに変換',
    }, {
        // キャメルケースに変換
        vscCommand: 'nekoaisle.encodeCamel',
        funcName: 'encodeJob',
        args: "Camel",
        label: 'Camel',
        description: 'キャメルケースに変換',
    }, {
        // スネークケースに変換
        vscCommand: 'nekoaisle.encodeSnake',
        funcName: 'encodeJob',
        args: "Snake",
        label: 'Snake',
        description: 'スネークケースに変換',
    }, {
        // 式を評価
        vscCommand: 'nekoaisle.encodeEval',
        funcName: 'encodeJob',
        args: "eval",
        label: 'eval',
        description: '式を計算結果に変換',
    },
    // 以下エンコード
    {
        label: '=== エンコード ====================================',
    }, {
        // HTML エンコード
        vscCommand: 'nekoaisle.encodeHtml',
        funcName: 'encodeJob',
        args: 'HTML',
        label: 'HTML',
        description: '特殊文字を HTML エンティティに変換する',
    }, {
        // URL エンコード
        vscCommand: 'nekoaisle.encodeUrl',
        funcName: 'encodeJob',
        args: 'URL',
        label: 'URL',
        description: '文字列を URL エンコードする',
    }, {
        // BASE64 エンコード
        vscCommand: 'nekoaisle.encodeBase64',
        funcName: 'encodeJob',
        args: 'BASE64',
        label: 'BASE64',
        description: 'MIME base64 方式でデータをエンコードする',
    }, {
        // C言語文字列
        vscCommand: 'nekoaisle.encodeCString',
        funcName: 'encodeJob',
        args: 'c-string',
        label: 'c-string',
        description: 'C 言語と同様にスラッシュで文字列をクォートする',
    }, {
        // 正規表現
        vscCommand: 'nekoaisle.encodePreg',
        funcName: 'encodeJob',
        args: 'preg',
        label: 'preg',
        description: '正規表現文字をクオートする',
    }, {
        // '' の中身
        vscCommand: 'nekoaisle.encodeContentsOfSingleQuotation',
        funcName: 'encodeJob',
        args: "'",
        label: "'",
        description: "' を \\' にする",
    }, {
        // "" の中身
        vscCommand: 'nekoaisle.encodeContentsOfDoubleQuotation',
        funcName: 'encodeJob',
        args: "'",
        label: '"',
        description: '" を \\" にする',
    }, {
        // UNIXTIME
        vscCommand: 'nekoaisle.encodeContentsOfUnixtime',
        funcName: 'encodeJob',
        args: "UNIXTIME",
        label: 'UNIXTIME',
        description: '日時文字列をUNIXTIMEに変換',
    }, {
        // \n -> <br />
        vscCommand: 'nekoaisle.encodeBr',
        funcName: 'encodeJob',
        args: "<br>",
        label: '<br>',
        description: '\\n を <br />\\n にする',
    }, {
        // 16進数
        vscCommand: 'nekoaisle.encodeHex',
        funcName: 'encodeJob',
        args: "Hex",
        label: 'Hex',
        description: '10進数を16進数に変換',
    }, {
        // 2進数
        vscCommand: 'nekoaisle.encodeBit',
        funcName: 'encodeJob',
        args: "Bit",
        label: 'Bit',
        description: '10進数を2進数に変換',
    },
    // 以下デコード
    {
        label: '=== デコード =====================================',
    }, {
        // HTML デコード
        vscCommand: 'nekoaisle.decodeHtml',
        funcName: 'decodeJob',
        args: 'HTML',
        label: 'HTML decode',
        description: 'HTML エンティティを適切な文字に変換する',
    }, {
        // URL デコード
        vscCommand: 'nekoaisle.decodeUrl',
        funcName: 'decodeJob',
        args: 'URL',
        label: 'URL decode',
        description: 'URL エンコードされた文字列をデコードする',
    }, {
        // BASE64 デコード
        vscCommand: 'nekoaisle.decodeBase64',
        funcName: 'decodeJob',
        args: 'BASE64',
        label: 'BASE64 decode',
        description: 'MIME base64 方式によりエンコードされたデータをデコードする',
    }, {
        // C言語文字列
        vscCommand: 'nekoaisle.decodeCString',
        funcName: 'decodeJob',
        args: 'c-string',
        label: 'c-string decode',
        description: 'C 言語文字列をアンクォートする',
    }, {
        // 正規表現
        vscCommand: 'nekoaisle.decodePreg',
        funcName: 'decodeJob',
        args: 'preg',
        label: 'preg decode',
        description: '正規表現文字をアンクオートする',
    }, {
        // '' の中身
        vscCommand: 'nekoaisle.decodeContentsOfSingleQuotation',
        funcName: 'decodeJob',
        args: "'",
        label: "' decode",
        description: "\\' を ' にする",
    }, {
        // "" の中身
        vscCommand: 'nekoaisle.decodeContentsOfDoubleQuotation',
        funcName: 'decodeJob',
        args: "'",
        label: '" decode',
        description: '\\" を " にする',
    }, {
        // UNIXTIME
        vscCommand: 'nekoaisle.decodeContentsOfUnixtime',
        funcName: 'decodeJob',
        args: "UNIXTIME",
        label: 'UNIXTIME decode',
        description: 'UNIXTIMEを日時文字列に変換',
    }, {
        // UNIXTIME
        vscCommand: 'nekoaisle.decodeBr',
        funcName: 'decodeJob',
        args: "<br>",
        label: '<br> decode',
        description: '<br /> を \\n にする',
    }, {
        // 16進数
        vscCommand: 'nekoaisle.decodeHex',
        funcName: 'decodeJob',
        args: "Hex",
        label: 'Hex decode',
        description: '16進数を10進数に変換',
    }, {
        // 2進数
        vscCommand: 'nekoaisle.decodeBit',
        funcName: 'decodeJob',
        args: "Bit",
        label: 'Bit decode',
        description: '2進数を10進数に変換',
    },
    // 以下 enclose
    {
        label: '=== 括り =======================================',
    }, {
        // '' 括り
        vscCommand: 'nekoaisle.encloseInSingleQuotation',
        funcName: 'enclose',
        args: ["'", "'"],
        label: "''",
        description: '\' で単語または選択範囲を括る/外す',
    }, {
        // "" 括り
        vscCommand: 'nekoaisle.encloseInDoubleQuotation',
        funcName: 'enclose',
        args: ['"', '"'],
        label: '""',
        description: '" で単語または選択範囲を括る/外す',
    }, {
        // `` 括り
        vscCommand: 'nekoaisle.encloseInGraveAccent',
        funcName: 'enclose',
        args: ['\u0060', '\u0060'],
        label: '``',
        description: '\u0060 で単語または選択範囲を括る/外す',
    }, {
        // () 括り
        vscCommand: 'nekoaisle.encloseParenthesis',
        funcName: 'enclose',
        args: ['(', ')'],
        label: '()',
        description: '() で単語または選択範囲を括る/外す',
    }, {
        // [] 括り
        vscCommand: 'nekoaisle.encloseSquareBracket',
        funcName: 'enclose',
        args: ['[', ']'],
        label: '[]',
        description: '[] で単語または選択範囲を括る/外す',
    }, {
        // <> 括り
        vscCommand: 'nekoaisle.encloseAngleBracket',
        funcName: 'enclose',
        args: ['<', '>'],
        label: '<>',
        description: '<> で単語または選択範囲を括る/外す',
    }, {
        // {} 括り
        vscCommand: 'nekoaisle.encloseCurlyBracket',
        funcName: 'enclose',
        args: ['{', '}'],
        label: '{}',
        description: '{} で単語または選択範囲を括る/外す',
    }, {
        // {{}} 括り
        vscCommand: 'nekoaisle.encloseDoubleCurlyBracket',
        funcName: 'enclose',
        args: ['{{', '}}'],
        label: '{{}}',
        description: '{{}} で単語または選択範囲を括る/外す',
    }, {
        // /**/ 括り
        vscCommand: 'nekoaisle.encloseCComment',
        funcName: 'enclose',
        args: ['/*', '*/'],
        label: '/**/',
        description: '/**/ で単語または選択範囲を括る/外す',
    }, {
        // <!-- --> 括り
        vscCommand: 'nekoaisle.encloseHtmlComment',
        funcName: 'enclose',
        args: ['<!-- ', ' -->'],
        label: '<!-- -->',
        description: 'HTML コメント/外す',
    }, {
        // <div class=""></div> 括り
        vscCommand: 'nekoaisle.encloseHtmlDiv',
        funcName: 'enclose',
        args: ['<div class="">\n', '\n</div>'],
        label: '<div class="">',
        description: '<div class=""></div> で単語または選択範囲を括る/外す',
    }
];
//# sourceMappingURL=extension.js.map