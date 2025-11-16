import { parseArgs } from "node:util"
import { author, name, version } from "~/package.json"

export const helpMessage = `Version:
  ${name}@${version}

Usage:
  $ ${name} [options]

Options:
  -v, --version  Display version
  -h, --help     Display help

Author:
  ${author.name} <${author.email}> (${author.url})`

export const parse: typeof parseArgs = (config) => {
  try {
    return parseArgs(config)
  } catch (err: any) {
    throw new Error(`Error parsing arguments: ${err.message}`)
  }
}

export const getVersion = () => `${name}@${version}`
