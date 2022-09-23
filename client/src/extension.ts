/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ExtensionContext } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient'
import vscode = require('vscode')
import * as util from 'util'
import * as path from 'path'

let client: LanguageClient
let output: vscode.OutputChannel

export async function activate(context: ExtensionContext) {
  output = vscode.window.createOutputChannel('sqls')

  const config = await parseLanguageServerConfig()
  output.appendLine(util.inspect(config))

  let serverOptions: ServerOptions = {
    command: 'sqls',
    args: [...config.flags],
  }

  let clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'sql', pattern: '**/*.sql' },
    ],
  }

  client = new LanguageClient('sqls', serverOptions, clientOptions)
  client.start()
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined
  }
  return client.stop()
}

interface LanguageServerConfig {
  flags: string[]
}

export async function parseLanguageServerConfig(): Promise<LanguageServerConfig> {
  const sqlsConfig = getSqlsConfig()
  const config = {
    flags: sqlsConfig['languageServerFlags'] || [],
  }
  const configFlagIdx = config.flags.indexOf('-config') + 1
  if (configFlagIdx) {
    const configPath = config.flags[configFlagIdx]
    if (configPath && !path.isAbsolute(configPath)) {
      const [configFileUri] = await vscode.workspace.findFiles(configPath)
      config.flags[configFlagIdx] = configFileUri.fsPath
    }
  }
  return config
}

export function getSqlsConfig(uri?: vscode.Uri): vscode.WorkspaceConfiguration {
  if (!uri) {
    if (vscode.window.activeTextEditor) {
      uri = vscode.window.activeTextEditor.document.uri
    } else {
      uri = null
    }
  }
  return vscode.workspace.getConfiguration('sqls', uri)
}
