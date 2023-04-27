// ファイルを選択
let menu: string[];
let popt = {
	prompt: '',
	placeHolder: '',
};
vscode.window.showQuickPick(menu, popt)
.then((sel: string) => {
});
