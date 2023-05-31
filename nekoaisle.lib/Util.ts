import * as vscode from 'vscode';
import * as chproc from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
// import { Extension } from './Extension';
import { PathInfo } from './PathInfo';
import * as crypto from 'crypto';
import { ListItem } from '../CommandMenu';
const { decycle, encycle } = require('json-cyclic');

export module Util {
  // 言語タイプごとの拡張子一覧
  //
  // console.log('enum languages');
  // vscode.languages.getLanguages().then((langs: string[]) => {
  //     langs.forEach( element => {
  //         console.log(`  ${element}`);
  //     });
  // });
  export var extensionByLanguages: { [key: string]: string; } = {
    'plaintext':   '.txt',
    'Log':         '.log',
    'bat':         '.bat',
    'c':           '.c',
    'cpp':         '.cpp',
    'css':         '.css',
    'html':        '.html',
    'ini':         '.ini',
    'java':        '.java',
    'javascript':  '.js',
    'json':        '.json',
    'perl':        '.pl',
    'php':         '.php',
    'shellscript': '.sh',
    'sql':         '.sql',
    'typescript':  '.ts',
    'vb':          '.vb',
    'xml':         '.xml',
  };

  export function getExtensionPath(filename: string) {
    return path.resolve(exports.extensionContext.extensionPath, filename);
  }

  /**
   * メッセージを出力
   * @param str 出力するメッセージ
   */
  export function putMess(str: string): string {
    for (let s of str.split('\n')) {
      vscode.window.showInformationMessage(s);
    }
    return str;
  }

  /**
   * ログを出力
   * @param str 出力する文字列
   */
  export function putLog(str: string): string {
    console.log(str);
    return str;
  }

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
  export function getClassName(obj: any): string {
    return Object.prototype.toString.call(obj).slice(8, -1);
  }

