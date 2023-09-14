/**
 * 選択範囲をエンコード
 * 
 * filename:  extension.ts
 * 
 * @package   
 * @version   1.0.0
 * @copyright Copyright (C) 2017 Yoshio Kiya All rights reserved.
 * @date      2017-08-23
 * @author    木屋善夫
 */
'use strict';
import * as vscode from 'vscode';
import { Util, Extension, EditInsert, EditReplace, DateInfo, ExtensionCommand, ExtensionOptions } from './nekoaisle.lib/nekoaisle';
import { Parser } from "expr-eval";
import { stringify } from 'querystring';

/**
 * エクステンション活性化
 * @param context 
 */
export function activate(context: vscode.ExtensionContext) {
	let ext = new MyExtention(context);
}

/**
 * 非活性化
 */
export function deactivate() {
}

// interface encloseResult {
// 	range: vscode.Range;
// 	str: string;
// };

interface CommandInfo {
	vscCommand?: string;
	funcName?: string;
	args?: string | string[];
	label: string;
	description?: string;
};

/**
 * 選択範囲をエンコード
 */
class MyExtention extends Extension {
	/**
	 * 機能データー
	 */
	static commandInfo: CommandInfo[]  = [
		// 変換
		{
			label: '=== 変換 =======================================',
		}, {
			// 大文字
			vscCommand: 'nekoaisle.toUpperCase',
			funcName: 'encodeJob',
			args: 'toUpperCase',
			label: 'toUpperCase',
			description: '大文字に変換',
		}, {
			// 小文字
			vscCommand: 'nekoaisle.toLowerCase',
			funcName: 'encodeJob',
			args: 'toLowerCase',
			label: 'toLowerCase',
			description: '小文字に変換',
		}, {
			// 全角に変換
			vscCommand: 'nekoaisle.toZenkaku',
			funcName: 'encodeJob',
			args: 'toZenkaku',
			label: 'toZenkaku',
			description: '全角に変換',
		}, {
			// 半角に変換
			vscCommand: 'nekoaisle.toHankaku',
			funcName: 'encodeJob',
			args: 'toHankaku',
			label: 'toHankaku',
			description: '半角に変換',
		}, {
			// 文字をASCIIコードに変換
			vscCommand: 'nekoaisle.encodeASCII',
			funcName: 'encodeJob',
			args: "ASCII",
			label: 'ASCII',
			description: '文字をASCIIコードに変換',
		}, {
			// キャメルケースに変換
			vscCommand: 'nekoaisle.encodeCamel',
			funcName: 'encodeJob',
			args: "Camel",
			label: 'Camel',
			description: 'キャメルケースに変換',
		}, {
			// スネークケースに変換
			vscCommand: 'nekoaisle.encodeSnake',
			funcName: 'encodeJob',
			args: "Snake",
			label: 'Snake',
			description: 'スネークケースに変換',
		}, {
			// 式を評価
			vscCommand: 'nekoaisle.encodeEval',
			funcName: 'encodeJob',
			args: "eval",
			label: 'eval',
			description: '式を計算結果に変換',
		},

		// 以下エンコード
		{
			label: '=== エンコード ====================================',
		}, {
			// HTML エンコード
			vscCommand: 'nekoaisle.encodeHtml',
			funcName: 'encodeJob',
			args: 'HTML',
			label: 'HTML',
			description: '特殊文字を HTML エンティティに変換する',
		}, {
			// URL エンコード
			vscCommand: 'nekoaisle.encodeUrl',
			funcName: 'encodeJob',
			args: 'URL',
			label: 'URL',
			description: '文字列を URL エンコードする',
		}, {
			// BASE64 エンコード
			vscCommand: 'nekoaisle.encodeBase64',
			funcName: 'encodeJob',
			args: 'BASE64',
			label: 'BASE64',
			description: 'MIME base64 方式でデータをエンコードする',
		}, {
			// C言語文字列
			vscCommand: 'nekoaisle.encodeCString',
			funcName: 'encodeJob',
			args: 'c-string', 
			label: 'c-string',
			description: 'C 言語と同様にスラッシュで文字列をクォートする',
		}, {
			// 正規表現
			vscCommand: 'nekoaisle.encodePreg',
			funcName: 'encodeJob',
			args: 'preg', 
			label: 'preg',
			description: '正規表現文字をクオートする',
		}, {
			// '' の中身
			vscCommand: 'nekoaisle.encodeContentsOfSingleQuotation',
			funcName: 'encodeJob',
			args: "'", 
			label: "'",
			description: "' を \\' にする",
		}, {
			// "" の中身
			vscCommand: 'nekoaisle.encodeContentsOfDoubleQuotation',
			funcName: 'encodeJob',
			args: "'", 
			label: '"',
			description: '" を \\" にする',
		}, {
			// UNIXTIME
			vscCommand: 'nekoaisle.encodeContentsOfUnixtime',
			funcName: 'encodeJob',
			args: "UNIXTIME", 
			label: 'UNIXTIME',
			description: '日時文字列をUNIXTIMEに変換',
		}, {
			// \n -> <br />
			vscCommand: 'nekoaisle.encodeBr',
			funcName: 'encodeJob',
			args: "<br>", 
			label: '<br>',
			description: '\\n を <br />\\n にする',
		}, {
			// 16進数
			vscCommand: 'nekoaisle.encodeHex',
			funcName: 'encodeJob',
			args: "Hex", 
			label: 'Hex',
			description: '10進数を16進数に変換',
		}, {
			// 2進数
			vscCommand: 'nekoaisle.encodeBit',
			funcName: 'encodeJob',
			args: "Bit", 
			label: 'Bit',
			description: '10進数を2進数に変換',
		},
			
		// 以下デコード
		{
			label: '=== デコード =====================================',
		}, {
			// HTML デコード
			vscCommand: 'nekoaisle.decodeHtml',
			funcName: 'decodeJob',
			args: 'HTML', 
			label: 'HTML decode',
			description: 'HTML エンティティを適切な文字に変換する',
		}, {
			// URL デコード
			vscCommand: 'nekoaisle.decodeUrl',
			funcName: 'decodeJob',
			args: 'URL', 
			label: 'URL decode',
			description: 'URL エンコードされた文字列をデコードする',
		}, {
			// BASE64 デコード
			vscCommand: 'nekoaisle.decodeBase64',
			funcName: 'decodeJob',
			args: 'BASE64', 
			label: 'BASE64 decode',
			description: 'MIME base64 方式によりエンコードされたデータをデコードする',
		}, {
			// C言語文字列
			vscCommand: 'nekoaisle.decodeCString',
			funcName: 'decodeJob',
			args: 'c-string', 
			label: 'c-string decode',
			description: 'C 言語文字列をアンクォートする',
		}, {
			// 正規表現
			vscCommand: 'nekoaisle.decodePreg',
			funcName: 'decodeJob',
			args: 'preg', 
			label: 'preg decode',
			description: '正規表現文字をアンクオートする',
		}, {
			// '' の中身
			vscCommand: 'nekoaisle.decodeContentsOfSingleQuotation',
			funcName: 'decodeJob',
			args: "'", 
			label: "' decode",
			description: "\\' を ' にする",
		}, {
			// "" の中身
			vscCommand: 'nekoaisle.decodeContentsOfDoubleQuotation',
			funcName: 'decodeJob',
			args: "'", 
			label: '" decode',
			description: '\\" を " にする',
		}, {
			// UNIXTIME
			vscCommand: 'nekoaisle.decodeContentsOfUnixtime',
			funcName: 'decodeJob',
			args: "UNIXTIME", 
			label: 'UNIXTIME decode',
			description: 'UNIXTIMEを日時文字列に変換',
		}, {
			// UNIXTIME
			vscCommand: 'nekoaisle.decodeBr',
			funcName: 'decodeJob',
			args: "<br>", 
			label: '<br> decode',
			description: '<br /> を \\n にする',
		}, {
			// 16進数
			vscCommand: 'nekoaisle.decodeHex',
			funcName: 'decodeJob',
			args: "Hex", 
			label: 'Hex decode',
			description: '16進数を10進数に変換',
		}, {
			// 2進数
			vscCommand: 'nekoaisle.decodeBit',
			funcName: 'decodeJob',
			args: "Bit", 
			label: 'Bit decode',
			description: '2進数を10進数に変換',
		},
			
		// 以下 enclose
		{
			label: '=== 括り =======================================',
		}, {
			// '' 括り
			vscCommand: 'nekoaisle.encloseInSingleQuotation',
			funcName: 'enclose',
			args: ["'", "'"], 
			label: "''",
			description: '\' で単語または選択範囲を括る/外す',
		}, {
			// "" 括り
			vscCommand: 'nekoaisle.encloseInDoubleQuotation',
			funcName: 'enclose',
			args: ['"', '"'], 
			label: '""',
			description: '" で単語または選択範囲を括る/外す',
		}, {
			// `` 括り
			vscCommand: 'nekoaisle.encloseInGraveAccent',
			funcName: 'enclose',
			args: ['\u0060', '\u0060'], 
			label: '``',
			description: '\u0060 で単語または選択範囲を括る/外す',
		}, {
			// () 括り
			vscCommand: 'nekoaisle.encloseParenthesis',
			funcName: 'enclose',
			args: ['(', ')'], 
			label: '()',
			description: '() で単語または選択範囲を括る/外す',
		}, {
			// [] 括り
			vscCommand: 'nekoaisle.encloseSquareBracket',
			funcName: 'enclose',
			args: ['[', ']'], 
			label: '[]',
			description: '[] で単語または選択範囲を括る/外す',
		}, {
			// <> 括り
			vscCommand: 'nekoaisle.encloseAngleBracket',
			funcName: 'enclose',
			args: ['<', '>'], 
			label: '<>',
			description: '<> で単語または選択範囲を括る/外す',
		}, {
			// {} 括り
			vscCommand: 'nekoaisle.encloseCurlyBracket',
			funcName: 'enclose',
			args: ['{', '}'], 
			label: '{}',
			description: '{} で単語または選択範囲を括る/外す',
		}, {
			// {{}} 括り
			vscCommand: 'nekoaisle.encloseDoubleCurlyBracket',
			funcName: 'enclose',
			args: ['{{', '}}'], 
			label: '{{}}',
			description: '{{}} で単語または選択範囲を括る/外す',
		}, {
			// /**/ 括り
			vscCommand: 'nekoaisle.encloseCComment',
			funcName: 'enclose',
			args: ['/*', '*/'], 
			label: '/**/',
			description: '/**/ で単語または選択範囲を括る/外す',
		}, {
			// <!-- --> 括り
			vscCommand: 'nekoaisle.encloseHtmlComment',
			funcName: 'enclose',
			args: ['<!-- ', ' -->'], 
			label: '<!-- -->',
			description: 'HTML コメント/外す',
		}, {
			// <div class=""></div> 括り
			vscCommand: 'nekoaisle.encloseHtmlDiv',
			funcName: 'enclose',
			args: ['<div class="">\n', '\n</div>'], 
			label: '<div class="">',
			description: '<div class=""></div> で単語または選択範囲を括る/外す',
		}
	];

