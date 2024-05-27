'use strict';
import * as vscode from 'vscode';
import { Util, Extension } from './nekoaisle.lib/nekoaisle';

export interface ListItem {
	label: string;										// メニューラベル
	detail?: string;									// 詳細
	description?: string;							// 説明
	command?: string;									// コマンド指定
	args?: { [key: string]: any };	// インラインテンプレート
	languageID?: string | string[];		// ファイルタイプ指定
	hide?: boolean;										// メニューに表示しない
}

interface ListItems {
	[key: string]: ListItem[]
}

interface CommandParam {
	command: string;
	args: any[];
}

export class CommandMenu extends Extension {
	/**
	 * 構築
	 */
	constructor(context: vscode.ExtensionContext) {
		super(context, {
			name: 'nekoaisle-command-menu',
			config: 'nekoaisle-command-menu',
			commands: [
				{
					command: 'nekoaisle-command-menu.menu',
					callback: (menuName?: string) => { this.entry(menuName); }
				},
				{
					command: 'nekoaisle-command-menu.multi',
					callback: (commands: CommandParam | CommandParam[]) => { this.multiCommand(commands); }
				}
			]
		});
	}

	/**
	 * エントリー
	 */
	protected entry(menuName: string = 'default') {
		// メニューJsonの読み込み
		let menuInfo = this.loadMenuInfo(menuName);
		if (menuInfo.length === 0) {
			Util.putMess(`menuName が見つかりません。`);
			return;
		}
		// メニューの作成
		let menu = this.makeMenu(menuInfo);

		// QuickPick オブジェクトを作成
		const quickPick = vscode.window.createQuickPick();
		quickPick.items = menu;
		quickPick.placeholder = '選択してください。';
		quickPick.matchOnDetail = false;
		quickPick.matchOnDescription = false;

		/**
		 * 入力文字列が変更された処理設定
		 * ※1文字入力したら実行
		 */
		quickPick.onDidChangeValue((value: string) => {
			// 全角→半角に変換
			value = Util.zenToHanForSelect(value);
			// 小文字を大文字に変換
			value = value.toUpperCase();
			// 実行
			if (this.exec(menuInfo, value)) {
				// 実行したのでクイックピックを閉じる
				quickPick.hide();
			}
		});

		/**
		 * エンターを押した処理設定
		 */
		quickPick.onDidAccept(() => {
			let picks = quickPick.selectedItems;
			if (picks.length === 1) {
				let pick = picks[0];
				if (pick) {
					// 選択しているので実行
					this.exec(menuInfo, pick);
				}
			}
			// エンター押した場合は必ず閉じる
			quickPick.hide();
		});

		// 非表示にしたら破棄設定
		quickPick.onDidHide(() => quickPick.dispose());

		// 開く
		quickPick.show();
	}

	/**
	 * 複数コマンド実行
	 * @param commands コマンド
	 */
	protected async multiCommand(commands: CommandParam | CommandParam[]) {
		let cmd: CommandParam[];
		if (!Array.isArray(commands)) {
			commands = [commands];
		}
		
		for (let cmd of commands) {
			await vscode.commands.executeCommand(cmd.command, cmd.args);
		}
	}

	/**
	 * メニューを読み込む
	 * @param menuName メニュー名もしくはメニューファイル名
	 */
	public loadMenuInfo(menuName: string = 'default'): ListItem[] {
		let dic: { [key: string]: ListItem } = {};
		let menus: ListItems | null;

		const setDic = (menus: ListItems | null) => {
			if (menus && menus[menuName]) {
				let menu = menus[menuName];
				for (let key in menu) {
					let item = menu[key];
					// ラベルを大文字に変換
					let label = item.label.toLocaleUpperCase();
					item.label = label;
					dic[label] = item;
				}
			}
		}

		// デフォルトの読み込み
		if (menuName === 'default') {
			let fn = this.joinExtensionRoot("data/defaults.json");
			menus = <ListItems | null>Util.loadFileJson(fn);
			setDic(menus);
		}
		
		// ユーザー設定メニューの読み込み
		menus = this.getConfig<ListItems | null>('menus', null);
		setDic(menus);

		// 配列に変換
		let menu: ListItem[] = [];
		// for in で取れる要素の順番が変わる＞＜；
		for (let key in dic) {
			menu.push(dic[key]);
		}

		// 並べ替え
		menu.sort((a, b) => {
			// 記号 < 数字 < 英字 の順の先頭文字の重みを取得
			let aw = Util.calcLabelSortWeight(a.label);
			let bw = Util.calcLabelSortWeight(b.label);
			return Util.compareSort(aw, bw);
		});

		// メニューを返す
		return menu;
	}

