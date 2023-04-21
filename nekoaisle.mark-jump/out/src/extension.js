"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
function activate(context) {
    new MyExtension(context);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
/**
 * ファイルごとの情報
 */
class Mark {
    get pos() {
        return MyExtension.normalizePos(this._pos);
    }
    set pos(pos) {
        this._pos = new vscode.Position(pos.line, 0);
    }
}
class FileData {
    constructor() {
        this.marks = [];
    }
    get last() {
        return MyExtension.normalizePos(this._last);
    }
    set last(pos) {
        this._last = new vscode.Position(pos.line, 0);
    }
    get cursor() {
        return MyExtension.normalizePos(this._cursor);
    }
    set cursor(pos) {
        this._cursor = new vscode.Position(pos.line, 0);
    }
    /**
     * すでに存在しているか調べる
     * @param pos
     * @return true:存在する
     */
    isExists(pos) {
        for (let key in this.marks) {
            let mark = this.marks[key];
            if (mark.pos.isEqual(pos)) {
                return true;
            }
        }
        return false;
    }
    /**
     * 指定スロットにマークを設定
     * @param slot スロット番号
     * @param pos 座標
     */
    setMark(slot, pos) {
        // マークを取得
        let mark;
        if (!this.marks[slot]) {
            // 新規なら作成
            mark = new Mark;
            this.marks[slot] = mark;
        }
        else {
            // 既存の修飾をクリア
            mark = this.marks[slot];
            mark.deco.dispose();
            mark.deco = null;
        }
        // マークを設定
        mark.pos = pos;
        // 修飾を設定
        // レンジを作成
        let ranges = [new vscode.Range(mark.pos, mark.pos)];
        // 装飾を設定
        mark.deco = nekoaisle_1.Util.setRuler(ranges, 'blue', 'Left');
    }
    /**
     * 指定スロットのマーク位置を取得
     * @param slot スロット番号
     */
    getMark(slot) {
        return this.marks[slot].pos;
    }
}
class MyExtension extends nekoaisle_1.Extension {
    /**
     * 構築
     */
    constructor(context) {
        super(context, {
            name: 'Mark jump',
            config: 'markJump',
            commands: [
                // カーソル位置を記憶
                {
                    command: 'nekoaisle.markjumpMark',
                    callback: (slot) => { this.markCursor(slot); }
                },
                // 記憶した位置にジャンプ
                {
                    command: 'nekoaisle.markjumpJump',
                    callback: (slot) => { this.jumpMark(slot); }
                },
                // 前回のカーソル位置に戻る
                {
                    command: 'nekoaisle.markjumpReturn',
                    callback: () => { this.jumpLast(); }
                }
            ]
        });
        // ファイル名ごとのマークした位置
        this.fileDatas = {};
        // イベントハンドラーを登録
        let subscriptions = [];
        vscode.window.onDidChangeTextEditorSelection(this.onChangeSelection, this, subscriptions);
        vscode.workspace.onDidCloseTextDocument((doc) => {
            let filename = doc.fileName;
            delete this.fileDatas[filename];
        });
        // create a combined disposable from both event subscriptions
        this.disposable = vscode.Disposable.from(...subscriptions);
        // このファイルのデータを取得
        if (vscode.window.activeTextEditor) {
            let fileData = this.getData();
            // 現在のカーソル位置を記憶
            fileData.cursor = this.getCsrPos();
        }
    }
    /**
     * ジャンプを記録する閾値(行数)
     */
    getJumpThreshold() {
        // settings.json より閾値を取得
        return this.getConfig('jump-threshold', 10);
    }
    /**
     * 位置を正規化する
     * @param pos 正規化する位置
     * @returns 正規化した位置
     */
    static normalizePos(pos) {
        if (pos) {
            return pos;
        }
        else {
            return null;
        }
    }
    /**
     * 現在のカーソル位置を取得
     * @return 現在のカーソル位置
     */
    getCsrPos() {
        let pos = vscode.window.activeTextEditor.selection.anchor;
        return new vscode.Position(pos.line, pos.character);
    }
    /**
     * 指定位置にジャンプ
     * @param pos ジャンプする位置
     */
    setCsrPos(pos) {
        let range = new vscode.Range(pos, pos);
        vscode.window.activeTextEditor.selection = new vscode.Selection(pos, pos);
        vscode.window.activeTextEditor.revealRange(range);
        console.log(`jump = ${pos.character}, ${pos.line}`);
    }
    /**
     * 指定したファイルに関するデータを取得
     * @param filename ファイル名
     */
    getData(filename) {
        // ファイル名が省略されたら現在アクティブなエディタのファイル名
        if (!filename) {
            filename = vscode.window.activeTextEditor.document.fileName;
        }
        // まだデータオブジェクトが構築されていなければ作成
        if (!this.fileDatas[filename]) {
            this.fileDatas[filename] = new FileData();
        }
        return this.fileDatas[filename];
    }
    // カーソル位置を記憶
    markCursor(slot) {
        return __awaiter(this, void 0, void 0, function* () {
            // 現在のカーソル位置を取得
            let pos = this.getCsrPos();
            // このファイルのデータを取得
            let fileData = this.getData();
            // スロットを選択
            if (typeof (slot) === 'undefined') {
                if (fileData.marks.length === 0) {
                    // スロットがないので0固定
                    slot = 0;
                }
                else if (fileData.isExists(pos)) {
                    // すでにマークされている
                }
                else {
                    let item = yield this.selectSlot(fileData, true);
                    if (!item) {
                        return;
                    }
                    slot = parseInt(item.label) - 1;
                }
            }
            // 現在位置を記憶
            fileData.setMark(slot, pos);
        });
    }
    /**
     * カーソル位置にジャンプ
     */
    jumpMark(slot) {
        return __awaiter(this, void 0, void 0, function* () {
            // このファイルのデータを取得
            let fileData = this.getData();
            // スロットを選択
            if (typeof (slot) === 'undefined') {
                // スロットが指定されていないので選択
                switch (fileData.marks.length) {
                    case 0: {
                        // マークされていないので終了
                        return;
                    }
                    case 1: {
                        // １つしかないので0固定
                        slot = 0;
                        break;
                    }
                    default: {
                        // ダイアログを開いて選択
                        let item = yield this.selectSlot(fileData, false);
                        if (!item) {
                            return;
                        }
                        slot = parseInt(item.label) - 1;
                    }
                }
            }
            // マークした位置を取得
            let pos = fileData.getMark(slot);
            // 同じ位置へはジャンプしない
            let cur = this.getCsrPos();
            if (!cur.isEqual(pos)) {
                // ジャンプ前の位置を記憶
                fileData.last = cur;
                // 記憶していた位置にジャンプ
                this.setCsrPos(pos);
            }
        });
    }
    // 最後にジャンプした位置に戻る
    jumpLast() {
        // このファイルのデータを取得
        let fileData = this.getData();
        if (fileData.last) {
            // 最後にジャンプした位置にジャンプ
            this.setCsrPos(fileData.last);
        }
    }
    /**
     * 選択範囲変更イベントハンドラ
     * @param e イベント情報
     */
    onChangeSelection(e) {
        // 現在のカーソル位置を取得
        let cur = e.selections[0].active;
        // このファイルのデータを取得
        let fileData = this.getData();
        if (fileData.cursor) {
            // 移動行数を取得
            const delta = Math.abs(fileData.cursor.line - cur.line);
            const threshold = this.getJumpThreshold();
            if (delta >= threshold) {
                // 行が移動したので前回位置として記憶
                fileData.last = fileData.cursor;
            }
        }
        fileData.cursor = cur;
    }
    /**
     * 処分
     */
    dispose() {
        this.disposable.dispose();
    }
    /**
     * スロットを選択
     *
     * label にスロット番号+1 を返します。
     *
     * @param fileData このファイル用のデータ
     * @param addNew メニューの末尾に追加を表示
     */
    selectSlot(fileData, addNew) {
        return __awaiter(this, void 0, void 0, function* () {
            let editor = vscode.window.activeTextEditor;
            // メーニューを作成
            let menu = [];
            let key;
            for (key in fileData.marks) {
                key = parseInt(key); // 文字列を数値に変換
                let line = fileData.marks[key].pos.line;
                let text = editor.document.lineAt(line).text;
                menu.push({
                    label: (key + 1).toString(),
                    description: `${line + 1}: ${text}`,
                });
            }
            // 新規作成
            menu.push({
                label: (key + 2).toString(),
                description: '追加',
            });
            let options = {
                placeHolder: '選択してください。',
                matchOnDetail: true,
                matchOnDescription: false
            };
            return vscode.window.showQuickPick(menu, options);
        });
    }
}
//# sourceMappingURL=extension.js.map