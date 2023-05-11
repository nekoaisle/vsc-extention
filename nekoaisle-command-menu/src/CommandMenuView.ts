'use strict';
import * as vscode from 'vscode';
import * as Util from './nekoaisle.lib/Util'
import { CommandMenu, ListItem } from './CommandMenu'

class CommandMenuView {
	readonly commandMenu: CommandMenu;
	readonly view;
	readonly nodes: any = {};

	private items: ListItem[];

	/**
	 * 構築
	 * @param context 
	 * @param commandMenu 
	 */
	constructor(
		context: vscode.ExtensionContext,
		commandMenu: CommandMenu
	) {
		this.commandMenu = commandMenu;
		this.items = commandMenu.loadMenuInfo();

		// ツリービューを構築
		const options: vscode.TreeViewOptions<ListItem> = {
			treeDataProvider: this.treeDataProvider(),
			showCollapseAll: true
		}
		this.view = vscode.window.createTreeView('nekoaisle-command-menu-view', options);
		context.subscriptions.push(this.view);

		// コマンド登録
		vscode.commands.registerCommand(
			'nekoaisle-command-menu-view.reveal', () => { this.reveal(); }
		);
		vscode.commands.registerCommand(
			'nekoaisle-command-menu-view.changeTitle', () => this.changeTitle()
		);
		vscode.commands.registerCommand(
			'nekoaisle-command-menu-view.exec', (arg: string) => this.exec(arg)
		);
	}

	/**
	 * 公開
	 */
	public async reveal() {
		const inputOption = {
			placeHolder: '表示するアイテムのラベルを入力してください。'
		};
		const label = await vscode.window.showInputBox();
		if (label) {
			const item = {
				label: label,
			};
			const revealOption = {
				focus: true,
				select: false,
				expand: true
			};
			await this.view.reveal(item, revealOption);
		}
	}

	/**
	 * ビュータイトルの変更
	 */
	public async changeTitle() {
		const title = await vscode.window.showInputBox(
			{
				prompt: 'コマンドメニュー ビューの新しいタイトルを入力してください。',
				placeHolder: this.view.title
			}
		);
		if (title) {
			this.view.title = title;
		}
	}

	/**
	 * 実行(ツリーアイテムをクリックした)
	 */
	private exec(label: string) {
		this.commandMenu.exec(this.items, label);
	}

	/**
	 * Tree data provider
	 * @returns 
	 */
	private treeDataProvider(): vscode.TreeDataProvider<ListItem> {
		return {
			// 指定要素の子要素を取得
			getChildren: this.getChildren,
			// 指定要素の表示情報を返す
			getTreeItem: this.getTreeItem,
			// 指定要素の親要素を返す
			getParent: this.getParent,
		};
	}

	// 指定要素の子要素を取得
	getChildren = (ele?: ListItem): ListItem[] | undefined => {
		if (!ele) {
			return this.items;
		}
		return;
	};
	// 指定要素の表示情報を返す
	getTreeItem = (ele: ListItem): vscode.TreeItem => {
		let item: vscode.TreeItem = {};

		if (ele) {
			item.label = `${ele.label} ${ele.description}`;
			item.command = {
				command: 'nekoaisle-command-menu-view.exec',
				title: ele.description ?? ele.command ?? '',
				arguments: [ele.label],
			};
		}

		//
		return item;
	};
	// 指定要素の親要素を返す
	getParent = (ele: ListItem): ListItem | undefined => {
		return;
	};

	// 指定要素の子要素を取得
	getChildren2(ele?: ListItem): ListItem[] | undefined {
		if (!ele) {
			return this.items;
		}
		return;
	};
	// 指定要素の表示情報を返す
	getTreeItem2(ele: ListItem): vscode.TreeItem {
		let label: string;
		if (ele) {
			label = `${ele.label} ${ele.description}`;
		} else {
			label = '';
		}
		return {
			// id: ele.command,
			label: label,
		};
	};
	// 指定要素の親要素を返す
	getParent2(ele: ListItem): ListItem | undefined {
		return;
	};

}

export default CommandMenuView;