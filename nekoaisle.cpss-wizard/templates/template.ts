/**
 * ___title___
 * 
 * filename:  ___filename___
 * 
 * @package   
 * @version   1.0.0
 * @copyright Copyright (C) ___copyright___ Yoshio Kiya All rights reserved.
 * @date      ___date___
 * @author    ___author___
 */
'use strict';
import * as vscode from 'vscode';
import {Util} from './nekoaisle.lib/Util';
import {Extension} from './nekoaisle.lib/Extension';

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

/**
 * ___title___
 */
class MyExtention extends Extension {
	/**
	 * 構築
	 */
	constructor(context: vscode.ExtensionContext) {
		super(context, {
			name: '___title___',
			config: '',		// 通常はコマンドのサフィックス
			commands: [
				{
					command: 'nekoaisle.',	// コマンド
					callback: () => {
						this.exec()
					}
				}
			]
		});
	}

	/**
	 * 実行
	 */
	public exec() {
	}
}
