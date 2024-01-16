"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const expandDirectories = (fileUris) => {
    let expandedFileUris = [];
    fileUris.forEach((uri) => {
        if (fs.lstatSync(uri).isDirectory()) {
            const files = fs.readdirSync(uri).map((file) => `${uri}/${file}`);
            expandedFileUris = expandedFileUris.concat(expandDirectories(files));
        }
        else {
            expandedFileUris.push(uri);
        }
    });
    return expandedFileUris;
};
function activate(context) {
    console.log('Congratulations, your extension "copy-combined-markdown" is now active!');
    let disposable = vscode.commands.registerCommand("copy-combined-markdown.copy", (_selectedFile, fileUris) => {
        try {
            if (fileUris.length === 0) {
                vscode.window.showInformationMessage("No files selected.");
                return;
            }
            const paths = fileUris.map((uri) => uri.fsPath);
            // Expand directories recursively
            let uniqueFileUris = [...new Set(expandDirectories(paths))];
            Promise.all(uniqueFileUris.map(async (path) => {
                if (!fs.lstatSync(path).isDirectory()) {
                    const languageId = await vscode.workspace
                        .openTextDocument(path)
                        .then((doc) => doc.languageId);
                    const content = fs.readFileSync(path, "utf8");
                    return `${path}\n\`\`\`\`${languageId}\n${content}\n\`\`\`\`\n`;
                }
                else {
                    return ""; // Return an empty string or handle directories differently if needed
                }
            }))
                .then((combinedMarkdownArray) => {
                const combinedMarkdown = combinedMarkdownArray.join("\n");
                vscode.env.clipboard.writeText(combinedMarkdown);
                vscode.window.showInformationMessage(`Combined markdown for ${combinedMarkdownArray.length} file${combinedMarkdownArray.length !== 1 ? "s" : ""} copied to clipboard!`);
            })
                .catch((error) => {
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map