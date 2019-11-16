import { config } from './config'
import { promises as fs, Dir, mkdir } from 'fs'
import { md_parser_article } from '../lib/md-parser'
import Path from 'path'
import { directory_tree, directory_to_generate } from '../lib/directory_to_generate'
/** 程序一进来的时候的时间 */

config.input_dir = Path.resolve(config.input_dir)
config.out_dir = Path.resolve(config.out_dir)
console.time('总共耗时')
void (async function() {
  const three: directory_tree = {
    directory: {},
    files: {},
  }
  await parse(config.input_dir, three)
  directory_to_generate(three, config.out_dir)
  console.log(three)

  process.once('exit', () => {
    console.timeEnd('总共耗时')
  })
})()

async function parse(path: string, three: directory_tree) {
  const res = await fs.readdir(path, { withFileTypes: true })
  /** 所有的文件 */
  const files = res.filter((dirent) => dirent.isFile())
  /** 目录 */
  const directory = res.filter((dirent) => dirent.isDirectory())

  /** 递归目录 */
  await Promise.all(
    directory.map(async (dirent) => {
      three.directory[dirent.name] = {
        directory: {},
        files: {},
      }
      return await parse(Path.join(path, dirent.name), three.directory[dirent.name])
    }),
  )

  /** 复制文件到目标目录 */
  await Promise.all(
    files.map(async (dirent) => {
      three.files[dirent.name] = {}
      const file_path = Path.join(path, '/', dirent.name)
      const out_file_path = file_path.replace(config.input_dir, config.out_dir)
      try {
        await fs.copyFile(file_path, out_file_path)
      } catch (error) {
        await fs.mkdir(Path.dirname(out_file_path), { recursive: true })
        await fs.copyFile(file_path, out_file_path)
      }
    }),
  )
  /** md 的文件 */
  await Promise.all(
    files
      .filter((dirent) => dirent.name.endsWith('.md'))
      .map(async (dirent) => {
        const file_path = Path.join(path, '/', dirent.name)
        let file
        try {
          file = md_parser_article(await (await fs.readFile(file_path)).toString())
        } catch (error) {
          return console.error(error)
        }
        const out_file_path = Path.resolve(__dirname, file_path.replace(/md$/, 'html')).replace(
          config.input_dir,
          config.out_dir,
        )
        try {
          await fs.writeFile(out_file_path, file.html)
        } catch (error) {
          await fs.mkdir(Path.dirname(out_file_path), { recursive: true })
          await fs.writeFile(out_file_path, file.html)
        }
        delete file.html
        three.files[dirent.name] = file
      }),
  )
  return files
}
