'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const chproc = require("child_process");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
const iconv = require("iconv-lite");
function activate(context) {
    let ext = new CpssWizard(context);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
/**
 * オプションの定義
 */
class Options {
    /**
     * 構築
     * @param config 設定オブジェクト
     */
    constructor(config, defaults) {
        // モード
        this.mode = ''; // CpssWizerd.php に与えるモジュール名
        this.title = ''; // CpssWizerd.php に与えるタイトル
        this.name = ''; // テンプレートファイルのベース名
        this.sqlFile = ''; // SQL ファイル名
        this.module = ''; // 一括時のモジュール名
        this.fileName = ''; // 出力ファイル名
        this.htmls = []; // html出力ディレクトリ名
        // ファイル名
        // package.json の contributes.configuration.properties.cpssWizard.wizard を設定したらユーザー定義がなくてもデフォルト値を使ってくれなくなった＞＜；
        // let wizard = config.get('wizard', defaults.wizard);
        let wizard = config.get('wizard', '');
        if (wizard == '') {
            wizard = defaults.wizard;
        }
        this.wizard = nekoaisle_1.Util.normalizePath(defaults.wizard);
        // テンプレート格納ディレクトリ名
        let templateDir = config.get('templateDir', defaults.templateDir);
        if (templateDir == '') {
            templateDir = defaults.templateDir;
        }
        this.templateDir = nekoaisle_1.Util.normalizePath(templateDir);
        //
        this.sqlDir = nekoaisle_1.Util.normalizePath(config.get('sqlDir', defaults.sqlDir));
        if (!fs.existsSync(this.sqlDir)) {
            this.sqlDir = nekoaisle_1.Util.normalizePath('~/');
        }
        this.php = nekoaisle_1.Util.normalizePath(config.get('php', defaults.php));
        this.outFile = nekoaisle_1.Util.normalizePath(config.get('outFile', defaults.outFile));
        this.charset = config.get('charset', defaults.charset);
        // 
        this.author = config.get('author', defaults.author);
    }
}
;
/**
 * 必ず解決(resolve)するプロミス
 */
function resolveSurelyPrimise(str) {
    return new Promise((resolve, reject) => {
        resolve(str);
    });
}
exports.resolveSurelyPrimise = resolveSurelyPrimise;
/**
 * 必ず拒否(reject)するプロミス
 */
function rejectSurelyPrimise(str) {
    return new Promise((resolve, reject) => {
        reject(str);
    });
}
exports.rejectSurelyPrimise = rejectSurelyPrimise;
class CpssWizard extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'Cpss Wizard',
            config: 'nekoaisle-cpssWizard',
            commands: [
                {
                    command: 'nekoaisle.cpssWizard',
                    callback: () => {
                        this.entry();
                    }
                }
            ]
        });
        // メニューに対応するモードとファイル名
        this.modeInfos = {
            '1 標準テンプレート': {
                mode: 'standard',
                name: 'template',
            },
            '2 編集 基本クラス': {
                mode: 'TransBase',
                name: 'TransBase',
                sql: true,
                module: true,
            },
            '3 編集 初期化ページ': {
                mode: 'TransInit',
                name: 'TransInit',
            },
            '4 編集 編集ページ': {
                mode: 'TransEdit',
                name: 'TransEdit',
            },
            '5 編集 確認ページ': {
                mode: 'TransConfirm',
                name: 'TransConfirm',
            },
            '6 編集 完了ページ': {
                mode: 'TransCompleted',
                name: 'TransCompleted',
            },
            '7 一覧 基本クラス': {
                mode: 'ListBase',
                name: 'ListBase',
                sql: true,
                module: true,
            },
            '8 一覧 初期化ページ': {
                mode: 'ListInit',
                name: 'ListInit',
            },
            '9 一覧 表示ページ': {
                mode: 'ListList',
                name: 'ListList',
                sql: true,
            },
            'A CCamRow 派生クラス': {
                mode: 'Row',
                name: 'Row',
                sql: true,
                module: true,
            },
            'B 一括 テーブル管理': {
                mode: 'Batch',
                name: [
                    {
                        mode: 'Row',
                        name: 'Row',
                    },
                    {
                        mode: 'ListBase',
                        name: 'ListBase',
                    },
                    {
                        mode: 'ListInit',
                        name: 'ListInit',
                    },
                    {
                        mode: 'ListList',
                        name: 'ListList',
                        // htmls: [{ dir: 'pc', charset: 'UTF-8' }],
                        htmls: [{ dir: '', charset: 'UTF-8' }],
                    },
                    {
                        mode: 'TransBase',
                        name: 'TransBase',
                    },
                    {
                        mode: 'TransInit',
                        name: 'TransInit',
                    },
                    {
                        mode: 'TransEdit',
                        name: 'TransEdit',
                        // htmls: [{ dir: 'pc', charset: 'UTF-8' }],
                        htmls: [{ dir: '', charset: 'UTF-8' }],
                    },
                    {
                        mode: 'TransConfirm',
                        name: 'TransConfirm',
                        // htmls: [{ dir: 'pc', charset: 'UTF-8' }],
                        htmls: [{ dir: '', charset: 'UTF-8' }],
                    },
                ],
                sql: true,
                module: true,
            },
        };
        this.defaultOptions = {
            wizard: "",
            templateDir: "",
            sqlDir: '/var/www/ragdoll/Installer/CREATE_TABLE/ver3',
            php: '/usr/bin/php',
            outFile: "php://stdout",
            author: "木屋善夫",
            // charset: 'Shift_JIS',
            charset: 'UTF-8',
        };
    }
    /**
     * エントリー
     */
    entry() {
        // オプションのデフォルト値で動的生成しなければならないものを設定
        this.defaultOptions.wizard = this.joinExtensionRoot("php/CpssWizardUTF8.php");
        this.defaultOptions.templateDir = this.joinExtensionRoot("templates");
        // 設定取得
        let options = new Options(this.getConfiguration(), this.defaultOptions);
        // 一覧からモードを選択
        // 情報配列からメニューを作成
        let menu = [];
        let info;
        for (let key in this.modeInfos) {
            menu.push(key);
        }
        let opt = {
            placeHolder: '選択してください。'
        };
        vscode.window.showQuickPick(menu, opt).then((mode) => {
            // モードが指定されなかったら終了
            if (!mode) {
                return rejectSurelyPrimise('');
            }
            info = this.modeInfos[mode];
            if (!info) {
                return rejectSurelyPrimise('');
            }
            console.log(`mode = "${mode}"`);
            options.mode = info.mode;
            options.name = info.name;
            // SQLが必要なときはディレクトリーが存在するか先に確認
            if ((info.sql) && !fs.existsSync(options.sqlDir)) {
                nekoaisle_1.Util.putMess(`'${options.sqlDir}' が見つかりません。cpssWizard.sqlDir で指定できます。`);
                return resolveSurelyPrimise('');
            }
            if (info.module) {
                // モジュール名が必要なときはモジュール名求める
                let ioption = {
                    prompt: "モジュール名を入力してください。",
                    placeHolder: '',
                    password: false,
                    value: "",
                };
                return vscode.window.showInputBox(ioption);
            }
            else {
                return resolveSurelyPrimise('');
            }
        }).then((module) => {
            options.module = module.toLocaleUpperCase();
            // InputBoxを表示してタイトルを求める
            let ioption = {
                prompt: "タイトルを入力してください。",
                password: false,
                value: "",
            };
            return vscode.window.showInputBox(ioption);
        }).then((title) => {
            if (!title || (title.trim().length == 0)) {
                // タイトルが指定されなかったときは何もしない
                return rejectSurelyPrimise('');
            }
            console.log(`title = "${title}"`);
            options.title = title;
            // SQLファイルを選択
            if ((info.sql) && fs.existsSync(options.sqlDir)) {
                let sel = new nekoaisle_1.SelectFile();
                return sel.selectFile(`${options.sqlDir}`, 'SQLファイルを選択してください。(不要な場合はESC)');
            }
            else {
                return resolveSurelyPrimise('');
            }
        }).then((sqlFile) => {
            console.log(`sqlFile = "${sqlFile}"`);
            options.sqlFile = sqlFile;
            if (options.mode == 'Batch') {
                // バッチ処理
                this.batchExec(options);
            }
            else {
                // 1回のみ
                this.execWizard(options);
            }
        });
    }
    /**
     * 一括処理
     * @param options Options オプション
     */
    batchExec(options) {
        // 一括登録
        // batch は options.name が配列になっている
        let names = options.name;
        options.name = null; // クローンの負荷を減らすため
        // SQLファイル名を分解
        // ※先頭の数字と_スペースは除去
        let pinfo = path.parse(options.sqlFile);
        let re = /^[0-9_ ]*([^\.]+).sql$/i;
        let name = re.exec(pinfo.base)[1];
        let sqls = name.split('_');
        if (options.module) {
            // モジュール名が指定されている
            if (sqls[0].toLocaleUpperCase == options.module.toLocaleUpperCase) {
                // SQLのファイル名の先頭パーツとモジュール名が
                // 一致しているので先頭を除去
                // 'BIMMS', 'BIMMS_GROUP.sql' -> 
                // BimmsRowGroup.php
                // GroupListBase.php
                // group_list.php
                sqls.shift();
            }
            else {
                // 'CPSS', '00_ACCOUNT.sql'
                // CpssRowAccount
                // AccountListBase,php
                // account_list,php
            }
        }
        else {
            // モジュール名が指定されていない
            // '01 GROUP_MEMBER.sql'
            // RowGroupMember.php
            // GroupMemberListBase.php
            // group_memberlist.php
        }
        // 小文字に変換
        for (let key in sqls) {
            sqls[key] = sqls[key].toLocaleLowerCase();
        }
        // すべてのオプションを格納する配列
        let opts = [];
        for (let name of names) {
            // まずはオプションを複製
            let opt = nekoaisle_1.Util.cloneObject(options);
            // テンプレートファイルのベース名を設定
            opt.mode = name['mode'];
            opt.name = name['name'];
            opt.htmls = name['htmls'];
            // 出力ファイル名を作成
            let parts = [];
            switch (opt.mode) {
                // DAO
                case 'Row': {
                    // 先頭がモジュール名
                    parts.push(nekoaisle_1.Util.toCamelCase(options.module));
                    // 2番目は Row 固定
                    parts.push('Row');
                    // 3番目以降は SQL ファイル名のパーツをキャメルケースで結合
                    for (let p of sqls) {
                        parts.push(nekoaisle_1.Util.toCamelCase(p));
                    }
                    break;
                }
                // 一覧基本クラス	
                case 'ListBase': {
                    // 'BIMMS_GROUP.sql' -> GroupListBase.php
                    // SQLの部品をキャメルケースに変換して追加
                    for (let p of sqls) {
                        parts.push(nekoaisle_1.Util.toCamelCase(p));
                    }
                    // 'ListBased' を追加
                    parts.push('ListBase');
                    break;
                }
                // 一覧初期化	
                case 'ListInit': {
                    // 'BIMMS_GROUP.sql' -> group_list.php
                    parts.push(sqls[0].toLocaleLowerCase());
                    for (let i = 1; i < sqls.length; ++i) {
                        parts.push('_' + sqls[i].toLocaleLowerCase());
                    }
                    // '_list' を追加
                    parts.push('_list');
                    break;
                }
                // 一覧	
                case 'ListList': {
                    // 'BIMMS_GROUP.sql' -> group_list1.php
                    // SQLの先頭部品を小文字で設定
                    parts.push(sqls[0].toLocaleLowerCase());
                    // SQLの残り部品を '_' + 小文字で追加
                    for (let i = 1; i < sqls.length; ++i) {
                        parts.push('_' + sqls[i].toLocaleLowerCase());
                    }
                    // '_list1' を追加
                    parts.push('_list1');
                    break;
                }
                // 編集基本クラス	
                case 'TransBase': {
                    // 'BIMMS_GROUP.sql' -> GroupEditBase.php
                    for (let p of sqls) {
                        parts.push(nekoaisle_1.Util.toCamelCase(p));
                    }
                    // 'EditBased' を追加
                    parts.push('EditBase');
                    break;
                }
                // 編集初期化	
                case 'TransInit': {
                    // 'BIMMS_GROUP.sql' -> group_edit.php
                    // SQLの先頭部品を小文字で設定
                    parts.push(sqls[0].toLocaleLowerCase());
                    // SQLの残り部品を '_' + 小文字で追加
                    for (let i = 1; i < sqls.length; ++i) {
                        parts.push('_' + sqls[i].toLocaleLowerCase());
                    }
                    // '_edit' を追加
                    parts.push('_edit');
                    break;
                }
                // 編集	
                case 'TransEdit': {
                    // 'BIMMS_GROUP.sql' -> group_edit.php
                    // SQLの先頭部品を小文字で設定
                    parts.push(sqls[0].toLocaleLowerCase());
                    // SQLの残り部品を '_' + 小文字で追加
                    for (let i = 1; i < sqls.length; ++i) {
                        parts.push('_' + sqls[i].toLocaleLowerCase());
                    }
                    // '_edit' を追加
                    parts.push('_edit1');
                    break;
                }
                // 編集確認	
                case 'TransConfirm': {
                    // 'BIMMS_GROUP.sql' -> group_edit.php
                    // SQLの先頭部品を小文字で設定
                    parts.push(sqls[0].toLocaleLowerCase());
                    // SQLの残り部品を '_' + 小文字で追加
                    for (let i = 1; i < sqls.length; ++i) {
                        parts.push('_' + sqls[i].toLocaleLowerCase());
                    }
                    // '_edit' を追加
                    parts.push('_edit2');
                    break;
                }
                // 編集完了	
                case 'TransCompleted': {
                    // 'BIMMS_GROUP.sql' -> group_edit.php
                    // SQLの先頭部品を小文字で設定
                    parts.push(sqls[0].toLocaleLowerCase());
                    // SQLの残り部品を '_' + 小文字で追加
                    for (let i = 1; i < sqls.length; ++i) {
                        parts.push('_' + sqls[i].toLocaleLowerCase());
                    }
                    // '_edit' を追加
                    parts.push('_edit3');
                    break;
                }
            }
            // 拡張子を追加
            parts.push('.php');
            let pinfo = path.parse(vscode.window.activeTextEditor.document.fileName);
            opt.fileName = parts.join('');
            opt.fileName = path.join(pinfo.dir, opt.fileName);
            opts.push(opt);
        }
        // 実行
        let err = [];
        for (let opt of opts) {
            if (fs.existsSync(opt.fileName)) {
                nekoaisle_1.Util.putMess(`${opt.fileName} を削除してください。`);
                return;
            }
        }
        // 実行
        for (let opt of opts) {
            this.execWizard(opt);
            if (opt.htmls) {
                // HTMLを処理
                let opt2 = nekoaisle_1.Util.cloneObject(opt);
                let pinfo = new nekoaisle_1.PathInfo(opt.fileName);
                for (let info of opt2.htmls) {
                    opt2.fileName = pinfo.getFileName('.phtml', info.dir);
                    opt2.charset = info.charset;
                    this.execWizard(opt2);
                }
            }
        }
    }
    execWizard(options) {
        //ドキュメントを取得
        let editor = vscode.window.activeTextEditor;
        // // 出力ウィンドウの生成
        // var overview = vscode.window.createOutputChannel( "quick-filter" );
        // // 出力ウィンドウをクリア
        // overview.clear();
        // ファイル名を取得
        let fileName;
        if (options.fileName) {
            // ファイル名が指定されている
            fileName = options.fileName;
        }
        else {
            // 現在編集中のファイル名を解析
            fileName = editor.document.fileName;
        }
        let pinfo = path.parse(fileName);
        if (!pinfo.ext) {
            // 拡張子がない
            nekoaisle_1.Util.putMess(`拡張子のないファイルには対応していません。'${fileName}'`);
            return false;
        }
        // テンプレートファイルを探す
        let t = [
            // ファイルの存在するディレクトリの template ディレクトリを探す
            `${pinfo.dir}/template/${options.name}${pinfo.ext}`,
            `${pinfo.dir}/template/template${pinfo.ext}`,
            // ファイルの存在するディレクトリ直下の template ファイルを探す
            `${pinfo.dir}/${options.name}${pinfo.ext}`,
            `${pinfo.dir}/template${pinfo.ext}`,
            // デフォルトのテンプレートを探す
            `${options.templateDir}/${options.name}${pinfo.ext}`,
            `${options.templateDir}/template${pinfo.ext}`,
        ];
        let tmpl;
        for (var k in t) {
            if (nekoaisle_1.Util.isExistsFile(t[k])) {
                tmpl = t[k];
                break;
            }
        }
        console.log("template = " + tmpl);
        if (!tmpl) {
            var s = "テンプレートファイルが見つかりませんでした。\n";
            for (var k in t) {
                s += t[k] + "\n";
            }
            nekoaisle_1.Util.putMess(s);
            return false;
        }
        // コマンドラインを作成
        let cmd = `${options.php} ${options.wizard} "-m=${options.mode}" "-f=${fileName}" "-t=${options.title}" "-a=${options.author}" "-out=${options.outFile}" "-tmpl=${tmpl}" "-sql=${options.sqlFile}" "-module=${options.module}"`;
        console.log(cmd);
        // 実行
        chproc.exec(cmd, (err, stdout, stderr) => {
            if (err == null) {
                // console.log(stdout);
                if (options.fileName.length != 0) {
                    // 出力ファイル名が指定されている
                    let fn = nekoaisle_1.Util.normalizeHome(options.fileName);
                    let code;
                    switch (options.charset) {
                        case undefined:
                        case '':
                        case 'UTF-8': {
                            // 変換しない
                            code = stdout;
                            break;
                        }
                        default: {
                            // UTF-8 以外なら変換
                            code = iconv.encode(stdout, options.charset);
                            break;
                        }
                    }
                    // 空のファイルを書き出す
                    fs.writeFileSync(fn, "");
                    // ファイルを「書き込み専用モード」で開く
                    var fd = fs.openSync(fn, "w");
                    // ファイルに書き込む
                    fs.write(fd, code, 0, code.length, function (err, written, buffer) {
                        if (err) {
                            // エラーが発生
                            console.log(`error: ${err.message}`);
                        }
                        else {
                            console.log(`save: ${fn}`);
                        }
                    });
                }
                else {
                    // 出力ファイルがないときは貼り付け
                    editor.edit(function (edit) {
                        edit.insert(new vscode.Position(0, 0), stdout);
                    });
                }
            }
            else {
                // エラーが発生
                console.log(`error: ${err.message}
stderr: ${stderr}
stdout: ${stdout}`);
                nekoaisle_1.Util.putMess(err.message);
                return false;
            }
        });
    }
}
//# sourceMappingURL=extension.js.map