import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {Util, PathInfo} from './nekoaisle';

/**
 * ファイル選択
 * @param dirName ディレクトリー名
 * @param title タイトル
 * @return プロミス
 */
export class SelectFile {

	protected excludes: { [key: string]: string} = {};

	/**
	 * 除外辞書作成
	 */
	public async makeExcludesDic() {
		for (let i in this.excludes) {
			// 作成済み
			return;
		}

		// 除外ファイルを取得
    let excludes: string = [
      ...Object.keys(vscode.workspace.getConfiguration('search').get('exclude') || {}),
      ...Object.keys(vscode.workspace.getConfiguration('files').get('exclude') || {})
    ].join(',');

		// 辞書にする
		for (let exclud of excludes.split(',')) {
			this.excludes[exclud] = exclud;
		}
	}

	/**
	 * ファイル選択
	 * @param dirName ディレクトリー名
	 * @param title   タイトル名
	 * @param asc     昇順にソート
	 */
	public async selectFile(dirName: string, title: string, asc: boolean = true): Promise<string> {
		// 除外ファイル辞書を作成
		await this.makeExcludesDic();

		let files: string[];
		try {
			files = fs.readdirSync(dirName);

			files = files.filter((value: string) => {
				// ファイルの存在を確認
				let full = path.join(dirName, value);
				if (!fs.existsSync(full)) {
					// 存在しなければ除外
					return false;
				}

				if (this.excludes[value]) {
					// 除外
					return false;
				} else {
					// 有効
					return true;
				}
			});

			// ディレクトリ名の末尾に / を付ける
			files = files.map((name: string): string => {
				let statas = fs.statSync(path.join(dirName, name));
				if (statas.isDirectory()) {
					name += '/';
				}
				return name;
			});

			// 並べ替える
			files = files.sort((a: string, b: string): number => {
				// ディレクトリーか調べる
				let da: boolean = a.substr(-1) === '/';
				let db: boolean = b.substr(-1) === '/';
				if (da !== db) {
					// どちらかかがディレクトリ
					return da ? -1 : 1;
				} else {
					// 両方ディレクトリかファイルなので名前で比較
					a = a.toLocaleUpperCase();
					b = b.toLocaleUpperCase();
					return ((a < b) ? -1: (a > b) ? 1 : 0) * (asc ? 1 : -1);
				}
			});

			// ルートディレクトリでなければ先頭に ../ を追加
			if (dirName !== '/') {
				files.unshift('../');
			}
		} catch (e) {
			Util.putMess(`${dirName} が開けませんでした。`);
			return '';
		}

		// ファイルを選択
		let popt = {
			prompt: title,
			placeHolder: dirName,

		};
		let sel = await vscode.window.showQuickPick(files, popt);
		if (!sel) {
			// ファイルが指定されなかったときは完了(then()を実行)
			return '';
		}
		// ディレクトリ名と結合
		let fn: string = path.join(dirName, sel);
		// 絶対パスに変換
		fn = Util.normalizePath(fn);  // 絶対パスにする

		// ディレクトリーか調べる
		let stats: fs.Stats = fs.statSync(fn);
		if ( !stats.isDirectory() ) {
			// ファイルなので完了(then()を実行)
			return fn;
		}
		// ディレクトリーなら選択を続行
		fn = await this.selectFile(fn, title);
		return fn;
	}

	/**
	 * ファイル選択
	 * @param dirName ディレクトリー名
	 * @param title   タイトル名
	 * @param asc     昇順にソート
	 */
	public selectFileOld(dirName: string, title: string, asc: boolean = true): Promise<string> {
		return new Promise<string>((resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: any) => void) => {
			// 非同期の処理
			let files: string[];
			try {
				files = fs.readdirSync(dirName)
				// ディレクトリ名の末尾に / を付ける
				.map((name: string): string => {
					let statas = fs.statSync(path.join(dirName, name));
					if (statas.isDirectory()) {
						name += '/';
					}
					return name;
				})
				// 並べ替える
				.sort((a: string, b: string): number => {
					// ディレクトリーか調べる
					let da: boolean = a.substr(-1) === '/';
					let db: boolean = b.substr(-1) === '/';
					if (da !== db) {
						// どちらかかがディレクトリ
						return da ? -1 : 1;
					} else {
						// 両方ディレクトリかファイルなので名前で比較
						a = a.toLocaleUpperCase();
						b = b.toLocaleUpperCase();
						return ((a < b) ? -1: (a > b) ? 1 : 0) * (asc ? 1 : -1);
					}
				});
				if (dirName !== '/') {
					// ルートディレクトリでなければ先頭に ../ を追加
					files.unshift('../');
				}
			} catch (e) {
				Util.putMess(`${dirName} が開けませんでした。`);
				return;
			}
			// ファイルを選択
			let popt = {
				prompt: title,
				placeHolder: dirName,

			};
			vscode.window.showQuickPick(files, popt)
			.then((sel: string | undefined) => {
				if (!sel) {
					// ファイルが指定されなかったときは完了(then()を実行)
					resolve('');
				} else {
					// ディレクトリ名と結合
					let fn: string = path.join(dirName, sel);
					// 絶対パスに変換
					fn = Util.normalizePath(fn);  // 絶対パスにする

					// ディレクトリーか調べる
					let stats: fs.Stats = fs.statSync(fn);
					if ( !stats.isDirectory() ) {
						// ファイルなので完了(then()を実行)
						resolve(fn);
					} else {
						// ディレクトリーなら選択を続行
						this.selectFile(fn, title).then((value: string | undefined) => {
							if (value) {
								return value;
							} else {
								return '';
							}
						});
					}
				}
			});
		});
	}
}