	/**
	 * 構築
	 */
	constructor(context: vscode.ExtensionContext) {
		const option: ExtensionOptions = {
			name: '選択範囲をエンコード',
			config: 'nekoaisle-encode',		// 通常はコマンドのサフィックス
		};
		super(context, option);

		option.commands = [
			{
				// メニュー表示
				command: 'nekoaisle.encode',
				callback: () => { this.menu(); }
			}, {
				// 任意の文字列で括るコマンド
				command: 'nekoaisle.enclose',
				callback: (arg: { start: string, end: string }) => {
					this.enclose(arg.start, arg.end);
				}
			}
		];

		// 機能を登録
		for (let data of MyExtention.commandInfo) {
			if (!data.funcName) {
				continue;
			}

			// コールバックを作成
			let callback = this.createCallback(data);

			// 登録するコマンド作成
			option.commands.push({
				command: data.vscCommand,
				callback: callback,
			});
		}

		// コマンドを登録
		this.registerCommands(context, option.commands);
	}

	/**
	 * コマンドごとのコールバックを作成
	 * @param data コマンド情報
	 * @returns コールバック用クロージャ
	 */
	public createCallback(data: CommandInfo): () => void {
		let callback: () => void;
		switch (data.funcName) {
			// エンコーダー
			case 'encodeJob': {
				callback = () => {
					let cmd = <string>data.args;
					this.encodeJob(cmd);
				}
				break;
			}
			// デコーダー
			case 'decodeJob': {
				callback = () => {
					let cmd = <string>data.args;
					this.decodeJob(cmd);
				}
				break;
			}
			// エンクロージャ
			case 'enclose': {
				callback = () => {
					let left = <string>data.args[0];
					let right = <string>data.args[1];
					this.enclose(left, right);
				}
				break;
			}
		}

		return callback;
	}

