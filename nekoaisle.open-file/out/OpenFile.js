'use strict';
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
/**
 * エクステンション本体
 */
class OpenFile extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'ファイルを開く',
            config: 'nekoaisle-openFile',
            commands: [
                {
                    command: 'nekoaisle.selectOpen',
                    callback: () => { this.selectOpen(); }
                },
                {
                    command: 'nekoaisle.openFile',
                    callback: () => { this.cursorOpen(); }
                }
            ]
        });
    }
    // ワークスペースのディレクトリ名を追加
    static addWorkspace(fileName) {
        const dirName = nekoaisle_1.Util.getWorkFolder();
        return dirName + '/' + fileName;
    }
    // アクティブエディタのディレクトリを付加
    static addDocumentDir(fileName, editor) {
        const pinfo = new nekoaisle_1.PathInfo(editor.document.fileName);
        const dirName = pinfo.getDirName();
        return `${dirName}/${fileName}`;
    }
    /**
     * メニューからファイルを選択して開く
     */
    selectOpen() {
        // 開始ディレクトリを取得
        let start;
        if (vscode.window.activeTextEditor) {
            // アクティブなエディターのファイル名を分解
            start = vscode.window.activeTextEditor.document.fileName;
        }
        else if (nekoaisle_1.Util.getWorkFolder()) {
            start = nekoaisle_1.Util.getWorkFolder();
        }
        else {
            start = '~/';
        }
        // ファイル名情報を取得
        const pinfo = new nekoaisle_1.PathInfo(start);
        // ディレクトリー名を取得
        const dirName = pinfo.getDirName();
        const title = 'ファイルを選択してください。';
        const selectFile = new nekoaisle_1.SelectFile();
        selectFile.selectFile(dirName, title).then((file) => {
            if (file.length > 0) {
                vscode.workspace.openTextDocument(file).then((doc) => {
                    return vscode.window.showTextDocument(doc);
                });
            }
        });
    }
    /**
     * カーソル位置のファイル名のファイルを開く
     */
    cursorOpen() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            // アクティブエディターがなければ何もしない
            return;
        }
        // 現在のカーソル位置を取得
        let pos = editor.selection.active;
        // カーソル位置の行を取得
        let line = editor.document.lineAt(pos.line).text;
        //
        let fileName = '';
        if (!editor.selection.isEmpty) {
            // 選択範囲があるのでそれを取得
            fileName = editor.document.getText(editor.selection);
            if (fileName.substr(0, 1) === '/') {
                // 絶対の場合はワークスペースからの相対もありうる
                if (!nekoaisle_1.Util.isExistsFile(fileName)) {
                    // 存在しないのでワークスペース相対
                    fileName = OpenFile.addWorkspace(fileName.substr(1));
                }
            }
            else {
                // 相対ディレクトリ
                fileName = OpenFile.addDocumentDir(fileName, editor);
            }
            // 絶対パスに変換
            fileName = nekoaisle_1.Util.normalizePath(fileName, '');
        }
        else {
            // 選択範囲がない処理
            let delimiter = "'\" \t"; // デフォルトの区切り文字
            // 言語ごとの処理
            switch (editor.document.languageId) {
                case "php": {
                    for (let cond of OpenFile.conds) {
                        let res = cond.re.exec(line);
                        if (res) {
                            fileName = cond.func(res[1], editor);
                            // 絶対パスに変換
                            fileName = nekoaisle_1.Util.normalizePath(fileName, '');
                            break;
                        }
                    }
                    break;
                }
            }
            // 言語ごとの特殊処理がなかったときは区切り文字で検索
            if (fileName === '') {
                // ファイル名の先頭を探す
                let s;
                for (s = pos.character; s > 0; --s) {
                    // 1文字手前がデリミタ―かチェック
                    if (delimiter.indexOf(line.charAt(s - 1)) >= 0) {
                        // 見つけたのでここが先頭
                        break;
                    }
                }
                // ファイル名の末尾を探す
                let e;
                for (e = pos.character; e < line.length; ++e) {
                    // この桁がデリミタ―かチェック
                    if ("'\" \t".indexOf(line.charAt(e)) >= 0) {
                        // 見つけたのでこの１つ手前が末尾
                        break;
                    }
                }
                // ファイル名を切り出す
                fileName = line.substr(s, e - s);
                const dirName = this.getEditorDirname(editor);
                fileName = nekoaisle_1.Util.normalizePath(fileName, dirName);
            }
        }
        // ファイルを開く
        vscode.workspace.openTextDocument(fileName).then((doc) => {
            vscode.window.showTextDocument(doc);
        });
    }
    /**
     * 指定エディターのドキュメントのディレクトリ名を取得
     * @param editor 対象エディター
     * @return ディレクトリ名
     */
    getEditorDirname(editor) {
        // アクティブエディタのディレクトリを付加
        const pinfo = new nekoaisle_1.PathInfo(editor.document.fileName);
        return pinfo.getDirName();
    }
}
// '' と "" を $1 を使って1回で取得したいのだが何故かマッチしないという＞＜；
// re = /^\s*require_once\(\s*DOCUMENT_ROOT\s*\.\s*('|")([^$1]+)$1\s*\)/;
OpenFile.conds = [
    // require_once(DOCUMENT_ROOT . '')
    {
        re: /^\s*require_once\(\s*DOCUMENT_ROOT\s*\.\s*'\/([^']+)'\s*\)/,
        func: OpenFile.addWorkspace
    },
    // require_once(DOCUMENT_ROOT . "")
    {
        re: /^\s*require_once\(\s*DOCUMENT_ROOT\s*\.\s*"\/([^"]+)"\s*\)/,
        func: OpenFile.addWorkspace
    },
    // require_once(__DIR__ . '')
    {
        re: /^\s*require_once\(\s*__DIR__\s*\.\s*'\/([^']+)'\s*\)/,
        func: OpenFile.addDocumentDir,
    },
    // require_once(__DIR__ . "")
    {
        re: /^\s*require_once\(\s*__DIR__\s*\.\s*"\/([^"]+)"\s*\)/,
        func: OpenFile.addDocumentDir,
    },
    // require_once(dirname(__FILE__) . '/hoge.php');
    {
        re: /^\s*require_once\(\s*dirname\(\s*__FILE__\s*\)\s*\.\s*'\/([^']+)'\s*\)/,
        func: OpenFile.addDocumentDir,
    },
    // require_once(dirname(__FILE__) . "/hoge.php");
    {
        re: /^\s*require_once\(\s*dirname\(\s*__FILE__\s*\)\s*\.\s*"\/([^"]+)"\s*\)/,
        func: OpenFile.addDocumentDir,
    },
    // require_once　DOCUMENT_ROOT . ''
    {
        re: /^\s*require_once\s*DOCUMENT_ROOT\s*\.\s*'\/([^']+)'/,
        func: OpenFile.addWorkspace
    },
    // require_once DOCUMENT_ROOT . ""
    {
        re: /^\s*require_once\s*DOCUMENT_ROOT\s*\.\s*"\/([^"]+)"/,
        func: OpenFile.addWorkspace
    },
    // require_once __DIR__ . ''
    {
        re: /^\s*require_once\s*__DIR__\s*\.\s*'\/([^']+)'/,
        func: OpenFile.addDocumentDir,
    },
    // require_once __DIR__ . ""
    {
        re: /^\s*require_once\s*__DIR__\s*\.\s*"\/([^"]+)"/,
        func: OpenFile.addDocumentDir,
    },
    // require_once dirname(__FILE__) . '/hoge.php';
    {
        re: /^\s*require_once\s*dirname\(\s*__FILE__\s*\)\s*\.\s*'\/([^']+)'/,
        func: OpenFile.addDocumentDir,
    },
    // require_once dirname(__FILE__) . "/hoge.php";
    {
        re: /^\s*require_once\s*dirname\(\s*__FILE__\s*\)\s*\.\s*"\/([^"]+)"/,
        func: OpenFile.addDocumentDir,
    },
];
module.exports = OpenFile;
//# sourceMappingURL=OpenFile.js.map