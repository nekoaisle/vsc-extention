/**
 * CPSSのログファイルを開く
 *
 * filename:  OpenLog.ts
 *
 * @version   0.1.1
 * @copyright Copyright (C) 2020 Creansmaerd Co.,LTD. All rights reserved.
 * @date      2020-02-26
 * @author    木屋 善夫
 */
'use strict';
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
const path_1 = require("path");
/**
 * エクステンション本体
 */
class OpenLog extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'ログファイルを開く',
            config: 'nekoaisle-openLog',
            commands: [
                {
                    command: 'nekoaisle.openLog',
                    callback: () => { this.openLog(); }
                }
            ]
        });
    }
    /**
     * メニューからファイルを選択して開く
     */
    openLog() {
        // 開始ディレクトリを取得
        let dirName = this.getConfig('logDir', 'log/dbg');
        if (!path_1.isAbsolute(dirName)) {
            // 相対パスならワークフォルダー追加
            dirName = nekoaisle_1.Util.getWorkFolder() + '/' + dirName;
        }
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
}
module.exports = OpenLog;
//# sourceMappingURL=OpenLog.js.map