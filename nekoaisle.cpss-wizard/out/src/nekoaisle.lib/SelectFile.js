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
const fs = require("fs");
const path = require("path");
const nekoaisle_1 = require("./nekoaisle");
/**
 * ファイル選択
 * @param dirName ディレクトリー名
 * @param title タイトル
 * @return プロミス
 */
class SelectFile {
    constructor() {
        this.excludes = {};
    }
    /**
     * 除外辞書作成
     */
    makeExcludesDic() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i in this.excludes) {
                // 作成済み
                return;
            }
            // 除外ファイルを取得
            let excludes = [
                ...Object.keys(vscode.workspace.getConfiguration('search').get('exclude') || {}),
                ...Object.keys(vscode.workspace.getConfiguration('files').get('exclude') || {})
            ].join(',');
            // 辞書にする
            for (let exclud of excludes.split(',')) {
                this.excludes[exclud] = exclud;
            }
        });
    }
    /**
     * ファイル選択
     * @param dirName ディレクトリー名
     * @param title   タイトル名
     * @param asc     昇順にソート
     */
    selectFile(dirName, title, asc = true) {
        return __awaiter(this, void 0, void 0, function* () {
            // 除外ファイル辞書を作成
            yield this.makeExcludesDic();
            let files;
            try {
                files = fs.readdirSync(dirName);
                files = files.filter((value) => {
                    // ファイルの存在を確認
                    let full = path.join(dirName, value);
                    if (!fs.existsSync(full)) {
                        // 存在しなければ除外
                        return false;
                    }
                    if (this.excludes[value]) {
                        // 除外
                        return false;
                    }
                    else {
                        // 有効
                        return true;
                    }
                });
                // ディレクトリ名の末尾に / を付ける
                files = files.map((name) => {
                    let statas = fs.statSync(path.join(dirName, name));
                    if (statas.isDirectory()) {
                        name += '/';
                    }
                    return name;
                });
                // 並べ替える
                files = files.sort((a, b) => {
                    // ディレクトリーか調べる
                    let da = a.substr(-1) === '/';
                    let db = b.substr(-1) === '/';
                    if (da !== db) {
                        // どちらかかがディレクトリ
                        return da ? -1 : 1;
                    }
                    else {
                        // 両方ディレクトリかファイルなので名前で比較
                        a = a.toLocaleUpperCase();
                        b = b.toLocaleUpperCase();
                        return ((a < b) ? -1 : (a > b) ? 1 : 0) * (asc ? 1 : -1);
                    }
                });
                // ルートディレクトリでなければ先頭に ../ を追加
                if (dirName !== '/') {
                    files.unshift('../');
                }
            }
            catch (e) {
                nekoaisle_1.Util.putMess(`${dirName} が開けませんでした。`);
                return '';
            }
            // ファイルを選択
            let popt = {
                prompt: title,
                placeHolder: dirName,
            };
            let sel = yield vscode.window.showQuickPick(files, popt);
            if (!sel) {
                // ファイルが指定されなかったときは完了(then()を実行)
                return '';
            }
            // ディレクトリ名と結合
            let fn = path.join(dirName, sel);
            // 絶対パスに変換
            fn = nekoaisle_1.Util.normalizePath(fn); // 絶対パスにする
            // ディレクトリーか調べる
            let stats = fs.statSync(fn);
            if (!stats.isDirectory()) {
                // ファイルなので完了(then()を実行)
                return fn;
            }
            // ディレクトリーなら選択を続行
            fn = yield this.selectFile(fn, title);
            return fn;
        });
    }
    /**
     * ファイル選択
     * @param dirName ディレクトリー名
     * @param title   タイトル名
     * @param asc     昇順にソート
     */
    selectFileOld(dirName, title, asc = true) {
        return new Promise((resolve, reject) => {
            // 非同期の処理
            let files;
            try {
                files = fs.readdirSync(dirName)
                    .map((name) => {
                    let statas = fs.statSync(path.join(dirName, name));
                    if (statas.isDirectory()) {
                        name += '/';
                    }
                    return name;
                })
                    .sort((a, b) => {
                    // ディレクトリーか調べる
                    let da = a.substr(-1) === '/';
                    let db = b.substr(-1) === '/';
                    if (da !== db) {
                        // どちらかかがディレクトリ
                        return da ? -1 : 1;
                    }
                    else {
                        // 両方ディレクトリかファイルなので名前で比較
                        a = a.toLocaleUpperCase();
                        b = b.toLocaleUpperCase();
                        return ((a < b) ? -1 : (a > b) ? 1 : 0) * (asc ? 1 : -1);
                    }
                });
                if (dirName !== '/') {
                    // ルートディレクトリでなければ先頭に ../ を追加
                    files.unshift('../');
                }
            }
            catch (e) {
                nekoaisle_1.Util.putMess(`${dirName} が開けませんでした。`);
                return;
            }
            // ファイルを選択
            let popt = {
                prompt: title,
                placeHolder: dirName,
            };
            vscode.window.showQuickPick(files, popt)
                .then((sel) => {
                if (!sel) {
                    // ファイルが指定されなかったときは完了(then()を実行)
                    resolve('');
                }
                else {
                    // ディレクトリ名と結合
                    let fn = path.join(dirName, sel);
                    // 絶対パスに変換
                    fn = nekoaisle_1.Util.normalizePath(fn); // 絶対パスにする
                    // ディレクトリーか調べる
                    let stats = fs.statSync(fn);
                    if (!stats.isDirectory()) {
                        // ファイルなので完了(then()を実行)
                        resolve(fn);
                    }
                    else {
                        // ディレクトリーなら選択を続行
                        this.selectFile(fn, title).then((value) => {
                            if (value) {
                                return value;
                            }
                            else {
                                return '';
                            }
                        });
                    }
                }
            });
        });
    }
}
exports.SelectFile = SelectFile;
//# sourceMappingURL=SelectFile.js.map