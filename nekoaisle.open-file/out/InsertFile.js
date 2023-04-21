'use strict';
const vscode = require("vscode");
const fs = require("fs");
const jschardet = require("jschardet");
const iconv = require("iconv-lite");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
/**
 * エクステンション本体
 */
class InsertFile extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'メニューからファイルを選択してカーソル位置に読み込む',
            config: 'nekoaisle-insertFile',
            commands: [
                {
                    command: 'nekoaisle.insertFile',
                    callback: () => {
                        this.exec();
                    }
                }
            ]
        });
    }
    /**
     * エントリー
     */
    exec() {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        let editor = vscode.window.activeTextEditor;
        // 開始ディレクトリを取得
        let start;
        if (vscode.window.activeTextEditor) {
            // アクティブなエディターのファイル名を分解
            start = editor.document.fileName;
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
        const title = '読み込むファイルを選択してください。';
        const selectFile = new nekoaisle_1.SelectFile();
        selectFile.selectFile(dirName, title).then((file) => {
            if (file.length > 0) {
                // ファイルを読み込む
                fs.readFile(file, (err, data) => {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        let encoding = jschardet.detect(data).encoding;
                        nekoaisle_1.Util.putLog(encoding);
                        let text;
                        switch (encoding) {
                            // UTF-8 と ascii はそのまま
                            case 'UTF-8':
                            case 'ascii': {
                                text = data.toLocaleString();
                                break;
                            }
                            // それ以外は Shift-JIS
                            default: {
                                text = iconv.decode(data, 'SHIFT_JIS');
                                break;
                            }
                        }
                        editor.edit((edit) => { edit.insert(editor.selection.active, text); });
                    }
                });
            }
        });
    }
}
module.exports = InsertFile;
//# sourceMappingURL=InsertFile.js.map