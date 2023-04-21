'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const nekoaisle_1 = require("./nekoaisle.lib/nekoaisle");
// this method is called when vs code is activated
function activate(context) {
    const configKey = "cpssDecorator";
    let disp = vscode.commands.registerCommand('nekoaisle.cpssDecoratorRefresh', () => {
        // 読み込み済みのデザインをクリア
        designs = {};
        // 読み込み済みの強調表示をクリア
        highlights = {};
        // 現在編集中のファイル用のデザインと強調表示を読み込む
        loadSettingByExtension();
        if (activeEditor) {
            // 強調表示の設定
            triggerUpdateDecorations();
        }
    });
    context.subscriptions.push(disp);
    ;
    /**
     * settings.json からこの拡張機能用の設定を取得
     * @param key 設定名
     * @param def 設定されていないときに返す値
     * @return string 設定
     */
    function getConfig(key, def) {
        if (!config) {
            // まだ読み込まれていないので読み込む
            config = vscode.workspace.getConfiguration(configKey);
        }
        let ret = config.get(key, def);
        if (ret) {
            return ret;
        }
        return def;
    }
    /**
     * テンプレート格納ディレクトリ名を取得
     * @param dirName ディレクトリ名
     * @param settingsKey settings.json のサブキー
     * @return string テンプレート格納ディレクトリ名
     */
    function getConfigDir(dirName, settingsKey) {
        // デフォルトのテンポラリディレクトリ名
        // 拡張機能フォルダー内に格納されているファイル名をフルパスにする
        let res = path.join(context.extensionPath, dirName);
        // settings.json よりテンプレートディレクトリを取得
        res = getConfig(settingsKey, res);
        // 先頭の ~ を置換
        res = nekoaisle_1.Util.normalizePath(res);
        //
        return res;
    }
    /**
     * 文字列で書かれた vscode.DecorationRenderOptions のプロパティを変換
     * @param desigh vscode.DecorationRenderOptions の要素を文字列で表したオブジェクト
     */
    function correctDesign(desigh) {
        for (let key in desigh) {
            switch (key) {
                case 'overviewRulerLane': {
                    desigh[key] = nekoaisle_1.Util.strToOverviewRulerLane(desigh[key]);
                    break;
                }
                case 'rangeBehavior': {
                    desigh[key] = nekoaisle_1.Util.strToDecorationRangeBehavior(desigh[key]);
                    break;
                }
            }
        }
        //
        return desigh;
    }
    function getDesign(param, current) {
        let design = {};
        switch (nekoaisle_1.Util.getClassName(param)) {
            case 'String': {
                // 文字列ならすでに登録されているデザイン
                if (current[param]) {
                    design = current[param];
                }
                break;
            }
            case 'Object': {
                // 文字列化 vscode.DecorationRenderOptions
                design = correctDesign(param);
                break;
            }
            case 'Array': {
                // 配列なら再帰呼び出しをしてマージ
                for (let d of param) {
                    d = getDesign(d, current);
                    design = Object.assign(design, d);
                }
                break;
            }
        }
        //
        return design;
    }
    /**
     * デザイン用 JSON ファイルを読み込む
     * @param fileName ファイル名
     */
    function loadDesign(fileName) {
        // json ファイルの読み込み
        let json = nekoaisle_1.Util.loadFileJson(fileName);
        let designs = {};
        // JSONにかけない変数は文字列として記述されているので変換
        for (let name in json) {
            designs[name] = getDesign(json[name], designs);
        }
        //
        return designs;
    }
    function loadHighlights(fileName, current) {
        // json ファイルの読み込み
        let json = nekoaisle_1.Util.loadFileJson(fileName);
        // JSONにかけない変数は文字列として記述されているので変換
        for (let highlight of json) {
            highlight['design'] = getDesign(highlight['design'], current);
        }
        //
        return json;
    }
    /**
     * 現在の拡張子に対応するデザインとハイライトの読み込み
     * @param force true を指定すると強制的に読み込みます
     */
    function loadSettingByExtension() {
        // まずは共通設定の読み込み
        if (!designs['common']) {
            let fn = `${configDir}/designs.json`;
            let json = {};
            if (nekoaisle_1.Util.isExistsFile(fn)) {
                json = loadDesign(fn);
            }
            designs['common'] = json;
        }
        if (!highlights['common']) {
            let fn = `${configDir}/highlights.json`;
            let json = {};
            if (nekoaisle_1.Util.isExistsFile(fn)) {
                json = loadHighlights(fn, designs['common']);
            }
            highlights['common'] = json;
        }
        // 現在編集中のファイルの拡張子を取得
        let ext = nekoaisle_1.Util.getDocumentExt(activeEditor.document, true);
        if (!designs[ext]) {
            // まず共通設定を設定
            designs[ext] = nekoaisle_1.Util.cloneObject(designs['common']);
            // 拡張子別設定をマージ
            let fn = `${configDir}/designs-${ext}.json`;
            if (nekoaisle_1.Util.isExistsFile(fn)) {
                let d = loadDesign(fn);
                designs[ext] = Object.assign(designs[ext], d);
            }
        }
        // 未読み込みならばハイライトの読み込み
        if (!highlights[ext]) {
            // まず共通設定を設定
            highlights[ext] = nekoaisle_1.Util.cloneObject(highlights['common']);
            // 拡張子別設定をマージ
            let fn = `${configDir}/highlights-${ext}.json`;
            if (nekoaisle_1.Util.isExistsFile(fn)) {
                let highlight = loadHighlights(fn, designs[ext]);
                if (highlight) {
                    Array.prototype.push.apply(highlights[ext], highlight);
                }
            }
        }
    }
    // config のキャッシュ
    let config;
    // テンプレート格納ディレクトリ名を取得
    let configDir = getConfigDir("data", "dataDir");
    let timeout = null;
    /**
     * デザインキャッシュ
     * { "デザイン名": DecorationRenderOptions, ... }
     */
    let designs = {};
    /**
     * 強調表示リストを読み込む
     * Hilight[]
     */
    let highlights = {};
    // getConfigDir
    /**
     * 最初の装飾処理
     */
    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        loadSettingByExtension();
        triggerUpdateDecorations();
    }
    /**
     * エディータ切り替えイベントハンドラ
     */
    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            // 拡張子ごとの設定を読み込む
            let ext = nekoaisle_1.Util.getDocumentExt(activeEditor.document, true);
            if (!designs[ext] || !highlights[ext]) {
                loadSettingByExtension();
            }
            // 実行
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    /**
     * ドキュメント変更イベントハンドラ
     */
    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    /**
     * 遅延装飾処理
     * １文字ごとにやっていたのでは大量変更時に重くなるので 0.5 秒ごとに処理している
     */
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 500);
    }
    /**
     * 設定した装飾
     */
    let attachedDecorations = [];
    /**
     * 装飾処理
     */
    function updateDecorations() {
        if (!activeEditor) {
            return;
        }
        let ext = nekoaisle_1.Util.getDocumentExt(activeEditor.document, true);
        if (!designs[ext] || !highlights[ext]) {
            return;
        }
        // 前回設定した装飾をクリア
        for (let deco of attachedDecorations) {
            deco.dispose();
        }
        attachedDecorations = [];
        for (let key in highlights[ext]) {
            let info = highlights[ext][key];
            if (!info.design) {
                // デザインがないので無視
                continue;
            }
            // 全テキストを取得
            const text = activeEditor.document.getText();
            let match;
            let re;
            // 除外範囲を格納する配列
            const exclusions = [];
            // 強調する範囲を格納する配列
            const ranges = [];
            // 除外範囲を取得
            if (info.exclusion) {
                re = new RegExp(info.exclusion, 'g');
                while (match = re.exec(text)) {
                    exclusions.push(new vscode.Range(activeEditor.document.positionAt(match.index), activeEditor.document.positionAt(match.index + match[0].length)));
                }
            }
            // 一致を取得
            re = new RegExp(info.regexp, 'g');
            while (match = re.exec(text)) {
                let range = new vscode.Range(activeEditor.document.positionAt(match.index), activeEditor.document.positionAt(match.index + match[0].length));
                // 除外範囲内か調べる
                for (let ex of exclusions) {
                    if (ex.contains(range)) {
                        // 除外範囲内
                        range = null;
                        break;
                    }
                }
                if (range) {
                    ranges.push(range);
                }
            }
            if (ranges.length > 0) {
                // 装飾を複製
                let deco = vscode.window.createTextEditorDecorationType(info.design);
                // 装飾を設定
                activeEditor.setDecorations(deco, ranges);
                // 今回設定した装飾を記憶
                attachedDecorations.push(deco);
            }
        }
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map