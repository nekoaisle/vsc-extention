"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Util_1 = require("./Util");
/**
 * パス情報クラス
 */
class PathInfo {
    /**
     * 構築
     * @param fileName ファイル名
     * @param cwd カレントディレクトリ
     */
    constructor(fileName, cwd) {
        // 〜で始まるときは環境変数 $HOME に置き換える
        fileName = Util_1.Util.normalizePath(fileName, cwd);
        // 記憶
        this.path = fileName;
        // ファイル名を分解
        this.info = path.parse(fileName);
    }
    /**
     * このオブジェクトが保持しているディレクトリからの相対ディレクトリ名を取得
     * ※引数に絶対パス名を与えたときにはそれを返す
     * @param dir 相対ディレクトリ名
     */
    getDirName(dir) {
        if (!dir) {
            // 省略されたので現在のディレクトリを返す
            dir = this.info.dir;
        }
        else if (dir.substr(0, 1) !== '/') {
            // /で始まらないときは相対ディレクトリなので現在のディレクトリ結合
            dir = path.join(this.info.dir, dir);
            // 絶対パスに変換
            dir = path.resolve(dir);
        }
        return dir;
    }
    /**
     * このオブジェクトが保持しているパス情報からファイル名を作成
     * @param ext 付け替える拡張子
     * @param dir 相対ディレクトリ名
     */
    getFileName(ext, dir) {
        if (!ext) {
            ext = this.info.ext;
        }
        dir = this.getDirName(dir);
        return path.join(dir, this.info.name + ext);
    }
    /**
     * ファイルが存在するか調べる
     * @return true:存在する
     */
    isExistsFile() {
        return Util_1.Util.isExistsFile(this.path);
    }
    /**
     * ディレクトリが存在するか調べる
     * @return true:存在する
     */
    isExistsDir() {
        return Util_1.Util.isExistsFile(this.path);
    }
}
exports.PathInfo = PathInfo;
//# sourceMappingURL=PathInfo.js.map