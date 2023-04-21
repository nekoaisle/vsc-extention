"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
const vscode = require("vscode");
const chproc = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const url = require("url");
// import { Extension } from './Extension';
const PathInfo_1 = require("./PathInfo");
var Util;
(function (Util) {
    // 言語タイプごとの拡張子一覧
    //
    // console.log('enum languages');
    // vscode.languages.getLanguages().then((langs: string[]) => {
    //     langs.forEach( element => {
    //         console.log(`  ${element}`);
    //     });
    // });
    Util.extensionByLanguages = {
        'plaintext': '.txt',
        'Log': '.log',
        'bat': '.bat',
        'c': '.c',
        'cpp': '.cpp',
        'css': '.css',
        'html': '.html',
        'ini': '.ini',
        'java': '.java',
        'javascript': '.js',
        'json': '.json',
        'perl': '.pl',
        'php': '.php',
        'shellscript': '.sh',
        'sql': '.sql',
        'typescript': '.ts',
        'vb': '.vb',
        'xml': '.xml',
    };
    function getExtensionPath(filename) {
        return path.resolve(exports.extensionContext.extensionPath, filename);
    }
    Util.getExtensionPath = getExtensionPath;
    /**
     * メッセージを出力
     * @param str 出力するメッセージ
     */
    function putMess(str) {
        for (let s of str.split('\n')) {
            vscode.window.showInformationMessage(s);
        }
        return str;
    }
    Util.putMess = putMess;
    /**
     * ログを出力
     * @param str 出力する文字列
     */
    function putLog(str) {
        console.log(str);
        return str;
    }
    Util.putLog = putLog;
    /**
     * 指定オブジェクトのクラス名を取得
     *  String
     *  Number
     *  Boolean
     *  Date
     *  Error
     *  Array
     *  Function
     *  RegExp
     *  Object
     * @param obj クラス名を知りたいオブジェクト
     * @return string
     */
    function getClassName(obj) {
        return Object.prototype.toString.call(obj).slice(8, -1);
    }
    Util.getClassName = getClassName;
    /**
     * オブジェクトを複製
     * @param src 複製する対象
     */
    function cloneObject(src) {
        let dst;
        switch (typeof src) {
            default: {
                dst = src;
                break;
            }
            case 'object':
            case 'function': {
                switch (getClassName(src)) {
                    case 'Object': {
                        //自作クラスはprototype継承される
                        dst = Object.create(Object.getPrototypeOf(src));
                        for (let key in src) {
                            dst[key] = cloneObject(src[key]);
                        }
                        break;
                    }
                    case 'Array': {
                        dst = Array();
                        let key;
                        for (key in src) {
                            dst[key] = cloneObject(src[key]);
                        }
                        break;
                    }
                    case 'Function': {
                        //ネイティブ関数オブジェクトはcloneできないのでnullを返す;
                        try {
                            var anonymous;
                            eval('dst = ' + src.toString());
                        }
                        catch (e) {
                            dst = null;
                        }
                        break;
                    }
                    case 'Date': {
                        dst = new Date(src.valueOf());
                        break;
                    }
                    case 'RegExp': {
                        dst = new RegExp(src.valueOf());
                        break;
                    }
                }
                break;
            }
        }
        //
        return dst;
    }
    Util.cloneObject = cloneObject;
    // 指定文字でパディング
    function pad(str, pad, cols) {
        pad = pad.repeat(cols);
        return (pad + str).slice(-cols);
    }
    Util.pad = pad;
    function padNum(num, cols) {
        return pad(num.toString(), "0", cols);
    }
    Util.padNum = padNum;
    /**
     * 数値を , 区切り文字列に変換
     * @param val 数値
     */
    function formatNumber(val) {
        let nf = Intl.NumberFormat();
        return nf.format(val);
    }
    Util.formatNumber = formatNumber;
    /**
     * 指定文字コードの文字種を取得
     * @param c 調べる文字コード
     */
    function getCharType(c) {
        let s = String.fromCharCode(c);
        if ((c === 0x20) || (c === 9)) {
            // 空白
            return 1;
        }
        else if (c < 0x20) {
            // 制御文字
            return 0;
        }
        else if (/^[a-zA-Z0-9_\$@]$/.test(s)) {
            // プログラムに使う文字
            return 2;
        }
        else if (c < 0x100) {
            // 半角文字
            return 3;
        }
        else {
            // 全角文字
            return 4;
        }
    }
    Util.getCharType = getCharType;
    /**
     * HTMLエンコード
     * @param s エンコードする文字列
     * @return string エンコードした文字列
     */
    function encodeHtml(s) {
        return s.replace(/[&\'`"<>\s]/g, function (match) {
            const dic = {
                '&': '&amp;',
                "'": '&#x27;',
                '`': '&#x60;',
                '"': '&quot;',
                '<': '&lt;',
                '>': '&gt;',
                ' ': '&nbsp;',
                '\r\n': '<br />\r\n',
                '\r': '<br />\r',
                '\n': '<br />\n',
            };
            return dic[match];
        });
    }
    Util.encodeHtml = encodeHtml;
    function decodeHtml(s) {
        return s
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, '\'')
            .replace(/&#044;/g, ',')
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ')
            .replace(/<br(\s*\/)?>(\r\n)?/g, '\r\n');
    }
    Util.decodeHtml = decodeHtml;
    /**
     * カーソル位置の単語の範囲を取得
     * @param editor 対象とするエディタ
     */
    function getCursorWordRange(editor, pos) {
        if (!editor) {
            // 省略されたら現在のエディタ
            editor = vscode.window.activeTextEditor;
        }
        if (!pos) {
            // 省略されたらカーソル位置を取得
            pos = editor.selection.active;
        }
        // カーソル行を取得
        let line = editor.document.lineAt(pos.line).text;
        let s = pos.character;
        let t = Util.getCharType(line.charCodeAt(s)); // カーソル位置の文字タイプ
        while ((s > 0) && (t === Util.getCharType(line.charCodeAt(s - 1)))) {
            --s;
        }
        // 単語の終わりを探す
        let e = s;
        while ((e < line.length) && (t === Util.getCharType(line.charCodeAt(e)))) {
            ++e;
        }
        let start = new vscode.Position(pos.line, s);
        let end = new vscode.Position(pos.line, e);
        return new vscode.Range(start, end);
    }
    Util.getCursorWordRange = getCursorWordRange;
    /**
     * カーソル位置の単語を取得
     * @param editor 対象とするエディタ
     */
    function getCursorWord(editor) {
        // カーソル位置の単語の範囲を取得
        let range = getCursorWordRange(editor);
        // 単語の範囲の文字列を返す
        return editor.document.getText(range);
    }
    Util.getCursorWord = getCursorWord;
    /**
     * カーソル位置の行を取得
     * @param editor 対象とするエディタ
     */
    function getCursorLine(editor) {
        // 単語の範囲の文字列を返す
        return editor.document.lineAt(editor.selection.active.line).text;
    }
    Util.getCursorLine = getCursorLine;
    /**
     * 指定エディターの全テキストを置き換える
     * @param editor 処理対象
     * @param text 置き換える文字列
     */
    function replaceAllText(editor, text) {
        editor.edit((edit) => {
            let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
            edit.replace(range, text);
        });
    }
    Util.replaceAllText = replaceAllText;
    /**
     * 指定文字列の先頭文字によって大文字・小文字を切り替える
     * @param c 対象となる文字
     * @return string 結果
     */
    function toggleCharCase(c) {
        switch (getCharCase(c)) {
            case 'upper':
                c = c.toLocaleLowerCase();
                break;
            case 'lower':
                c = c.toLocaleUpperCase();
                break;
        }
        return c;
    }
    Util.toggleCharCase = toggleCharCase;
    /**
     * 指定文字の大文字・小文字を切り替える
     * @param c 対象となる文字
     * @param mode toggle=切り替え lower:小文字 upper:大文字
     * @return string 結果
     */
    function changeCharCase(c, mode) {
        let cas = getCharCase(c);
        if (cas !== '') {
            // 変換対象文字
            if ((mode === 'togge') || (mode !== cas)) {
                // トグルは必ず、それ以外は現在と違う時変換
                if (cas === 'lower') {
                    // 小文字なので大文字に変換
                    c = c.toLocaleUpperCase();
                }
                else {
                    // 大文字なので小文字に変換
                    c = c.toLocaleLowerCase();
                }
            }
        }
        return c;
    }
    Util.changeCharCase = changeCharCase;
    /**
     * キャメルケースに変換
     * スネークケースは _ で分解しそれぞれの単語の先頭を大文字に変換して結合
     * それ以外は文字列の先頭文字を大文字それ以外を小文字にします
     * @param str
     * @return キャメルケースに変換した文字列
     */
    function toCamelCase(str) {
        let ret = [];
        for (let v of str.split('_')) {
            ret.push(v.substr(0, 1).toLocaleUpperCase() + v.substr(1).toLocaleLowerCase());
        }
        return ret.join('');
    }
    Util.toCamelCase = toCamelCase;
    /**
     * スネークケースに変換
     * @param any string | string[] 可変長引数
     * @returns string スネークケース文字列
     */
    function toSnakeCase(...args) {
        let ary = [];
        for (let val of args) {
            if (getClassName(val) === 'Array') {
                // 配列なら再起呼び出し
                ary = ary.concat(toSnakeCase(val));
            }
            else {
                ary.push(val);
            }
        }
        return ary.join('_');
    }
    Util.toSnakeCase = toSnakeCase;
    /**
     * 指定した文字列が大文字か小文字か調べる
     * 文字列の先頭から順に調べ最初に判定できたケースを返す
     * @param str 調べる文字列
     * @return 'upper' | 'lower | ''
     */
    function getCharCase(str) {
        for (let i = 0; i < str.length; ++i) {
            // １文字抽出
            let c = str.substr(i, 1);
            if ((c >= "A") && (c <= "Z")) {
                // 半角アルファベット大文字
                return 'upper';
            }
            else if ((c >= "a") && (c <= "z")) {
                // 半角アルファベット小文字
                return 'lower';
            }
            else if ((c >= "Ａ") && (c <= "Ｚ")) {
                // 全角アルファベット大文字
                return 'upper';
            }
            else if ((c >= "ａ") && (c <= "ｚ")) {
                // 全角アルファベット小文字
                return 'lower';
            }
        }
        // 最後まで判定できなかった
        return '';
    }
    Util.getCharCase = getCharCase;
    /**
     * 指定エディターの改行文字を取得
     * @param edior エディタ
     * @return 改行コード
     */
    function getEndOfLine(editor) {
        let eol;
        switch (editor.document.eol) {
            // UNIX
            case vscode.EndOfLine.LF:
            default:
                eol = "\n";
                break;
            // DOS
            case vscode.EndOfLine.CRLF:
                eol = "\r\n";
                break;
        }
        return eol;
    }
    Util.getEndOfLine = getEndOfLine;
    /**
     * 選択中の文字列を取得
     * @param editor 対象とするエディタ
     */
    function getSelectString(editor) {
        if (!editor) {
            // editor が省略されたので現在のエディタ
            editor = vscode.window.activeTextEditor;
            if (!editor) {
                return '';
            }
        }
        let range = editor.selection;
        return editor.document.getText(range);
    }
    Util.getSelectString = getSelectString;
    /**
     * 指定ポジションの文字を取得
     * @param editor 対象とするエディタ
     */
    function getCharFromPos(editor, pos) {
        let line = editor.document.lineAt(pos.line).text;
        return line.substr(pos.character, 1);
    }
    Util.getCharFromPos = getCharFromPos;
    /**
     * ホームディレクトリを取得
     */
    //	let homeDir: string;	// キャッシュ
    function getHomeDir() {
        // if ( !homeDir ) {
        // 	homeDir = ("" + chproc.execSync('echo $HOME')).trim();
        // }
        // return homeDir;
        return os.userInfo().homedir;
    }
    Util.getHomeDir = getHomeDir;
    /**
     * 現在のワークフォルダーを取得
     */
    function getWorkFolder() {
        let dir = process.cwd();
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let uri = editor.document.uri;
            if (uri) {
                if (vscode.workspace['getWorkspaceFolder']) {
                    let folder = vscode.workspace['getWorkspaceFolder'](uri);
                    if (folder) {
                        uri = folder.uri;
                        dir = uri.path;
                    }
                }
                else {
                    if (vscode.workspace.workspaceFolders) {
                        dir = vscode.workspace.workspaceFolders[0].uri.fsPath;
                    }
                }
            }
        }
        return dir;
        // return vscode.workspace.rootPath;
    }
    Util.getWorkFolder = getWorkFolder;
    /**
     * shell コマンドを実行
     * @param cmd
     */
    function execCmd(cmd) {
        console.log(`exec ${cmd}`);
        return ("" + chproc.execSync(cmd)).trim();
    }
    Util.execCmd = execCmd;
    /**
     * クリップボードの内容を取得
     */
    function getClipboard() {
        return execCmd('xclip -o -selection c');
    }
    Util.getClipboard = getClipboard;
    /**
     * クリップボードに設定
     * @param text 設定する文字列
     */
    function putClipboard(text) {
        // 一時ファイルに保存
        let dir = os.tmpdir();
        let rand = Math.floor(Math.random() * 1000000000);
        let fn = path.join(dir, `nekoaisle.${rand}`);
        saveFile(fn, text);
        // コマンド実行
        execCmd(`xclip -i -selection c ${fn}`);
        // 一時ファイルを削除
        deleteFile(fn);
    }
    Util.putClipboard = putClipboard;
    /**
     * 指定uriをブラウザーで開く
     * @param uri 開く uri
     * @param query 追加の query
     */
    function browsURL(uri, query) {
        // uri をパース
        let urlInfo = url.parse(uri, true);
        // query を追加
        if (query) {
            if (typeof urlInfo.query !== "object") {
                urlInfo.query = {};
            }
            for (let key in query) {
                urlInfo.query[key] = query[key];
            }
        }
        // パースしたURIを文字列にする
        uri = url.format(urlInfo);
        // Chromium を実行
        // Util.execCmd(`chromium-browser '${uri}'`);
        // コマンド実行
        vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(uri));
        // 外部で開く
        // vscode.env.openExternal(vscode.Uri.parse(uri));
    }
    Util.browsURL = browsURL;
    /**
     * touchする
     * @param fileName ファイル名
     */
    function touch(fileName) {
        execCmd(`touch ${fileName}`);
    }
    Util.touch = touch;
    /**
     * ファイルが存在するか調べる
     * @param path 調べるファイルの名前
     */
    function isExistsFile(path) {
        if (!path) {
            // ファイル名が指定されなかったときは「存在しない」を返す
            return false;
        }
        return fs.existsSync(path);
    }
    Util.isExistsFile = isExistsFile;
    /**
     * テキストファイルの読み込み
     * @param fileName 読み込むファイル名
     * @param silent   ファイルが存在しないときにメッセージを出さない
     * @return string 読み込んだファイルの内容
     */
    function loadFile(fileName, silent = false) {
        console.log(`loadFile = "${fileName}"`);
        if (!isExistsFile(fileName)) {
            if (!silent) {
                putMess(`${fileName} が見つかりませんでした。`);
            }
            return null;
        }
        return fs.readFileSync(fileName, "utf-8");
    }
    Util.loadFile = loadFile;
    /**
     * テキストファイルの保存
     * @param fileName 保存するファイル名
     * @param data 保存する内容
     */
    function saveFile(fileName, data) {
        console.log(`saveFile = "${fileName}"`);
        return fs.writeFileSync(fileName, data);
    }
    Util.saveFile = saveFile;
    /**
     * ファイルを削除
     * @param fileName 削除するファイル名
     */
    function deleteFile(fileName) {
        console.log(`deleteFile = "${fileName}"`);
        return fs.unlinkSync(fileName);
    }
    Util.deleteFile = deleteFile;
    /**
     * ファイルをゴミ箱に移動(非同期です)
     *
     * ここに入れてしまうとすべてのプロジェクトでlibraryが必要になるので
     * コピペして使ってください。
     * ※これを使うには
     * $ npm install trash
     * import * as trash from 'trash';
     *
     * @param fileName 削除するファイル名
     */
    // export function trashFile(fileName: string) {
    // trash(fileName).then(() => {
    //   console.log(`deleteFile = "${fileName}"`);
    // });
    // }
    /**
     * JSONファイルを読み込む
     * @param fileName ファイル名
     * @param silent   ファイルが存在しないときにメッセージを出さない
     * @return オブジェクト
     */
    function loadFileJson(fileName, silent = false) {
        let source = Util.loadFile(fileName, silent);
        if (!source) {
            return null;
        }
        return decodeJson(source);
    }
    Util.loadFileJson = loadFileJson;
    /**
     * JSONに変換して保存
     * @param fileName ファイル名
     * @param data 書き込むおデータ
     */
    function saveFileJson(fileName, data) {
        let json = encodeJson(data);
        Util.saveFile(fileName, json);
    }
    Util.saveFileJson = saveFileJson;
    /**
     * 文字列を json デコード
     * @param str デコードする JSON
     * @param except 例外を発生する
     */
    function decodeJson(str, except) {
        let json;
        try {
            json = JSON.parse(str);
        }
        catch (err) {
            if (except) {
                throw err;
            }
            Util.putMess(`JSON.parse('${str}'): ${err}`);
        }
        return json;
    }
    Util.decodeJson = decodeJson;
    /**
     * オブジェクトを json に変換
     * @param obj エンコードするオブジェクト
     * @param except 例外を発生する
     */
    function encodeJson(obj, except) {
        let json;
        try {
            json = JSON.stringify(obj);
        }
        catch (err) {
            if (except) {
                throw err;
            }
            Util.putMess(`JSON.parse('${obj}'): ${err}`);
        }
        return json;
    }
    Util.encodeJson = encodeJson;
    /**
     * タグジャンプ文字列をファイル名と行番号に分解
     * ex.
     * cpss/ope/abcd.php(123)
     * cpss/ope/abcd.php (123)
     * cpss/ope/abcd.php:123
     * cpss/ope/abcd.php: 123
     * /var/www/ragdoll/campt/libcampt/CamptPageOpe.php on line 591
     * @param name タグジャンプ文字列
     * @return タグジャンプ情報
     */
    function spritTagJumpName(name) {
        let result = {
            filename: '',
        };
        // ファイル名と行番号を分離
        let res = [
            /^(.*)\(([0-9]+)\)\s*$/,
            /^(.*):\s*([0-9]+)\s*$/,
            /^(.*) on line ([0-9]+)\s*$/, // 末尾が " on line 591"
        ];
        let reg = null;
        for (let re of res) {
            reg = re.exec(name);
            if (reg) {
                // 一致した
                break;
            }
        }
        let line;
        if (reg) {
            // 行番号が指定された
            result.filename = reg[1].trim();
            result.lineNo = parseInt(reg[2]);
        }
        else {
            result.filename = name;
        }
        return result;
    }
    Util.spritTagJumpName = spritTagJumpName;
    /**
     * タグジャンプ
     * @param value タグジャンプ文字列
     * @param pinfo 相対パス情報
     */
    function tagJump(value, cwd) {
        // ファイル名と行番号に分割
        let tagJump = Util.spritTagJumpName(value);
        // ファイル名を正規化
        // 絶対パスならそのまま
        // ~から始まるときは $HOME に置換
        // 相対ディレクトリのときはこのファイルのディレクトリからの相対
        tagJump.filename = Util.normalizePath(tagJump.filename, cwd);
        // ファイルを開く
        openFile(tagJump.filename, true, tagJump.lineNo);
    }
    Util.tagJump = tagJump;
    /**
     * 指定エディターのカーソル位置を変更
     * @param args カーソル位置情報
     * @param editor エディター
     */
    function setCursorPos(args, editor) {
        // エディターが省略されたらアクティブエディタ
        if (!editor) {
            editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
        }
        // 現在のカーソル位置
        let option = Util.cloneObject(args);
        let range = option.range;
        if (range === undefined) {
            // レンジは指定されていない
            let pos = option.pos;
            if (pos === undefined) {
                // x が省略されたら0
                let x = (option.x !== undefined) ? option.x : 0;
                // yが省略された現在行
                let y = (option.y !== undefined) ? option.y : editor.selection.start.line;
                // 位置を作成
                pos = new vscode.Position(y, x);
            }
            // 範囲を作成
            range = new vscode.Range(pos, pos);
        }
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range);
    }
    Util.setCursorPos = setCursorPos;
    /**
     * 指定ファイルを開く
     * create に true を指定するとファイルが存在しないときは作成する
     * @param fileName ファイル名
     * @param create true:新規作成する
     * @param lineNo 開いた後にジャンプする行番号(1〜)
     */
    async function openFileSync(fileName, create, lineNo) {
        if (lineNo) {
            // カーソル位置は0〜
            --lineNo;
        }
        // すでに開いていればそれをアクティブに
        for (let doc of vscode.workspace.textDocuments) {
            let fn = doc.fileName;
            if (doc.fileName === fileName) {
                vscode.window.showTextDocument(doc).then((editor) => {
                    // 開いた
                    if (typeof lineNo === "number") {
                        setCursorPos({ y: lineNo }, editor);
                    }
                });
                return true;
            }
        }
        if (!isExistsFile(fileName)) {
            // ファイルが存在しない
            if (!create) {
                // 新規構築しないが指定されている
                return false;
            }
            // 新規作成
            touch(fileName);
        }
        // 新たに開く
        let doc = await vscode.workspace.openTextDocument(fileName);
        let editor = await vscode.window.showTextDocument(doc);
        // 開いたのでカーソル位置を設定
        if (typeof lineNo === "number") {
            setCursorPos({ y: lineNo }, editor);
        }
        return true;
    }
    Util.openFileSync = openFileSync;
    /**
     * 指定ファイルを開く(廃止予定)
     * create に true を指定するとファイルが存在しないときは作成する
     * @param fileName ファイル名
     * @param create true:新規作成する
     * @param lineNo 開いた後にジャンプする行番号(1〜)
     */
    function openFile(fileName, create, lineNo) {
        if (lineNo) {
            // カーソル位置は0〜
            --lineNo;
        }
        // すでに開いていればそれをアクティブに
        for (let doc of vscode.workspace.textDocuments) {
            let fn = doc.fileName;
            if (doc.fileName === fileName) {
                vscode.window.showTextDocument(doc).then((editor) => {
                    // 開いた
                    if (typeof lineNo === "number") {
                        setCursorPos({ y: lineNo }, editor);
                    }
                });
                return true;
            }
        }
        if (!isExistsFile(fileName)) {
            // ファイルが存在しない
            if (!create) {
                // 新規構築しないが指定されている
                return false;
            }
            // 新規作成
            touch(fileName);
        }
        // 新たに開く
        vscode.workspace.openTextDocument(fileName).then((doc) => {
            vscode.window.showTextDocument(doc).then((editor) => {
                // 開いた
                if (typeof lineNo === "number") {
                    setCursorPos({ y: lineNo }, editor);
                }
            });
        });
        // 上記は非同期処理なのでファイルが開く前に true が返る
        return true;
    }
    Util.openFile = openFile;
    /**
     * ~ で始まるときにホームディレクトリ名と置換
     * @param name
     */
    function normalizeHome(name) {
        // ディレクトリ名が ~ で始まるときは環境変数 $HOME に置き換える
        if (name.substr(0, 1) === '~') {
            name = path.join(getHomeDir(), name.substr(1));
        }
        return name;
    }
    Util.normalizeHome = normalizeHome;
    /**
     * パスを正規化
     * 1. 先頭の ~ を home ディレクトリに変更
     * 2. 相対パスならばを絶対パスに変更
     *
     * @param name 正規化するパス名
     * @param cwd? カレントディレクトリ
     */
    function normalizePath(name, cwd) {
        // スキーマがあれば何もしない
        // ※ php://stdout 対策
        if (name.indexOf('://') >= 0) {
            return name;
        }
        // ~ で始まるときは環境変数 $HOME に置き換える
        name = normalizeHome(name);
        // 絶対パスに変換
        if (!cwd) {
            cwd = '.';
        }
        name = path.resolve(cwd, name);
        // 
        return name;
    }
    Util.normalizePath = normalizePath;
    /**
     * 指定ドキュメントのファイル名の拡張子を取得
     * @param doc ture を指定すると先頭の . を除去します
     * @param lessDot ture を指定すると先頭の . を除去します
     */
    function getDocumentExt(doc, lessDot) {
        // 現在編集中のファイル名情報を取得
        let pinfo = new PathInfo_1.PathInfo(doc.fileName);
        let ext;
        if (pinfo.info.ext) {
            // 拡張子があるのでそれを返す
            ext = pinfo.info.ext;
        }
        else {
            // 拡張子がないときはドキュメントの言語から拡張子を決める
            ext = Util.extensionByLanguages[doc.languageId];
            if (!ext) {
                return "";
            }
        }
        // 先頭の . を除去
        if (lessDot) {
            ext = ext.substr(1);
        }
        //
        return ext;
    }
    Util.getDocumentExt = getDocumentExt;
    /**
     * 文字列を OverviewRulerLaneのプロパティに変換
     * @param str OverviewRulerLane のプロパティ名
     */
    function strToOverviewRulerLane(str) {
        switch (str) {
            case 'Left': return vscode.OverviewRulerLane.Left;
            case 'Center': return vscode.OverviewRulerLane.Center;
            case 'Right': return vscode.OverviewRulerLane.Right;
            case 'Full': return vscode.OverviewRulerLane.Full;
            default: return undefined;
        }
    }
    Util.strToOverviewRulerLane = strToOverviewRulerLane;
    /**
     * 文字列を DecorationRangeBehavior のプロパティに変換
     * @param str DecorationRangeBehavior のプロパティ名
     */
    function strToDecorationRangeBehavior(str) {
        switch (str) {
            case 'OpenOpen': return vscode.DecorationRangeBehavior.OpenOpen;
            case 'ClosedClosed': return vscode.DecorationRangeBehavior.ClosedClosed;
            case 'OpenClosed': return vscode.DecorationRangeBehavior.OpenClosed;
            case 'ClosedOpen': return vscode.DecorationRangeBehavior.ClosedOpen;
            default: return vscode.DecorationRangeBehavior.ClosedClosed;
        }
    }
    Util.strToDecorationRangeBehavior = strToDecorationRangeBehavior;
    /**
     * ルーラーを設定
     * @param ranges ルーラーを設定する範囲
     * @param color 色を示す文字列
     * @param lane レーンを示す文字列 Left|Center|Right|Full
     * @param editor 設定するエディター
     * @return 今回設定した装飾タイプ
     */
    function setRuler(ranges, color, lane, editor) {
        // 装飾を作成
        let deco = vscode.window.createTextEditorDecorationType({
            overviewRulerColor: color,
            overviewRulerLane: strToOverviewRulerLane(lane),
        });
        // 装飾を設定
        if (!editor) {
            editor = vscode.window.activeTextEditor;
        }
        if (editor) {
            editor.setDecorations(deco, ranges);
        }
        // 今回設定した装飾タイプを返す
        return deco;
    }
    Util.setRuler = setRuler;
})(Util = exports.Util || (exports.Util = {}));
//# sourceMappingURL=Util.js.map