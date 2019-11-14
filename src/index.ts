import { config } from "./config";
import { promises as fs, Dir, mkdir } from "fs";
import { md_parser } from "../lib/md-parser";
import Path from "path";

const input_dir = Path.resolve(config.input_dir)
const out_dir = Path.resolve(config.out_dir)
console.log("输入输出", input_dir, out_dir);

void async function () {
    parse(input_dir)
}()


async function parse(path: string) {
    const res = await fs.readdir(path, { withFileTypes: true });
    /** 目录 */
    res.filter(dirent => dirent.isDirectory()).forEach(dirent => parse(Path.join(path, dirent.name)))
    const files = res.filter(dirent => dirent.isFile())
    /** md 的文件 */
    files.filter(dirent => dirent.name.endsWith('.md')).forEach(async dirent => {
        const file_path = Path.join(path, "/", dirent.name)
        const html = md_parser(await (await fs.readFile(file_path)).toString())
        const out_file_path = Path.resolve(__dirname, file_path.replace(/md$/, "html")).replace(input_dir, out_dir)
        try {
            await fs.writeFile(out_file_path, html)
        } catch (error) {
            console.log(Path.dirname(out_file_path));
            await fs.mkdir(Path.dirname(out_file_path), { recursive: true })
            await fs.writeFile(out_file_path, html)
        }


    })
}
