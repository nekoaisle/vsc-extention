	/**
	 * 構築
	 */
	constructor(context: vscode.ExtensionContext) {
		super(context, {
			name: '拡張機能名',
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