	/**
	 * メニューの作成
	 * @param menuInfo メニュー情報配列
	 */
	protected makeMenu(menuInfo: ListItem[]): vscode.QuickPickItem[] {
		let langID: string | undefined;
		if (!vscode.window.activeTextEditor) {
			// エディターがないので言語指定はなし
			langID = undefined;
		} else {
			let editor = <vscode.TextEditor>vscode.window.activeTextEditor;
			langID = editor.document.languageId;
		}

		// メニューを作成
		let menu: vscode.QuickPickItem[] = [];
		for (let item of menuInfo) {
			if (item.hide) {
				// 非表示は無視
				continue;
			}
			if (item.languageID) {
				// 言語が限定されている
				let langs: string[];
				if (typeof item.languageID === 'string') {
					// 単一指定は配列に変換
					langs = [item.languageID];
				} else if (Array.isArray(item.languageID)) {
					// 配列はそのまま使用
					langs = item.languageID;
				} else {
					// それ以外はエラー
					Util.putMess(`"${item.label} ${item.description}" の "languageID" が不正です。文字列または文字列の配列で指定してください。 `);
					continue;
				}

				let equ = false;
				for (let l of langs) {
					if (l === langID) {
						equ = true;
						break;
					}
				}
				if (!equ) {
					// 一致する言語がなかったのでメニューから除外
					continue;
				}
			}
			// メニューに設定
			menu.push({
				label: item.label,
				description: item.description,
				detail: item.detail,
			});
		}

		return menu;
	}

	/**
	 * コマンドを実行する
	 * ２箇所で使うのでサブルーチン化
	 * @param label 入力された文字列
	 * @return true 実行した
	 */
	public exec(menuInfo: ListItem[], label: string): boolean;
	public exec(menuInfo: ListItem[], item: any): boolean;
	public exec(menuInfo: ListItem[], arg: string | any): boolean {
		switch (typeof arg) {
			// オブジェクト
			case 'object': {
				// vscode.QuickPickItem
				const item: vscode.QuickPickItem = arg;
				for (let info of menuInfo) {
					if (info.command) {
						// コマンドがある
						if (item.label === info.label) {
							if (item.description === info.description) {
								if (item.detail === info.detail) {
									// すべて一致したので実行
									vscode.commands.executeCommand(info.command, info.args);
									return true;
								}
							}
						}
					}
				}
				break;
			}
			// 文字列
			case 'string': {
				const label: string = arg;
				// 入力された文字の長さを取得
				let len = arg.length;
				if (!len) {
					// 入力されていないので実行しない
					break;
				}

				// 文字列が一致するものをピックアップ
				let sels: ListItem[] = [];
				for (let item of menuInfo) {
					if (!item.command) {
						// コマンドなしは無視
						continue;
					}
					// 各メニューの先頭を比較
					let c = item.label.substring(0, len).toUpperCase();
					if (c === label) {
						// 一致した
						sels.push(item);
					}
				}

				if (sels.length !== 1) {
					// 一致しないか複数一致した
					break;
				}

				// 存在したので実行
				let sel = sels[0];
				vscode.commands.executeCommand(<string>sel.command, sel.args);
				return true;
			}
		}

		// 実行しなかった
		return false;
	}
}

