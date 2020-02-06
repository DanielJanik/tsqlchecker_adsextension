'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// The module 'azdata' contains the Azure Data Studio extensibility API
// This is a complementary set of APIs that add SQL / Data-specific functionality to the app
// Import the module and reference it with the alias azdata in your code below

//import * as azdata from 'azdata';
//import { debug } from 'util';
//import { start } from 'repl';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('decorator sample is activated');

	let timeout: NodeJS.Timer | undefined = undefined;
	// create a decorator type that we use to decorate small numbers

	const whiteDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			// this color will be used in light color themes
			borderColor: 'darkblue'
		},
		dark: {
			// this color will be used in dark color themes
			borderColor: 'lightblue'
		}
	});

    // create a decorator type that we use to decorate large numbers
	const yellowDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: { id: 'myextension.yellowBackground' }
    });
    
	// create a decorator type that we use to decorate large numbers
	const redDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: { id: 'myextension.redBackground' }
	});

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}

        /*
		const regEx = /\d+/g;
		const text = activeEditor.document.getText();
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];

        let match;

		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };

			if (match[0].length < 3) {
				smallNumbers.push(decoration);
			} else {
				largeNumbers.push(decoration);
			}
		}
		activeEditor.setDecorations(smallNumberDecorationType, smallNumbers);
        activeEditor.setDecorations(largeNumberDecorationType, largeNumbers);
        */
       
        //get all comments to compare later if needed
        const regEx = /\/\*[\s\S]*?\*\/|([^:]|^)\-\-.*$/g;
        const text = activeEditor.document.getText();
        const whitedecoration: vscode.DecorationOptions[] = [];
        const yellowdecoration: vscode.DecorationOptions[] = [];
        const reddecoration: vscode.DecorationOptions[] = [];

        //get document text and remove all comments (may not be used/needed)
        var sqltext = activeEditor.document.getText();
        sqltext = sqltext.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\-\-.*$/g, "");

        var comment_tuple = [];
        var i = 0;

        let match;

        //get all the comments
        while (match = regEx.exec(text)) {
            const startPos = activeEditor.document.positionAt(match.index);
            const endPos = activeEditor.document.positionAt(match.index + match[0].length);
            comment_tuple[i] = [startPos, endPos];
            i += 1;
        }

        //now let's look for issues but not inside the comments
        //OR let's  get all the issues and then compare their tuple with the comment tuple?
        
        //regex for "SELECT * FROM"
        const regExSelStar = /(\*,|,\*|, \*|select\s+\*\s+from|select\*\s+from|select\s+\*from|select\*from)/gim;

        while (match = regExSelStar.exec(text)) {
            const startPos = activeEditor.document.positionAt(match.index);
            const endPos = activeEditor.document.positionAt(match.index + match[0].length);
            const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'SELECT * is bad practice. This can result in poor data access due to lack of indexes. Applications may break if columns are added when * is used.' };
            
            whitedecoration.push(decoration);
        }

        // //find all with where then compare to all 
        // const regExNoWhere = /select\s+(.*?)\s*from\s+(.*?)\s*(where\s(.*?)\s*)/g;
        // const regExAllSelect = /select\s+(.*?)\s*from/g;

        // while (match = regExSelStar.exec(text)) {
        //     const startPos = activeEditor.document.positionAt(match.index);
        //     const endPos = activeEditor.document.positionAt(match.index + match[0].length);
        //     const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'SELECT * is bad practice. This can result in poor data access due to lack of indexes' };
            
        //     mydecoration.push(decoration);

        //     //comment_tuple[i] = [startPos, endPos];
        //     i += 1;
        // }

        const regExHints = /with\s+\(([^)]+)\)/gi;

        while (match = regExHints.exec(text)) {
            const regExHint = /holdlock|xlock|tablock|tablockx|paglock|rowlock|nolock|updlock|forceseek|forcescan/gi;

            while (match = regExHint.exec(text)) {
                const startPos = activeEditor.document.positionAt(match.index);
                const endPos = activeEditor.document.positionAt(match.index + match[0].length);
                
                var msg;

                switch (match[0].trim().toLowerCase()) {
                    case "holdlock":
                        msg = "HOLDLOCK sets 'serializable isolation' which reduces concurrency & performance but adds 'key range locks', which often are not needed.";
                        break;
                    case "xlock":
                        msg = "XLOCK forces an exclusive lock! This could severely limit performance by reducing concurrency. This hint may also be bypassed if used with a SELECT statement and no data has changed.";
                        break;
                    case "tablock":
                        msg = "TABLOCK promotes locks for this resource to a table lock. This could cause serious performance problems";
                        break;
                    case "tablockx":
                        msg = "TABLOCKX promotes locks for this resource to an exclusive table lock. This could cause serious performance problems";
                        break;
                    case "paglock":
                        msg = "PAGLOCK may take page locks in place of individual row locks. This is more of a suggestion so don't count on it ;)";
                        break;
                    case "rowlock":
                        msg = "ROWLOCK may take row locks in place of page locks. This can cause additional overhead for the sql engine and is not recommended.";
                        break;
                    case "nolock":
                        msg = "NOLOCK is like the duct tape of SQL Server. By setting this hint the query can return dirty data. Be sure your data doesn't matter.";
                        break;
                    case "updlock":
                        msg = "UPDLOCK holds locks for read operations until the transaction completes. If the lock escalates it can result in an exclusive table lock resulting in poor performance.";
                        break;
                    case "forceseek":
                        msg = "FORCESEEK causes the query optimizer to consider only index seek operations. This can result in poor performance.";
                            break;
                    case "forcescan":
                        msg = "FORCESCAN causes the query optimizer to consider only index scan operations. This can result in poor performance; however, can be useful when the number of rows is underestimated.";
                        break;
                    default:
                        console.log("missing a hint?");
                        break;
                }

                const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: msg };

                if (match[0].trim().toLowerCase() == "nolock"){
                    whitedecoration.push(decoration);
                }
                else 
                {
                    yellowdecoration.push(decoration);
                }
                
            }
        }
        
        const regExJoinHints = /(loop\s+join|hash\s+join|merge\s+join|remote\s+join)/gim;

        while (match = regExJoinHints.exec(text)) {
            const startPos = activeEditor.document.positionAt(match.index);
            const endPos = activeEditor.document.positionAt(match.index + match[0].length);
            const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: "Using join hints can seriously reduce performance, either immdiately or overtime as data changes. This hint is not recommended." };
            reddecoration.push(decoration);
        }

        const regExOptions = /option\s+\(([^)]+)\)/gi;

        while (match = regExOptions.exec(text)) {
            const regExHint = /fast|no_performance_spool|force\s+order|maxdop|optimize\s+for|robust\s+plan/gi;

            while (match = regExHint.exec(text)) {
                const startPos = activeEditor.document.positionAt(match.index);
                const endPos = activeEditor.document.positionAt(match.index + match[0].length);
                
                var msg;

                switch (match[0].trim().toLowerCase()) {
                    case "fast":
                        msg = "FAST 'n' specifies that the query is optimized for fast retrieval This can in rare cases improve performance but overall is not recommended. If you check the query plan, row estimates are modified to 'n' in place of statistics. This can harm performance.";
                        break;
                    case "no_performance_spool":
                        msg = "Tells the optimizer to avoid spool operations. This could harm performance. Some spool operations are manditory for Halloween Protection.";
                        break;
                    case "force order":
                        msg = "Tells the optimizer to use the join order as written in the query. This could harm performance.";
                        break;
                    case "maxdop":
                        msg = "MAXDOP 'n' tells the optimizer to limit the degree of parallelism to 'n'. The instance can benefit from MAXDOP 1 for large queries from that user in accounting. :) Note that limiting this can reduce the query performance but may improve overall performance in the instance.";
                        break;
                    case "optimize for":
                        msg = "Consider using a plan guide in place of the query hint OPTIMIZE FOR.";
                        break;
                    case "robust plan":
                        msg = "Forces the Query Optimizer to try a plan that works for the maximum potential row size, possibly at the expense of performance.";
                        break;
                    default:
                        console.log("missing a hint?");
                        break;
                }

                const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: msg };

                if (match[0].trim().toLowerCase() == "no_performance_spool"){
                    reddecoration.push(decoration);
                }
                else if (match[0].trim().toLowerCase() == "maxdop"){
                    whitedecoration.push(decoration);
                }
                else 
                {
                    yellowdecoration.push(decoration);
                }
                
            }
        }
       
        activeEditor.setDecorations(whiteDecorationType, whitedecoration);
        activeEditor.setDecorations(yellowDecorationType, yellowdecoration);
        activeEditor.setDecorations(redDecorationType, reddecoration);
	}

	function triggerUpdateDecorations() {
		if (timeout) {

			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);
}

// this method is called when your extension is deactivated
export function deactivate() {
}