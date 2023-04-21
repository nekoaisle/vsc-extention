"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 'use strict';
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
/**
 * エクステンション本体
 */
class TabManager extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'タブマネージャー',
            config: 'nekoaisle-tab-manager',
            commands: [
                {
                    command: 'nekoaisle-tab-manager.saveTabFilenames',
                    callback: () => { this.saveTabFilenames(); }
                },
                {
                    command: 'nekoaisle-tab-manager.restoreTabGroup',
                    callback: () => { this.restoreTabGroup(); }
                },
                {
                    command: 'nekoaisle-tab-manager.editSaveFile',
                    callback: () => { this.editSaveFile(); }
                },
                {
                    command: 'nekoaisle-tab-manager.reload',
                    callback: () => { this.reload(); }
                },
            ]
        });
        /**
         * デフォルトの履歴ファイル名を取得
         */
        this.defaultSaveFile = '~/Documents/nekoaisle-tab-manager.json';
        // タブ情報
        this.tabGroups = {};
        // 保存情報の読み込み
        this.loadTabInfo(true);
    }
    /**
     * 履歴ファイルのファイル名取得
     * @return ファイル名
     */
    getSaveFilename() {
        // settings.json より履歴ファイル名を取得
        let fn = this.getConfig('save-file', this.defaultSaveFile);
        // 先頭の ~ を置換
        fn = nekoaisle_1.Util.normalizePath(fn);
        //
        return fn;
    }
    /**
     * 保存されているタブグループ名配列を取得
     */
    getSvaeSlot() {
        // 追加はないのでスロット数 0, 1 の特殊処理
        let slots = [];
        for (let id in this.tabGroups) {
            slots.push(id);
        }
        return slots;
    }
    /**
     * タブ情報の保存
     */
    saveTabInfo() {
        let fn = this.getSaveFilename();
        // 履歴ファイルの書き込み
        nekoaisle_1.Util.saveFileJson(fn, this.tabGroups);
        if (!this.getConfig('silent', true)) {
            vscode.window.setStatusBarMessage(`タブグループ情報を ${fn} に保存しました。`, 1 * 1000);
        }
    }
    /**
     * タブ情報の読み込み
     * @param silent ファイルが存在しないときにメッセージを出さない
     */
    loadTabInfo(silent = false) {
        let fn = this.getSaveFilename();
        // タブ情報ファイルの読み込み
        let slots = nekoaisle_1.Util.loadFileJson(fn, silent);
        if (slots) {
            this.tabGroups = slots;
        }
    }
    /**
     * スロット名を入力
     */
    async inputSaveSlotName() {
        let name;
        let option = {
            placeHolder: '保存スロット名を入力してください。',
        };
        let prompt;
        do {
            // ファイル名を入力
            name = await vscode.window.showInputBox({
                placeHolder: '保存スロット名を入力してください。',
            });
            if (!name) {
                return;
            }
            // 重複チェック
            for (let label in this.tabGroups) {
                if (name === label) {
                    option.prompt = `${name} はすでに存在しています。`;
                    name = undefined;
                }
            }
        } while (!name);
        //
        return name;
    }
    /**
     * タブグループ保存スロットの選択
     */
    async selectSaveSlot(add) {
        // スロット数 0, 1 の特殊処理
        let slots = this.getSvaeSlot();
        if (slots.length === 0) {
            // スロットなし
            if (!add) {
                // 追加はない
                return;
            }
            else {
                // 新規作成
                return await this.inputSaveSlotName();
            }
        }
        // 詳細表示時にワークスペースフォルダー名を除去するため
        // ワークスペースフォルダー名を取得
        // ※複数ある場合は除去しない
        const folders = vscode.workspace.workspaceFolders;
        let root = '';
        let rootLen = 0;
        if (folders && (folders.length === 1)) {
            root = folders[0].uri.fsPath;
            rootLen = root.length;
        }
        // メニューを作成
        let menu = [];
        for (let label in this.tabGroups) {
            // 保存スロット１つ分の処理
            const infos = this.tabGroups[label];
            let dirs = [];
            // 詳細は内包するファイル名を列挙
            infos.forEach(function (info) {
                // フルパス名をパース
                const pi = new nekoaisle_1.PathInfo(info.fullPath);
                let dir = pi.info.dir + '/';
                // ワークスペースのルートフォルダー名を除去
                if (rootLen) {
                    let p = dir.substring(0, rootLen);
                    if (p === root) {
                        dir = '.' + dir.substring(rootLen);
                    }
                }
                dirs.push(`${dir}${pi.info.base}`);
            });
            let desc = dirs.join(', ');
            menu.push({
                label: label,
                // detail: key,
                description: desc,
            });
        }
        // 新規追加
        if (add) {
            menu.push({
                label: 'New slot',
                // detail: key,
                description: '新規作成',
            });
        }
        // メニュー選択
        let options = {
            placeHolder: '保存するスロットを選択してください。',
            matchOnDetail: false,
            matchOnDescription: false
        };
        let sel = await vscode.window.showQuickPick(menu, options);
        if (!sel) {
            return;
        }
        if (sel.label !== 'New slot') {
            // 既存を選択した
            return sel.label;
        }
        // 新規作成
        return await this.inputSaveSlotName();
    }
    /**
     * 現在のエディタグループにて開かれているすべてのファイル名を保存
     */
    async saveTabFilenames() {
        // セーブスロットを選択
        let slot = await this.selectSaveSlot(true);
        if (!slot) {
            return;
        }
        // タブ情報保存配列
        const tabGroup = [];
        // 現在のアクティブエディターを記憶
        const lastEditor = vscode.window.activeTextEditor;
        const showOptions = {
            preview: false,
        };
        // 現在のタブグループの全タブを取得
        const tabs = vscode.window.tabGroups.activeTabGroup.tabs;
        for (let tab of tabs) {
            const uri = tab?.input?.uri ?? {};
            if (uri.fsPath) {
                const fullPath = uri.fsPath;
                let topNo = 0;
                let lineNo = 0;
                /* 残念ながら非アクティブなエディターのカーソル位置などは
                 * await vscode.window.showTextDocument() しても取れないようです。
                 */
                // アクティブにしないとカーソル位置などが取れない？
                await vscode.window.showTextDocument(uri, showOptions);
                // このファイルを開いているエディタを探す
                const editors = vscode.window.visibleTextEditors;
                for (let editor of editors) {
                    if (editor.document.fileName === fullPath) {
                        // カーソル行とスクロール位置を取得
                        lineNo = editor.selection.start.line;
                        topNo = editor.visibleRanges[0]?.start?.line;
                        break;
                    }
                }
                // グループにファイル情報を追加
                tabGroup.push({
                    fullPath: fullPath,
                    topNo: topNo,
                    lineNo: lineNo,
                });
                nekoaisle_1.Util.putLog(`${fullPath}: ${lineNo} ${topNo}`);
            }
        }
        if (lastEditor) {
            vscode.window.showTextDocument(lastEditor.document);
        }
        // メンバーに記憶
        this.tabGroups[slot] = tabGroup;
        // 保存
        this.saveTabInfo();
    }
    /**
     * 現在のエディタグループに指定スロットのファイルを開く
     * ※現在開かれてるファイルはすべて閉じる
     */
    async restoreTabGroup() {
        // 保存されているスロットがないときはエラー
        let slots = this.getSvaeSlot();
        if (!slots.length) {
            nekoaisle_1.Util.putMess('タブグループ情報は保存されていません。');
            return;
        }
        // セーブスロットを選択
        let slot = await this.selectSaveSlot(false);
        if (!slot) {
            return;
        }
        // 現在のタブグループの全タブを取得
        const tabs = vscode.window.tabGroups.activeTabGroup.tabs;
        // 現在のタブグループのタブを全部閉じる
        vscode.window.tabGroups.close(tabs);
        // 記憶したファイルを開く
        const tabGroup = this.tabGroups[slot];
        if (tabGroup) {
            for (let id in tabGroup) {
                const info = tabGroup[id];
                const file = info.fullPath;
                // ファイルを開く
                vscode.workspace.openTextDocument(info.fullPath).then((doc) => {
                    // ファイルが開いた
                    vscode.window.showTextDocument(doc).then((editor) => {
                        // 表示された
                        // // カーソル位置を復元
                        // let pos = new vscode.Position(info.lineNo, 0);
                        // editor.selection = new vscode.Selection(pos, pos);
                    });
                });
            }
        }
    }
    /**
     * 保存ファイルを編集
     */
    async editSaveFile() {
        // 保存ファイル名を取得
        const fn = this.getSaveFilename();
        // 開く
        await nekoaisle_1.Util.openFileSync(fn);
    }
    /**
     * 保存ファイルの再読込
     */
    reload() {
        this.loadTabInfo(false);
    }
}
exports.default = TabManager;
//# sourceMappingURL=TabManager.js.map