import * as vscode from "vscode";
import * as fs from "fs";

const expandDirectories = (fileUris: string[]) => {
  let expandedFileUris: string[] = [];
  fileUris.forEach((uri) => {
    if (fs.lstatSync(uri).isDirectory()) {
      const files = fs.readdirSync(uri).map((file) => `${uri}/${file}`);
      expandedFileUris = expandedFileUris.concat(expandDirectories(files));
    } else {
      expandedFileUris.push(uri);
    }
  });

  return expandedFileUris;
};

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "copy-combined-markdown" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    "copy-combined-markdown.copy",
    (_selectedFile: vscode.Uri, fileUris: vscode.Uri[]) => {
      try {
        if (fileUris.length === 0) {
          vscode.window.showInformationMessage("No files selected.");
          return;
        }

        const paths = fileUris.map((uri) => uri.fsPath);

        // Expand directories recursively
        let uniqueFileUris = [...new Set(expandDirectories(paths))];

        Promise.all(
          uniqueFileUris.map(async (path) => {
            if (!fs.lstatSync(path).isDirectory()) {
              const languageId = await vscode.workspace
                .openTextDocument(path)
                .then((doc) => doc.languageId);
              const content = fs.readFileSync(path, "utf8");
              return `${path}\n\`\`\`\`${languageId}\n${content}\n\`\`\`\`\n`;
            } else {
              return ""; // Return an empty string or handle directories differently if needed
            }
          })
        )
          .then((combinedMarkdownArray) => {
            const combinedMarkdown = combinedMarkdownArray.join("\n");
            vscode.env.clipboard.writeText(combinedMarkdown);
            vscode.window.showInformationMessage(
              `Combined markdown for ${combinedMarkdownArray.length} file${
                combinedMarkdownArray.length !== 1 ? "s" : ""
              } copied to clipboard!`
            );
          })
          .catch((error) => {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
          });
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${(error as Error).message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