  /**
   * オブジェクトを複製
   * @param src 複製する対象
   */
  export function cloneObject(src: any): any {
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
            let key: any;
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
            } catch (e) {
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

  // 指定文字でパディング
  export function pad(str: string, pad: string, cols: number): string {
    pad = pad.repeat(cols);
    return (pad + str).slice(-cols);
  }
  export function padNum(num: number, cols: number): string {
    return pad(num.toString(), "0", cols);
  }

  /**
   * 数値を , 区切り文字列に変換
   * @param val 数値
   */
  export function formatNumber(val: number): string {
    let nf = Intl.NumberFormat();
    return nf.format(val);
  }

  /**
   * 指定文字コードの文字種を取得
   * @param c 調べる文字コード
   */
  export function getCharType(c: number): number {
    let s: string = String.fromCharCode(c);
    if ((c === 0x20) || (c === 9)) {
      // 空白
      return 1;
    } else if (c < 0x20) {
      // 制御文字
      return 0;
    } else if (/^[a-zA-Z0-9_\$@]$/.test(s)) {
      // プログラムに使う文字
      return 2;
    } else if (c < 0x100) {
      // 半角文字
      return 3;
    } else {
      // 全角文字
      return 4;
    }
  }

  /**
   * HTMLエンコード
   * @param s エンコードする文字列
   * @return string エンコードした文字列
   */
  export function encodeHtml(s: string): string {
    return s.replace(/[&\'`"<>\s]/g, function (match) {
      const dic: { [key: string]: string; } = {
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

  export function decodeHtml(s: string): string {
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

  /**
   * カーソル位置の単語の範囲を取得
   * @param editor 対象とするエディタ
   */
  export function getCursorWordRange(editor?: vscode.TextEditor, pos?: vscode.Position): vscode.Range {
    if (!editor) {
      // 省略されたら現在のエディタ
      editor = <vscode.TextEditor>vscode.window.activeTextEditor;
    }

    if (!pos) {
      // 省略されたらカーソル位置を取得
      pos = editor.selection.active;
    }
    // カーソル行を取得
    let line = editor.document.lineAt(pos.line).text;

    let s = pos.character;
    let t = Util.getCharType(line.charCodeAt(s));   // カーソル位置の文字タイプ
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

  /**
   * カーソル位置の単語を取得
   * @param editor 対象とするエディタ
   */
  export function getCursorWord(editor: vscode.TextEditor): string {
    // カーソル位置の単語の範囲を取得
    let range = getCursorWordRange(editor);
    // 単語の範囲の文字列を返す
    return editor.document.getText(range);
  }

  /**
   * カーソル位置の行を取得
   * @param editor 対象とするエディタ
   */
  export function getCursorLine(editor: vscode.TextEditor): string {
    // 単語の範囲の文字列を返す
    return editor.document.lineAt(editor.selection.active.line).text;
  }

  /**
   * 指定エディターの全テキストを置き換える
   * @param editor 処理対象
   * @param text 置き換える文字列
   */
  export function replaceAllText(editor: vscode.TextEditor, text: string) {
    editor.edit((edit) => {
      let range = new vscode.Range(0, 0, editor.document.lineCount, 0);
      edit.replace(range, text);
    });
  }

  /**
   * 指定文字列の先頭文字によって大文字・小文字を切り替える
   * @param c 対象となる文字
   * @return string 結果
   */
  export function toggleCharCase(c: string): string {
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

  /**
   * 指定文字の大文字・小文字を切り替える
   * @param c 対象となる文字
   * @param mode toggle=切り替え lower:小文字 upper:大文字
   * @return string 結果
   */
  export function changeCharCase(c: string, mode?: string): string {
    let cas = getCharCase(c);
    if (cas !== '') {
      // 変換対象文字
      if ((mode === 'togge') || (mode !== cas)) {
        // トグルは必ず、それ以外は現在と違う時変換
        if (cas === 'lower') {
          // 小文字なので大文字に変換
          c = c.toLocaleUpperCase();
        } else {
          // 大文字なので小文字に変換
          c = c.toLocaleLowerCase();
        }
      }
    }
    return c;
  }

  /**
   * キャメルケースに変換
   * スネークケースは _ で分解しそれぞれの単語の先頭を大文字に変換して結合
   * それ以外は文字列の先頭文字を大文字それ以外を小文字にします
   * @param str 
   * @return キャメルケースに変換した文字列
   */
  export function toCamelCase(str: string): string {
    let ret = [];
    for (let v of str.split('_')) {
      ret.push(v.substr(0, 1).toLocaleUpperCase() + v.substr(1).toLocaleLowerCase());
    }
    return ret.join('');
  }

  /**
   * スネークケースに変換
   * @param any string | string[] 可変長引数
   * @returns string スネークケース文字列
   */
  export function toSnakeCase(...args: (string | string[])[]): string {
    let ary: (string | string[])[] = [];
    for (let val of args) {
      if (getClassName(val) === 'Array') {
        // 配列なら再起呼び出し
        ary = ary.concat(toSnakeCase(val));
      } else {
        ary.push(val);
      }
    }
    return ary.join('_');
  }

  /**
   * 指定した文字列が大文字か小文字か調べる
   * 文字列の先頭から順に調べ最初に判定できたケースを返す
   * @param str 調べる文字列
   * @return 'upper' | 'lower | ''
   */
  export function getCharCase(str: string): string {
    for (let i = 0; i < str.length; ++i) {
      // １文字抽出
      let c = str.substr(i, 1);
      if ((c >= "A") && (c <= "Z")) {
        // 半角アルファベット大文字
        return 'upper';
      } else if ((c >= "a") && (c <= "z")) {
        // 半角アルファベット小文字
        return 'lower';
      } else if ((c >= "Ａ") && (c <= "Ｚ")) {
        // 全角アルファベット大文字
        return 'upper';
      } else if ((c >= "ａ") && (c <= "ｚ")) {
        // 全角アルファベット小文字
        return 'lower';
      }
    }

    // 最後まで判定できなかった
    return '';
  }

  /**
   * 指定エディターの改行文字を取得
   * @param edior エディタ
   * @return 改行コード
   */
  export function getEndOfLine(editor: vscode.TextEditor): string {
    let eol: string;
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

  /**
   * 選択中の文字列を取得
   * @param editor 対象とするエディタ
   */
  export function getSelectString(editor?: vscode.TextEditor): string {
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

  /**
   * 指定ポジションの文字を取得
   * @param editor 対象とするエディタ
   */
  export function getCharFromPos(editor: vscode.TextEditor, pos: vscode.Position): string {
    let line = editor.document.lineAt(pos.line).text;
    return line.substr(pos.character, 1);
  }

  /**
   * ホームディレクトリを取得
   */
  //	let homeDir: string;	// キャッシュ
  export function getHomeDir(): string {
    // if ( !homeDir ) {
    // 	homeDir = ("" + chproc.execSync('echo $HOME')).trim();
    // }
    // return homeDir;
    return os.userInfo().homedir;
  }

  /**
   * 現在のワークフォルダーを取得
   */
  export function getWorkFolder() {
    let dir: string = process.cwd();
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
        } else {
          if (vscode.workspace.workspaceFolders) {
            dir = vscode.workspace.workspaceFolders[0].uri.fsPath;
          }
        }
      }
    }
    return dir;
    // return vscode.workspace.rootPath;
  }

  /**
   * shell コマンドを実行
   * @param cmd 
   */
  export function execCmd(cmd: string): string {
    console.log(`exec ${cmd}`);
    return ("" + chproc.execSync(cmd)).trim();
  }

  /**
   * クリップボードの内容を取得
   */
  export function getClipboard() {
    return execCmd('xclip -o -selection c');
  }

  /**
   * クリップボードに設定
   * @param text 設定する文字列
   */
  export function putClipboard(text: string) {
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

  /**
   * 指定uriをブラウザーで開く
   * @param uri 開く uri
   * @param query 追加の query
   */
  export function browsURL(uri: string, query?: { [key: string]: string; } ) {
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

  /**
   * touchする
   * @param fileName ファイル名
   */
  export function touch(fileName: string): void {
    execCmd(`touch ${fileName}`);
  }

  /**
   * ファイルが存在するか調べる
   * @param path 調べるファイルの名前
   */
  export function isExistsFile(path: string): boolean {
    if (!path) {
      // ファイル名が指定されなかったときは「存在しない」を返す
      return false;
    }

    return fs.existsSync(path);
  }

  /**
   * テキストファイルの読み込み
   * @param fileName 読み込むファイル名
   * @param silent   ファイルが存在しないときにメッセージを出さない
   * @return string 読み込んだファイルの内容
   */
  export function loadFile(fileName: string, silent: boolean = false): string | null {
    console.log(`loadFile = "${fileName}"`);
    if (!isExistsFile(fileName)) {
      if (!silent) {
        putMess(`${fileName} が見つかりませんでした。`);
      }
      return null;
    }
    return fs.readFileSync(fileName, "utf-8");
  }

  /**
   * テキストファイルの保存
   * @param fileName 保存するファイル名
   * @param data 保存する内容
   */
  export function saveFile(fileName: string, data: any) {
    console.log(`saveFile = "${fileName}"`);
    return fs.writeFileSync(fileName, data);
  }

  /**
   * ファイルを削除
   * @param fileName 削除するファイル名
   */
  export function deleteFile(fileName: string) {
    console.log(`deleteFile = "${fileName}"`);
    return fs.unlinkSync(fileName);
  }

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
   * @return any
   */
  export function loadFileJson(fileName: string, silent: boolean = false): any {
    let source: string | null = Util.loadFile(fileName, silent);
    if (!source) {
      return null;
    }
    return decodeJson(source);
  }

  /**
   * JSONに変換して保存
   * @param fileName ファイル名
   * @param data 書き込むおデータ
   */
  export function saveFileJson(fileName: string, data: any) {
    let json: any = encodeJson(data);
    Util.saveFile(fileName, json);
  }

  /**
   * 文字列を json デコード
   * @param str デコードする JSON
   * @param except 例外を発生する
   */
  export function decodeJson(str: string, except?: boolean): any {
    let json;
    try {
      json = JSON.parse(str);
    } catch (err) {
      if (except) {
        throw err;
      }
      Util.putMess(`JSON.parse('${str}'): ${err}`);
    }
    return json;
  }

  /**
   * オブジェクトを json に変換
   * @param obj エンコードするオブジェクト
   * @param except 例外を発生する
   */
  export function encodeJson(obj: any, except?: boolean): any {
    let json;
    try {
      json = JSON.stringify(obj);
    } catch (err) {
      if (except) {
        throw err;
      }
      Util.putMess(`JSON.parse('${obj}'): ${err}`);
    }
    return json;
  }

  export interface SpritTagJumpNameResult {
    filename: string;
    lineNo?: number;
  }
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
  export function spritTagJumpName(name: string): SpritTagJumpNameResult {
    let result: SpritTagJumpNameResult = {
      filename: '',
    };
    // ファイル名と行番号を分離
    let res = [
      /^(.*)\(([0-9]+)\)\s*$/,   // 末尾が "(123)" or " (123)"
      /^(.*):\s*([0-9]+)\s*$/,      // 末尾が ":123" or ": 123"
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
    let line: number;
    if (reg) {
      // 行番号が指定された
      result.filename = reg[1].trim();
      result.lineNo = parseInt(reg[2]);
    } else {
      result.filename = name;
    }
    
    return result;
  }

  /**
   * タグジャンプ
   * @param value タグジャンプ文字列
   * @param pinfo 相対パス情報
   */
  export function tagJump(value: string, cwd?: string) {
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


  export interface SetCursorOption {
    x?: number;
    y?: number;
    pos?: vscode.Position;
    range?: vscode.Range;
  }

  /**
   * 指定エディターのカーソル位置を変更
   * @param args カーソル位置情報
   * @param editor エディター
   */
  export function setCursorPos(args: SetCursorOption, editor?: vscode.TextEditor) {
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
        let x: number = (option.x !== undefined) ? option.x : 0;
        // yが省略された現在行
        let y: number = (option.y !== undefined) ? option.y : editor.selection.start.line;
        // 位置を作成
        pos = new vscode.Position(y, x);
      }
      // 範囲を作成
      range = new vscode.Range(pos, pos);
    }

    editor.selection = new vscode.Selection(range.start, range.end);
    editor.revealRange(range);
  }

  /**
   * 指定ファイルを開く
   * create に true を指定するとファイルが存在しないときは作成する
   * @param fileName ファイル名
   * @param create true:新規作成する
   * @param lineNo 開いた後にジャンプする行番号(1〜)
   */
  export async function openFileSync(fileName: string, create?: boolean, lineNo?: number): Promise<boolean> {
    if (lineNo) {
      // カーソル位置は0〜
      --lineNo;
    }

    // すでに開いていればそれをアクティブに
    for (let doc of vscode.workspace.textDocuments) {
      let fn = doc.fileName;
      if (doc.fileName === fileName) {
        vscode.window.showTextDocument(doc).then((editor: vscode.TextEditor) => {
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

  /**
   * 指定ファイルを開く(廃止予定)
   * create に true を指定するとファイルが存在しないときは作成する
   * @param fileName ファイル名
   * @param create true:新規作成する
   * @param lineNo 開いた後にジャンプする行番号(1〜)
   */
  export function openFile(fileName: string, create?: boolean, lineNo?: number): boolean {
    if (lineNo) {
      // カーソル位置は0〜
      --lineNo;
    }

    // すでに開いていればそれをアクティブに
    for (let doc of vscode.workspace.textDocuments) {
      let fn = doc.fileName;
      if (doc.fileName === fileName) {
        vscode.window.showTextDocument(doc).then((editor: vscode.TextEditor) => {
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
    vscode.workspace.openTextDocument(fileName).then((doc: vscode.TextDocument) => {
      vscode.window.showTextDocument(doc).then((editor: vscode.TextEditor) => {
        // 開いた
        if (typeof lineNo === "number") {
          setCursorPos({ y: lineNo }, editor);
        }
      });
    });

    // 上記は非同期処理なのでファイルが開く前に true が返る
    return true;
  }

  /**
   * ~ で始まるときにホームディレクトリ名と置換
   * @param name 
   */
  export function normalizeHome(name: string): string {
    // ディレクトリ名が ~ で始まるときは環境変数 $HOME に置き換える
    if (name.substr(0, 1) === '~') {
      name = path.join(getHomeDir(), name.substr(1));
    }
    return name;
  }

  /**
   * パスを正規化
   * 1. 先頭の ~ を home ディレクトリに変更
   * 2. 相対パスならばを絶対パスに変更
   * 
   * @param name 正規化するパス名
   * @param cwd? カレントディレクトリ
   */
  export function normalizePath(name: string, cwd?: string): string {
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

  /**
   * 指定ドキュメントのファイル名の拡張子を取得
   * @param doc ture を指定すると先頭の . を除去します
   * @param lessDot ture を指定すると先頭の . を除去します
   */
  export function getDocumentExt(doc: vscode.TextDocument, lessDot?: boolean): string {
    // 現在編集中のファイル名情報を取得
    let pinfo = new PathInfo(doc.fileName);
    let ext : string;
    if (pinfo.info.ext) {
      // 拡張子があるのでそれを返す
      ext = pinfo.info.ext;
    } else {
      // 拡張子がないときはドキュメントの言語から拡張子を決める
      ext = extensionByLanguages[doc.languageId];
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

  /**
   * 文字列を OverviewRulerLaneのプロパティに変換
   * @param str OverviewRulerLane のプロパティ名
   */
  export function strToOverviewRulerLane(str: string): vscode.OverviewRulerLane | undefined {
      switch (str) {
          case 'Left': return vscode.OverviewRulerLane.Left;
          case 'Center': return vscode.OverviewRulerLane.Center;
          case 'Right': return vscode.OverviewRulerLane.Right;
          case 'Full': return vscode.OverviewRulerLane.Full;
          default: return undefined;
      }
  }

  /**
   * 文字列を DecorationRangeBehavior のプロパティに変換
   * @param str DecorationRangeBehavior のプロパティ名
   */
  export function strToDecorationRangeBehavior(str: string): vscode.DecorationRangeBehavior {
      switch (str) {
          case 'OpenOpen': return vscode.DecorationRangeBehavior.OpenOpen;
          case 'ClosedClosed': return vscode.DecorationRangeBehavior.ClosedClosed;
          case 'OpenClosed': return vscode.DecorationRangeBehavior.OpenClosed;
          case 'ClosedOpen': return vscode.DecorationRangeBehavior.ClosedOpen;
          default: return vscode.DecorationRangeBehavior.ClosedClosed;
      }
  }

  /**
   * ルーラーを設定
   * @param ranges ルーラーを設定する範囲
   * @param color 色を示す文字列
   * @param lane レーンを示す文字列 Left|Center|Right|Full
   * @param editor 設定するエディター
   * @return 今回設定した装飾タイプ
   */
  export function setRuler(ranges: vscode.Range[], color: string, lane: string, editor?: vscode.TextEditor): vscode.TextEditorDecorationType {
    // 装飾を作成
    let deco: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
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

  /**
   * md5 ハッシュ値を取得
   * @param src ハッシュ値を取得したい対象
   */
  export function md5(src: any): string {
    const json = JSON.stringify(decycle(src));
    const md5 = crypto.createHash('md5');
    return md5.update(json, 'binary').digest('hex');
  }

  /**
   * 指定ファイルが開かれているタブを探す
   */
  export function findTab(fullpath: string): vscode.Tab | null {

    for (let group of vscode.window.tabGroups.all) {
      for (let tab of group.tabs) {
        let input = <vscode.TabInputText><unknown>(tab.input);
        const fsPath = input?.uri.fsPath;
        if (fsPath === fullpath) {
          return tab;
        }
      }
    }
    return null;
  }

  /**
   * 指定ファイル名のタブを閉じる
   */
  export function closeEditor(fullpath: string) {
    for (let group of vscode.window.tabGroups.all) {
      for (let tab of group.tabs) {
        const fsPath = (<vscode.TabInputText><unknown>tab.input).uri?.fsPath;
        if (fsPath === fullpath) {
          vscode.window.tabGroups.close(tab);
        }
      }
    }
  }

	/**
	 * 全角文字を半角文字に変換（キー入力専用）
	 * @param zen 全角文字
	 */
	export function zenToHanForSelect(zen: string): string {
		// 変換辞書
		const zenHanDic: {[key: string]: string} = {
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
		}

		let han = '';
		for (let i = 0; i < zen.length; ++i) {
			let c = zen.charAt(i);
			if (zenHanDic[c]) {
				han += zenHanDic[c];
			} else {
				// 辞書にないのでそのまま
				han += c;
			}
		}
		return han;
	}

  export function getCharWidth(code: number) : number {
    if (code === 0x09) {
      // タブ
      let w = vscode.window.activeTextEditor?.options.tabSize ?? 4;
      w = w.toString();
      return parseInt(w);
    } else if (code < 0x100) {
      // 半角
      return 1;
    } else {
      // 全角
      return 2;
    }
  }

  /**
   * 先頭文字の重みを返す
   * @param str 
   * @returns 記号:0x0xx 数字:0x1xx 英字: 0x2xx
   */
  export function calcLabelSortWeight(str: string) : number {
    let code = str.charCodeAt(0);
    if (("0" <= str) && (str <= "9")) {
      // 数字は 0x1xx
      return code + 0x100;
    } else if (("A" <= str) && (str <= "Z")) {
      // 英字は 0x2xx
      return code + 0x200;
    } else if (("a" <= str) && (str <= "z")) {
      // 英字は 0x2xx
      return code + 0x200;
    } else {
      return code;
    }
  }

  /**
   * 小さい順の並べ替え比較値を返す
   * (引数を逆にすれば大きい順)
   */
  export function compareSort(a: any, b: any) {
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      return 0;
    }
  }
}