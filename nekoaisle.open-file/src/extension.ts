'use strict';
import * as vscode from 'vscode';
import OpenFile = require( './OpenFile' );
import OpenLog = require( './OpenLog' );
import OpenRelated = require( './OpenRelated' );
import OpenNew = require( './OpenNew' );
import OpenTemp = require('./OpenTemp');
import InsertFile = require('./InsertFile');
import OpenHist = require('./OpenHist');
import OpenTag = require('./OpenTag');
import FindOpen = require('./FindOpen');

/**
 * エクステンション起動
 * @param context 
 */
export function activate(context: vscode.ExtensionContext) {
  /* tslint:disable:no-unused-expression */
  new OpenFile(context);
  new OpenLog(context);
  new OpenRelated(context);
  new OpenNew(context);
  new OpenTemp(context);
  new InsertFile(context);
  new OpenHist(context);
  new OpenTag(context);
  new FindOpen(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