	/**
	 * メニューから選択して実行
	 */
	public menu() {
		// メニューを作成
		let menu: vscode.QuickPickItem[] = [];
		for (let data of MyExtention.commandInfo) {
			menu.push({
				label: data.label,
				description: data.description,
			});
		}

		// ファイルを選択
		let popt = {
			placeHolder: 'エンコードの種類を選択してください。',
		};
		vscode.window.showQuickPick(menu, popt)
			.then((sel: vscode.QuickPickItem) => {
				let data: CommandInfo;
				for (let d of MyExtention.commandInfo) {
					if (d.label === sel.label) {
						data = d;
						break;
					}
				}
				if (!data) {
					return;
				}
				// コールバックを作成
				let callback = this.createCallback(data);
				// コールバックの呼び出し
				callback();
			});
	}

	/**
	 * すべてのカーソル位置をエンコードする
	 * @param type 変換名
	 */
	protected async encodeJob(type: string) {
		if (!vscode.window.activeTextEditor) {
			return;
		}
		const editor = vscode.window.activeTextEditor;

		for (let i = 0; i < editor.selections.length; ++ i) {
			let sel = editor.selections[i];
			let str: string;
			if (!sel.isEmpty) {
				// 範囲選択されているのでそれを対象とする
				str = editor.document.getText(sel);
			} else {
				// // 範囲選択されていないのでカーソル位置の単語
				switch (type) {
					// 式の時は式に使える文字列
					case "eval": {
						str = editor.document.lineAt(sel.anchor.line).text;
						str = this.getExpression(str, sel.anchor.character);
						break;
					}
					// カーソル位置の単語
					default: {
						// カーソル位置の単語の範囲を取得
						let wordRange = Util.getCursorWordRange(editor, sel.start);
						// 単語の範囲の文字列を返す
						str = editor.document.getText(wordRange);
						// // 選択範囲を変更
						sel = new vscode.Selection(wordRange.start, wordRange.end);
					}
				}
			}

			// エンコードする
			str = this.encode(str, type);

			// 置換
			await editor.edit(edit => edit.replace(sel, str));
		}
	}
	
