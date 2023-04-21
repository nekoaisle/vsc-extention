'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const chproc = require("child_process");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
function activate(context) {
    let extention = new OpenFiler(context);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
class OpenFiler extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'Open Filer',
            config: 'nekoaisle-openFiler',
            commands: [
                {
                    command: 'nekoaisle.openFiler',
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
        // settings.json からファイラーの名前を取得
        let filer = this.getConfig('filer', 'nautilus -s');
        //ドキュメントを取得
        let editor = vscode.window.activeTextEditor;
        // ファイル名を取得
        let fileName = editor.document.fileName;
        // コマンドラインを作成
        // let pinfo = path.parse(fileName);
        // let cmd = `${filer} -s ${pinfo.dir}`;
        let cmd = `${filer} "${fileName}"`;
        // 非同期実行
        console.log(cmd);
        chproc.exec(cmd, (err, stdout, stderr) => {
            if (err == null) {
                console.log(stdout);
            }
            else {
                // エラーが発生
                let str = `error:
${err.message}
stderr:
${stderr}
stdout:
${stdout}
trace:
${err.stack}
`;
            }
        });
        // 外部コマンドで開く
        // let pinfo = path.parse(fileName);
        // let uri = vscode.Uri.parse(`file://${pinfo.dir}`);
        // vscode.env.openExternal(uri);
    }
}
//# sourceMappingURL=extension.js.map