import { promises as fs, Dir, mkdir } from 'fs'
import { config } from '../src/config'
import Path from 'path'
import { md_parser_article, md_render } from './md-parser'
/**目录树 */
export type directory_tree = {
  /** 当前这级目录的名称 */
  directory: { [path: string]: directory_tree }
  files: {
    [path: string]: {} | md_file
  }
}

type md_file = {
  title: string
  meta: string[]
}
export async function directory_to_generate(directory_tree: directory_tree, path: string) {
  let paths: string[] = []
  for (const key in directory_tree.files) {
    if (!key.endsWith('.md')) continue
    const element = <md_file>directory_tree.files[key]
    paths.push(`[${element.title}](${key.replace(/.md$/, '.html')})`)
  }
  for (const key in directory_tree.directory) {
    const element = directory_tree.directory[key]
    directory_to_generate(element, Path.join(path, '/', key))
    paths.push(`[${key}/](${key})`)
  }
  /** 没有文章的不生成目录 */
  if (paths.length === 0) return
  paths = paths.map((str) => str)
  console.log(paths)

  const html = md_render(paths.join('\n'))
  /** 生成目录 */
  try {
    await fs.writeFile(Path.join(path, '/', 'index.html'), html)
  } catch (error) {
    console.error(error)
  }
}