	/**
	 * すべてのカーソル位置をデコードする
	 * @param type 変換名
	 * @param editor 対象エディター
	 */
	protected async decodeJob(type: string) {
		if (!vscode.window.activeTextEditor) {
			return;
		}
		const editor = vscode.window.activeTextEditor;

		for (let i = 0; i < editor.selections.length; ++ i) {
			let sel = editor.selections[i];
			let str: string;
			if (!sel.isEmpty) {
				// 範囲選択されているのでそれを対象とする
				str = editor.document.getText(sel);
			} else {
				// 範囲選択されていないのでカーソル位置の単語
				// カーソル位置の単語の範囲を取得
				let wordRange = Util.getCursorWordRange(editor, sel.start);

				// 単語の範囲の文字列を返す
				str = editor.document.getText(wordRange);
				// 選択範囲を変更
				sel = new vscode.Selection(wordRange.start, wordRange.end);
			}

			// デコードする
			str = this.decode(str, type, editor);
			// 置換
			await editor.edit(edit => edit.replace(sel, str));
		}
	}

	/**
	 * 指定文字列をエンコードする
	 * @param str 対象文字列
	 * @param type 変換方法
	 * @param editor 対象エディター
	 */
	protected encode(str: string, type: string): string {
		// 変換
		switch (type) {
			// toUpperCase
			case 'toUpperCase': str = str.toLocaleUpperCase(); break;
			// toLoweCase
			case 'toLowerCase': str = str.toLocaleLowerCase(); break;
			// toZenkanu
			case 'toZenkaku': str = Util.hanToZen(str); break;
			// toHankaku
			case 'toHankaku': str = Util.zenToHan(str); break;
			// HTML encode
			case 'HTML': str = Util.encodeHtml(str); break;
			// URL encode
			case 'URL': str = encodeURIComponent(str); break;
			// BASE64
			case 'BASE64': str = new Buffer(str).toString('base64'); break;
			// C言語文字列
			case 'c-string': str = this.encodeCString(str); break;;
			// 正規表現
			case 'preg': str = this.encodePreg(str); break;
			// ""囲み文字列
			case '"':
				str = str.replace(/\\/g, '\\\\');
				str = str.replace(/"/g, '\\"');
				break;
			// ''囲み文字列
			case "'":
				str = str.replace(/\\/g, '\\\\');
				str = str.replace(/'/g, "\\'");
				break;
			// ``囲み文字列
			case "\u0060":
				str = str.replace(/\u0060/g, "\\u0060");
				break;
			// \n -> <br />
			case '<br>': {
				str = str.replace(/(<br(\str*\/)?>)?(\r?\n)/gi, '<br />\n');
				break;
			}
			// 日時文字列をUNIXTIMEに変換	
			case 'UNIXTIME': {
				let ux = Date.parse(str) / 1000;
				str = '' + ux;
				break;
			}
			// ASCIIコードに変換	
			case 'ASCII': {
				let a: string[] = [];
				for (let i = 0; i < str.length; ++ i) {
					a.push("0x" + str.charCodeAt(i).toString(16));
				}
				str = a.join(', ');
				break;
			}
			// キャメルケースに変換	
			case 'Camel': {
				let a: string[] = [];
				for (let s of str.split("_")) {
					a.push(s.substr(0, 1).toLocaleUpperCase() + s.substr(1).toLocaleLowerCase());
				}
				str = a.join('');
				break;
			}
			// スネークケースに変換
			case 'Snake': {
				let a: string[] = [];
				let re = /[A-Z][^A-Z]*/g;
				let m: RegExpExecArray;
				while (m = re.exec(str)) {
					a.push(m[0].toLocaleLowerCase());
				}
				str = a.join('_');
				break;
			}
			// 式を評価
			case 'eval': {
				try {
					str = Parser.evaluate(str).toString();
				} catch (e) {
					str = "error!";
				}
				break;
			}
			// 10進数を16進数に変換
			case 'Hex': {
				let n = parseInt(str, 10);
				str = n.toString(16);
				break;
			}
			// 10進数を2進数に変換
			case 'Bit': {
				let n = parseInt(str, 10);
				str = n.toString(2);
				break;
			}
		}
		return str;
	}

	/**
	 * 指定文字列をデコードする
	 * @param str 対象文字列
	 * @param type 変換方法
	 * @param editor 対象エディター
	 */
	protected decode(str: string, type: string, editor: vscode.TextEditor): string {
		// 変換
		switch (type) {
			// HTML encode
			case 'HTML': str = Util.decodeHtml(str); break;
			// URL encode
			case 'URL': str = decodeURIComponent(str); break;
			// BASE64
			case 'BASE64': str = new Buffer(str, 'base64').toString(); break;
			// C言語文字列
			case 'c-string': str = this.decodeCString(str); break;
			// 正規表現
			case 'preg': str = this.decodePreg(str); break;
			// ""囲み文字列
			case '"': {
				str = str.replace(/\\"/g, '"');
				str = str.replace(/\\\\"/g, '\\');
				break;
			}
			// ''囲み文字列
			case "'": {
				str = str.replace(/\\'/g, "'");
				str = str.replace(/\\\\"/g, '\\');
				break;
			}
			// ``囲み文字列
			case "\\u0060": {
				str = str.replace(/\\u0060/g, "\u0060");
				break;
			}
			// \n -> <br />
			case '<br>': {
				str = str.replace(/(<br(\str*\/)?>)(\r?\n)?/gi, '\n');
				break;
			}
			// UNIXTIME を日時文字列に変換
			case 'UNIXTIME': {
				let di = new DateInfo(parseInt(str, 10) * 1000);
				str = di.ymdhis;
				break;
			}	
			// 16進数を10進数に変換
			case 'Hex': {
				let n = parseInt(str, 16);
				str = n.toString(10);
				break;
			}
			// 2進数を10進数に変換
			case 'Bit': {
				let n = parseInt(str, 2);
				str = n.toString(10);
				break;
			}
		}

		return str;
	}

	/**
	 * C言語用文字列にエンコード
	 * @param s エンコードする文字列
	 */
	public encodeCString(s: string): string {
		return s.replace(/[\\\x00-\x1f]|/g, (s: string): string => {
			const tbl = {
				0x00: '\\0',		// @ NULL
				0x07: '\\a',		// G BELL 警告音
				0x08: '\\b',		// H BS   後退
				0x09: '\\t',		// I HT   水平タブ
				0x0a: '\\n',		// J LF   改行
				0x0b: '\\v',		// K VT   垂直タブ
				0x0c: '\\f',		// L FF   改ページ
				0x0d: '\\r',		// M CR   復帰
				'\\': '\\\\'		// \
			};
			let c = s.charCodeAt(0);
			if (tbl[c]) {
				// 制御コード
				s = tbl[c];
			}
			return s;
		});
	}

	/**
	 * C言語用文字列をデコードする
	 * @param s デコードする文字列
	 */
	protected decodeCString(s: string): string {
		return s.replace(/\\(?:([0-7]+)|x([0-9a-fA-F]+)|(.))/g, (s: string, p1: string, p2: string, p3: string): string => {
			if (p1) {
				// ８進数
				s = String.fromCharCode(parseInt(p1, 8));
			} else if (p2) {
				// １６進数
				s = String.fromCharCode(parseInt(p2, 16));
			} else if (p3) {
				// \に続く１文字
				const tbl = {
					'a': '\x07',		// G BELL 警告音
					'b': '\x08',		// H BS   後退
					't': '\x09',		// I HT   水平タブ
					'n': '\x0a',		// J LF   改行
					'v': '\x0b',		// K VT   垂直タブ
					'f': '\x0c',		// L FF   改ページ
					'r': '\x0d',		// M CR   復帰
				};
				if (tbl[p3]) {
					s = tbl[p3];
				} else {
					s = p3;
				}
			}
			return s;
		});
	}

	/**
	 * 正規表現構文の特殊文字の前にバックスラッシュを挿入します。
	 * @param s エンコードする文字列
	 */
	protected encodePreg(s: string): string {
		let r = '';
		for (let i = 0; i < s.length; ++i) {
			let c = s.substr(i, 1);
			if ('.\\+*?[^]$(){}=!<>|:-/'.indexOf(c) >= 0) {
				c = '\\' + c;
			}
			r += c;
		}
		return r;
	}

	/**
	 * 正規表現構文のエスケープシーケンスのバックスラッシュを取り除きます
	 * @param s デコードする文字列
	 */
	protected decodePreg(s: string): string {
		return s.replace(/\\(.)/g, (s: string, p1: string): string => {
			return p1;
		});
	}

	/**
	 * 選択範囲もしくはカーソル位置の単語を指定文字で括る
	 * @param start 開始文字
	 * @param end 終了文字
	 */
	protected async enclose(start: string, end: string) {
		if (!vscode.window.activeTextEditor) {
			return;
		}
		const editor = vscode.window.activeTextEditor;

		// 全カーソルについて処理
		for (let i = 0; i < editor.selections.length; ++i) {
			// 選択範囲を取得
			let sel = editor.selections.at(i);

			// 対象範囲の特定
			let range: vscode.Range;
			let selected = !sel.start.isEqual(sel.end);
			if (!selected) {
				// 範囲選択されていないのでカーソル位置の単語の範囲を取得
				range = Util.getCursorWordRange(editor, sel.active);
			} else {
				// 範囲選択されているのでその範囲を対象とする
				range = new vscode.Range(sel.start, sel.end);
			}
	
			// 対象となる文字列取得
			let word = editor.document.getText(range);

			let sl = start.length;
			let el = end.length;
			let wl = word.length;
			let newWord: string;
			// まずはこの文字列がすでに括られているかチェック
			let sw = word.substring(0, sl);
			let ew = word.substring(sl + wl);
			if ((sw == start) && (ew == end)) {
				// 括られているので外す
				newWord = word.substring(sl, sl + wl);
			} else {
				// 括られた中身だけを選択している場合の対応
				// １文字ずつ前後に広げる
				let outRange: vscode.Range;
				try {
					let s = range.start.translate(0, -start.length);
					let e = range.end.translate(0, end.length);
					outRange = new vscode.Range(s, e);
					let outWord = editor.document.getText(outRange);
					let ol = outWord.length;
					let sw = outWord.substring(0, sl);
					let ew = outWord.substring(ol - el, ol);
					if ((sw == start) && (ew == end)) {
						// すでに括られているの外す
						newWord = word;
						range = outRange;
					} else {
						// 括られていないので括る
						newWord = `${start}${word}${end}`;
					}
				} catch (err) {
					// 範囲を広げられなかったということは括られていない
					// 括られていないので括る
					newWord = `${start}${word}${end}`;
				}
			}
			// 置換
			await (editor.edit(edit => edit.replace(range, newWord)));
		}
	}

	/**
	 * 指定行の指定位置付近の式を取得
	 * @param str 行
	 * @param pos 
	 * @return 式
	 */
	public getExpression(str: string, x: number): string {
		// カーソル位置直前のホワイトスペースをスキップ
		let c: string;
		do {
			c = str.charAt(x - 1);
			if (" \t=".indexOf(c) < 0) {
				// ホワイトスペースや = 以外なのでこの位置
				break;
			}
			// 起点を1文字前へ
			--x;
			// = 以外ならループ
		} while (c !== "=")

		// 開始位置と終了位置を探す
		const chars = "01234567890abcdefghijklmnopqrstuvwxyz.+-*/%&|^(),!?[]<> \t";
		let s = x;
		while (s > 0) {
			let c = str.charAt(s - 1).toLowerCase();
			if (chars.indexOf(c) < 0) {
				// 開始位置発見
				break;
			}
			// 開始位置を1文字前へ
			--s;
		}
		let e = x;
		while (e < stringify.length) {
			if (chars.indexOf(str.charAt(e)) < 0) {
				// 終了位置発見
				break;
			}
			// 終了位置を1文字前へ
			++e;
		}

		return str.substring(s, e);
	}
}
