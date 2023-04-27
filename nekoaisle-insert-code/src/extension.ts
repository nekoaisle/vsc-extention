'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Util, Extension, PathInfo, DateInfo } from './nekoaisle.lib/nekoaisle';

export function activate(context: vscode.ExtensionContext) {
  let ext = new InsertCode(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

interface ListItem {
  label: string,          // メニューラベル
  detail?: string,        // 詳細
  description?: string,   // 説明
  filename?: string,      // ファイル名
  command?: string,       // コマンド指定
  inline?: string,        // インラインテンプレート
  position?: string,      // 挿入位置
  method?: string,        // 呼び出すeditメソッド insert, replace, snippet
  autoIndent?: boolean,   // オートインデントする？
  loop?: string,          // ループ処理方法 line
}

interface GetInsertPosResult {
  pos: vscode.Position,
  str: string,
}

interface GetCommandCache {
  now: DateInfo,
  pinfo: PathInfo,
  clipboard: string,
}

class InsertCode extends Extension {
  // 言語タイプごとの拡張子一覧
  //
  // console.log('enum languages');
  // vscode.languages.getLanguages().then((langs: string[]) => {
  //     langs.forEach( element => {
  //         console.log(`  ${element}`);
  //     });
  // });
  protected langs = {
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

  // 日時情報
  protected mNow: DateInfo;
  // 処理中に設定する変数(行ごとの値とか…)
  protected mVariable: object;
  /* 静的文字列
    keybindings.json に下記を書いたのと同等
    ,
    {
      "key": "ctrl+enter",
      "command": "type",
      "args": { "text": "<br />" },
      "when": "editorTextFocus && !editorReadonly && editorLangId == 'html'"
    }
  */
  protected mStatic = {
    br: "<br />",
  };

  /**
   * 構築
   */
  constructor(context: vscode.ExtensionContext) {
    super(context, {
      name: 'Insert Code',
      config: 'nekoaisle-insertCode',
      commands: [{
        command: 'nekoaisle.insertCode',
        callback: () => { this.entry(); }
      }, {
        command: 'nekoaisle.insertCode.pinfoBase',
        callback: () => { this.doCommandInsert('pinfo.base'); }
      }, {
        command: 'nekoaisle.insertCode.cmd',
        callback: (arg: string) => { this.doCommandInsert(arg); }
      }]
    });
  }

  /**
   * コマンドを現在のカーソル位置に挿入
   * @param cmd コマンド
   */
  protected doCommandInsert(cmd: string): void {
    let editor = vscode.window.activeTextEditor;
    let str = this.doCommand(cmd, editor);
    let pos = editor.selection.active;
    editor.edit((edit) => { edit.insert(pos, str); });
  }

  /**
   * エントリー
   */
  protected entry() {
    // 変数の初期化
    this.mVariable = {};

    // 実行されたときの TextEditor
    let editor = vscode.window.activeTextEditor;

    let pinfo = new PathInfo(editor.document.fileName);

    // テンプレートディレクトリ名を取得
    let tempDir = this.getTemplatesDir();

    // 現在編集中のファイルの拡張子を取得
    // ※新規作成の場合ファイル名が [Untitled-1] などになり拡張子がないので
    let ext = this.getCurrentExt(pinfo.info.ext);
    // 先頭の . を除去
    ext = ext.substr(1);

    let fn: string;

    // 共通メニューを読み込む
    fn = `${tempDir}/list.json`;
    let menuItems = Util.loadFileJson(fn);
    if (!menuItems) {
      return;
    }

    // この拡張子のメニューを読み込む
    fn = `${tempDir}/list-${ext}.json`;
    let items: ListItem[] = Util.loadFileJson(fn, true);
    if (items) {
      // 共通メニューに追加
      Object.assign(menuItems, items);
    }

    // QuickPickOptions 用のメニューを作成
    let menu: vscode.QuickPickItem[] = [];
    for (let key in menuItems) {
      let item: ListItem = menuItems[key];
      menu.push({
        label: (item.label) ? item.label : key,
        detail: (item.detail) ? item.detail : '',
        description: (item.description) ? item.description : ''
      });
    }

    // メニュー選択
    let options: vscode.QuickPickOptions = {
      placeHolder: '選択してください。',
      matchOnDetail: true,
      matchOnDescription: false
    };
    vscode.window.showQuickPick(menu, options).then((sel: vscode.QuickPickItem) => {
      if (!sel) {
        return;
      }
      // console.log(`command = "${sel.label}"`);
      // デフォルト値
      let item: ListItem = {
        label: '',          // メニューラベル
        detail: '',         // 詳細
        description: '',    // 説明
        filename: '',       // ファイル名
        command: '',        // コマンド指定
        inline: '',         // インラインテンプレート
        position: '',       // 挿入位置
        method: 'insert',   // 呼び出すeditメソッド insert, replace, snippet
        autoIndent: this.doAutoIndent(),
        loop: '1'
      };
      for (let key in menuItems) {
        let i = menuItems[key];
        if (i.label == sel.label) {
          // 見つけたので undefined 以外の要素を複写
          for (let k in item) {
            if (typeof i[k] != "undefined") {
              item[k] = i[k];
            }
          }
        }
      }

      // 繰り返し初期化
      let clipboard: string[] = [];
      switch (item.loop) {
        // クリップボードの行を分解して１行づつ
        case 'clipboard-line': {
          // クリップボードを取得
          let s = Util.execCmd('xclip -o -selection c');
          if (s) {
            // 改行で分解する
            clipboard = s.split(/\r?\n/);
            // 最初の１行を変数に設定
            this.mVariable['clipboard'] = clipboard.shift();
            break;
          } else {
            // クリップボードが空なので終了
            return;
          }
        }
      }

      // 挿入する文字列格納用変数
      let str: string = '';
      for (let done = false; !done;) {
        // タイプ別処理
        if (item.filename) {
          // テンプレートファイル名指定
          str += this.doFile(`${tempDir}/${item.filename}`, editor);
        } else if (item.inline) {
          // インラインテンプレート
          str += this.doInline(item.inline, editor);
        } else if (item.command) {
          // コマンド
          str += this.doCommand(item.command, editor);
        } else {
          // 処理が何も指定されていないので何もしない
          break;;
        }

        // 繰り返し処理
        switch (item.loop) {
          case 'clipboard-line': {
            if (clipboard.length > 0) {
              // 次の行をクリップボードへ
              this.mVariable['clipboard'] = clipboard.shift();
            } else {
              // 残りはないので今回で終了
              done = true;
              break;
            }
            break;
          }
          // 1回で処理を終える    
          default: {
            done = true;
            break;
          }
        }
      };

      if (str.length <= 0) {
        // 空文字列なので終了
      }

      // 挿入位置を決める
      let res: GetInsertPosResult = this.getInsertPos(item.position, str, editor);

      // 処理実行
      switch (item.method) {
        // 挿入(デフォルト動作)
        default:
        case 'insert': {
          editor.edit(edit => edit.insert(res.pos, res.str));
          break;
        }
        // ※ 置換動作してくれない＞＜；
        case 'replace': {
          editor.edit(edit => edit.replace(editor.selection, res.str));
          break;
        }
        // スニペット挿入
        case 'snippet': {
          let snippet = new vscode.SnippetString(res.str);
          editor.insertSnippet(snippet, res.pos);
          break;
        }
      }
    });
  }

  /**
   * コマンド実行
   * @param command コマンド文字列
   * @return 挿入する文字列
   */
  protected doCommand(command: string, editor: vscode.TextEditor): string {
    let cmds = command.split('.');
    return this.getCommandValue(cmds[0], cmds[1], editor);
  }

  /**
   * ファイルテンプレート処理
   * @param filename テンプレートファイル名
   * @param editor 編集するエディター
   */
  protected doFile(filename: string, editor: vscode.TextEditor): string {
    let template = Util.loadFile(filename);
    return this.fromTemplate(template, editor);
  }

  /**
   * インラインテンプレート処理
   * @param inline テンプレート文字列
   * @param editor 編集するエディター
   */
  protected doInline(inline: string, editor: vscode.TextEditor): string {
    return this.fromTemplate(inline, editor);
  }

  protected getCommandValue(cmd1: string, cmd2: string, editor: vscode.TextEditor, cache?: GetCommandCache): string {
    /**
     * クリップボードの内容を取得
     */
    const getClipboard = (): string => {
      if (!cache.clipboard) {
        cache.clipboard = Util.execCmd('xclip -o -selection c');
      }
      return cache.clipboard;
    }

    /**
     * パス情報を取得
     * @param key PathInfo.info の要素名
     */
    const getPathInfo = (key: string): string => {
      let res = '';
      if (!cache.pinfo) {
        cache.pinfo = new PathInfo(editor.document.fileName);
      }
      if (typeof cache.pinfo.info[key] != "undefined") {
        res = cache.pinfo.info[key];
      } else if (typeof cache.pinfo[key] != "undefined") {
        res = cache.pinfo[key];
      }
      return res;
    }

    /**
     * 日時情報を取得
     * @param key DateInfo の要素名
     */
    const getDateInfo = (key: string): string => {
      let res = '';
      if (!cache.now) {
        cache.now = new DateInfo();
      }
      if (typeof cache.now[key] != "undefined") {
        res = cache.now[key];
      }
      return res;
    }

    if (!cache) {
      cache = {
        now: null,
        pinfo: null,
        clipboard: null,
      };
    }

    let val: string = '';
    switch (cmd1) {
      // 編集者名
      case 'author': {
        val = this.getConfig("author", "");
        break;
      }
      // 著作権者
      case 'copyright': {
        val = this.getConfig("copyright", "");
        if (val == "") {
          val = this.getConfig("author", "");
        }
        break;
      }
      // 選択範囲    
      case 'selection': {
        val = Util.getSelectString(editor);
        break;
      }
      // クリップボードの内容    
      case 'clipboard': {
        val = getClipboard();
        break;
      }
      //     
      case 'class': {
        val = this.getClass(cmd2);
        break;
      }
      // 現在のファイル名情報    
      case 'pinfo': {
        val = getPathInfo(cmd2);
        break;
      }
      // 現在日時    
      case 'now': {
        val = getDateInfo(cmd2);
        break;
      }
      // 動的変数    
      case 'var': {
        val = this.mVariable[cmd2];
        break;
      }
      // 静的文字列    
      case 'static': {
        val = this.mStatic[cmd2];
        break;
      }    
      case 'sql-row': {
        // V_GROUP_ID      VARCHAR( 64) NOT NULL DEFAULT '' -- グループID
        let clipboard = getClipboard();
        switch (cmd2) {
          case 'name': {
            let match = /^,?\s*([^\s]+)\s+/.exec(clipboard);
            if (!match) {
              break;
            }
            if (typeof match[1] == "string") {
              val = match[1];
            }
            break;
          }
          case 'propaty': {
            let match = /^,?\s*(N|C|V|B|D)_([^\s]+)\s+/.exec(clipboard);
            if (!match) {
              break;
            }
            switch (match[1]) {
              case 'N': val = 'm_i{Name}'; break;
              case 'C':
              case 'V':
              case 'B': val = 'm_str{Name}'; break;
              case 'D':
                val = 'm_str{Name}Date';
                if (match[2].substr(-3) == '_DT') {
                  match[2] = match[2].substr(0, match[2].length - 3);
                }
                break;
              default: {
                break;
              }
            }
            if (typeof match[2] == "string") {
              val = val.replace('{Name}', Util.toCamelCase(match[2]));
            }
            break;
          }
          case 'comment': {
            let match = /-- (.*)/.exec(clipboard);
            if (!match) {
              break;
            }
            if (typeof match[1] == "string") {
              val = match[1].trim();
            }
            break;
          }
        }
        break;
      }
      // このファイルのディレクトリ一覧
      case 'ls': {
        let dir = path.dirname(editor.document.fileName);
        let files = fs.readdirSync(dir);
        let list: { [key: string]: number } = {};
        for (let file of files) {
          let name: string;
          switch (cmd2) {
            // フルパス
            case 'p': {
              list[`${dir}/${file}`] = 1;
              break;
            }
            // ディレクトリー
            case 'd': {
              list[path.dirname(file)] = 1;
              break;
            }
            // 名前のみ
            case 'b': {
              let pinfo = new PathInfo(file);
              list[pinfo.info.name] = 1;
              break;
            }
            // ファイル名
            default:
            case 'f': {
              list[path.basename(file)] = 1;
              break;
            }
            // 拡張子
            case 'e': {
              list[path.extname(file)] = 1;
              break;
            }
          }
        }
        for (let key in list) {
          val += `${key}\n`;
        }
        break;
      }
    }

    //
    return val;
  }

  /**
   * 挿入位置を取得
   * @param position 
   * @param str 
   * @param editor 
   */
  protected getInsertPos(position: string, str: string, editor: vscode.TextEditor): GetInsertPosResult {
    let pos = editor.selection.active;
    switch (position) {
      // ファイルの先頭
      case 'top':
      case 'file-start':
      case 'file-top': {
        pos = new vscode.Position(0, 0);
        break;
      }

      // ファイルの先頭
      case 'bottom':
      case 'file-end':
      case 'file-bottom': {
        pos = new vscode.Position(0, 0);
        break;
      }

      // 行頭
      case 'home':
      case 'line-start':
      case 'line-top': {
        pos = new vscode.Position(pos.line, 0);
        break;
      }

      // 行末
      case 'end':
      case 'line-end':
      case 'line-bottom': {
        pos = new vscode.Position(pos.line, editor.document.lineAt(pos.line).text.length);
        break;
      }

      // 前の行
      case 'before': {
        pos = new vscode.Position(pos.line, 0);
        if (str.substr(-1) != "\n") {
          str += "\n";
        }
        break;
      }

      // 次の行
      case 'new':
      case 'line-new':
      case 'new-line': {
        pos = new vscode.Position(pos.line + 1, 0);
        if (str.substr(-1) != "\n") {
          str += "\n";
        }
        break;
      }
    }

    // 
    return {
      pos: pos,
      str: str
    }
  }

  /**
   * テンプレートから挿入する段落を作成
   * @param editor 
   * @param tempName 
   */
  protected fromTemplate(template: string, editor: vscode.TextEditor): string {
    // 不要行の削除
    // "nekoaisle.insert-code delete line" が含まれる行を削除
    let match = template.match(/^.*\bnekoaisle\.insert-code\sdelete\sline\b.*$\r?\n?/gm);
    if (match) {
      for (let line of match) {
        template = template.replace(line, '');
      }
    }

    // テンプレート中で使用されているキーワードを抽出
    // 置換する値を準備する
    // '' や "" で括られている場合はエスケープ処理もする
    let params = this.makeParams(template, editor);

    // 置換を実行
    for (let k in params) {
      let s = k.replace(/\W/g, function (s) { return `\\${s}`; });
      let re = new RegExp(k, "g");
      template = template.replace(re, params[k]);
    }

    // 複数行ならばインデントをカーソル位置に合わせる
    if ((template.indexOf("\n") >= 0) && this.doAutoIndent()) {
      // カーソル位置を取得
      let cur = editor.selection.active;
      // カーソルの前を取得
      let tab = editor.document.lineAt(cur.line).text.substr(0, cur.character);
      // カーソルの前がホワイトスペースのみならば
      if (/\s+/.test(tab)) {
        // 改行で分解
        let rows = template.split("\n");
        // 行を合成
        template = rows.join(`\n${tab}`);
      }
    }

    // 
    return template;
  }

  /**
   * 置換用パラメータを作成
   * @param template テンプレート
   * @param editor 
   */
  protected makeParams(template: string, editor: vscode.TextEditor): object {
    // キャッシュ
    let cache = {
      pinfo: null,
      now: null,
      clipboard: null,
    }

    // テンプレート中で使用されているキーワードを抽出
    // 置換する値を準備する
    // '' や "" で括られている場合はエスケープ処理もする
    let params = new Object();
    //        let re = /('|")?({{(\w+?)(?:\.(\w+?))}})$1/g;
    let re = /('|")?({{(\w+?)(?:\.(\w+?))?}}\1)/g;
    //        1     2  3     4
    let match;
    while ((match = re.exec(template)) !== null) {
      // ex. "{{pinfo.base}}"
      // match[0] = "{{pinfo.base}}"
      // match[1] = "
      // match[2] = {{pinfo.base}}
      // match[3] = pinfo
      // match[4] = base
      if (params[match[0]]) {
        // すでに作成済み
        continue;
      }

      let val = this.getCommandValue(match[3], match[4], editor, cache);

      switch (match[1]) {
        // ダブルクオーツ付き
        case '"': {
          val = this.encodeQuotation(val, '"', editor);
          break;
        }
        // シングルクオーツ付き
        case "'": {
          val = this.encodeQuotation(val, "'", editor);
          break;
        }
        // クオーツなし
        default: {
          break;
        }
      }

      // 
      params[match[0]] = val;
    }

    // ※ '' や "" で括られているキーと括られていないキーの同時使用備え
    // キーの長い順に並べ替え
    params = this.sortKeyLength(params);

    //
    return params;
  }

  /**
   * 処理対象を指定文字でくくる
   * その際 \ はエスケープ文字として \\ に変換します
   * また、ファイルの拡張子が .php の場合で "" 括りの場合は $ も \$ とします
   * @param val 処理対象
   * @param quote くくる文字列
   * @param editor 対象エディタ
   */
  protected encodeQuotation(val: any, quote: string, editor: vscode.TextEditor): any {
    switch (typeof val) {
      // オブジェクトなら再帰呼び出し
      case 'object': {
        for (let key in val) {
          val[key] = this.encodeQuotation(val[key], quote, editor);
        }
        break;
      }
      // 文字列ならエンコード
      case 'string': {
        // \ -> \\
        val = val.replace(/\\/g, "\\\\");
        // quote をエスケープ
        val = val.replace(new RegExp(quote, 'g'), `\\${quote}`);
        if ((quote == '"') && (Util.getDocumentExt(editor.document) == '.php')) {
          // " で PHP ならば $ -> \$
          val = val.replace(/$/g, "\\$");
        }
        val = `${quote}${val}${quote}`;
        break;
      }
    }
    return val;
  }

  // キーの長い順に並べ替え
  protected sortKeyLength(target: object): object {
    // キーの抽出
    let keys = [];
    for (let k in target) {
      keys.push(k);
    }

    // キーの長さでソート
    keys.sort((a: any, b: any): number => {
      return b.length - a.length;
    });

    // 長い順に並べ替えたオブジェクトを再作成
    let sorted = new Object();
    for (let k of keys) {
      sorted[k] = target[k];
    }

    return sorted;
  }

  /**
   * ファイル名からクラス名などを作成
   * @param propaty 'cpp' や 'sql' などクラス名の作成方法
   */
  protected getClass(propaty: string): string {
    let editor = vscode.window.activeTextEditor;
    let pinfo = new PathInfo(editor.document.fileName);

    let ret: string = '';
    switch (propaty) {
      // CPSS トランザクション用ベースクラス
      case 'base': {
        let name = pinfo.info.name;
        // 名前の末尾が数字ならば除去
        for (; ;) {
          let c = name.substr(-1);
          if ((c < '0') && (c > '9')) {
            break;
          }
          name = name.substr(0, name.length - 1);
        };
        ret = Util.toCamelCase(name) + 'Base';
        break;
      }
      // C++ クラス名
      case 'cpp': {
        ret = pinfo.info.name;
        break;
      }
      // SQL テーブル名
      case 'sql': {
        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;
        for (let l = 0; l < doc.lineCount; ++l) {
          let str = doc.lineAt(0).text;
          let res = /CREATE\sTABLE\s([0-9A-Z_]+)/i.exec(str);
          if (res && res[0]) {
            // 見つけた
            ret = res[0];
            break;
          }
        }
        if (!ret) {
          // CREATE TABLE が見つからなかったのでファイル名から
          ret = pinfo.info.name;
        }
        break;
      }
    }

    return ret;
  }

  /**
   * テンプレート格納ディレクトリ名を取得
   * @return テンプレート格納ディレクトリ名
   */
  protected getTemplatesDir(): string {
    // デフォルトのテンポラリディレクトリ名
    let tempDir = this.joinExtensionRoot("templates");

    // settings.json よりテンプレートディレクトリを取得
    tempDir = this.getConfig("tempDir", tempDir);

    // 先頭の ~ を置換
    tempDir = Util.normalizePath(tempDir);

    //
    return tempDir;
  }

  /**
   * 現在編集中のファイルの拡張子を取得
   * @param ext すでに拡張子を取得済みなら指定する
   * @return 拡張子
   */
  protected getCurrentExt(ext?: string): string {
    if (typeof ext == undefined) {
      // 拡張子が省略されたので現在のファイル名から取得
      let pinfo = new PathInfo(vscode.window.activeTextEditor.document.fileName);
      let now = new DateInfo();

      // テンプレートディレクトリ名を取得
      let tempDir = this.getTemplatesDir();

      let ext = pinfo.info.ext;
    }

    if (!ext) {
      // 拡張子がないときはこのドキュメントの言語から拡張子を決める
      let lang = vscode.window.activeTextEditor.document.languageId;
      ext = this.langs[lang];
      console.log(`languageId = "${lang}", file.ext = "${ext}"`);
    }

    return ext;
  }

  /**
   * オートインデントする？
   * vsc のオートインデントがONの場合2行目移行が2重にインデントされてしまう
   */
  protected doAutoIndent(): boolean {
    // エディターの autoIndent が true ならばインデントしない
    let config = vscode.workspace.getConfiguration('editor');
    let editorOption = config.get("autoIndent", true);
    if (editorOption) {
      return false;
    }

    // 自身の設定を取得
    return this.getConfig("autoIndent", true);
  }
}