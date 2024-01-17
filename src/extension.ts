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

              // Count the longest sequence of '```' in the content
              // and add one more to the end of the string
              const longestSequence = content
                .match(/`{3,}/g)
                ?.reduce((acc, cur) => {
                  return cur.length > acc.length ? cur : acc;
                });
              const numberOfBackticks = longestSequence
                ? longestSequence.length + 1
                : 3;
              const backticks = "`".repeat(numberOfBackticks);

              // Replace the project root path with a relative path
              const workspaceFolders = vscode.workspace.workspaceFolders;
              const workspaceFolder = workspaceFolders
                ? workspaceFolders[0].uri.fsPath
                : "";
              const relativePath = path.replace(workspaceFolder, ".");

              return `${relativePath}\n${backticks}${languageId}\n${content}\n${backticks}\n`;
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
