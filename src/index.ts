import { promises as fs } from "fs";
import fse from "fs-extra";
import Path, { resolve } from "path";
import { directory_to_generate, directory_tree } from "../lib/directory_to_generate";
import { md_parser_article } from "../lib/md-parser";
import { config, getTemplate } from "./config";
import yargs from "yargs";
/** 提供给模板使用，html中会引用这个 */
export let res = {} as any;
/** 程序一进来的时候的时间 */
/** 提供给文件引用配置资源用用 */
config.input_dir = Path.resolve(config.input_dir);
config.out_dir = Path.resolve(config.out_dir);
config.filter_dir = config.filter_dir.map((path) => Path.resolve(path));
yargs
  .command("build", "编译", async (argv) => {
    const three = {
      directory: {},
      files: {},
    } as directory_tree;
    function three_forEach(three: directory_tree, cb: (par: directory_tree["files"][string]) => void) {
      for (const key in three.files) {
        if (three.files.hasOwnProperty(key)) {
          const element = three.files[key];
          cb(element);
        }
      }
      for (const key in three.directory) {
        if (three.directory.hasOwnProperty(key)) {
          const element = three.directory[key];
          three_forEach(element, cb);
        }
      }
    }
    res = await getTemplate();
    const three_json = await parse(config.input_dir, three);
    const out_json = [] as { path: string; title: string; content_hash: string }[];
    three_forEach(three_json, (file) => {
      out_json.push({ title: file.title, path: file.path, content_hash: file.content_hash });
    });
    console.log(JSON.stringify(out_json));
    directory_to_generate(three, config.out_dir, res);
  })
  .command(
    "buildarticle [path]",
    "编译单篇文章",
    (yargs) => {},
    async (argv) => {
      res = await getTemplate();
      //@ts-ignore
      console.log(JSON.stringify(await article_parse(String(argv.path), res)));
    },
  )
  .usage("------  llej doc 崮生的博客文档生成器  -------")
  .example("search tags", "[ 所有包含tags 的文章 ]")
  .help("h")
  .alias("h", "help")
  .epilog("copyright 崮生（admin@shenzilong.cn）").argv;

/** 编译整个 doc 目录 */
async function parse(path: string, three: directory_tree) {
  const result = await fs.readdir(path, { withFileTypes: true });
  /** 所有的文件 */
  const files = result.filter((dir) => dir.isFile());
  /** 目录 */
  const directory = result.filter((dir) => dir.isDirectory());

  /** 递归编译所有目录 */
  await Promise.all(
    directory
      .filter((dir) => {
        const dir_path = Path.join(path, "/", dir.name);
        // 返回不在过滤名单中的
        return !config.filter_dir.includes(dir_path);
      })
      .map(async (dir) => {
        three.directory[dir.name] = {
          directory: {},
          files: {},
        };
        return await parse(Path.join(path, dir.name), three.directory[dir.name]);
      }),
  );
  /** md 的文件 */
  await Promise.all(
    files
      .filter((dir) => dir.name.endsWith(".md"))
      .map(async (dir) => {
        const file_path = Path.join(path, "/", dir.name);
        try {
          const article = await article_parse(file_path, res);
          delete article.html;
          three.files[dir.name] = article;
        } catch (error) {
          if (process.env.isDev) {
            throw error;
          }
          console.error(error, file_path);
        }
      }),
  );
  return three;
}

/** 读取指定位置的文章并解析 */
async function article_parse(file_path: string, res: any) {
  let article;
  try {
    article = await md_parser_article(file_path);
  } catch (error) {
    throw error;
  }
  /** 重点是解析file */
  try {
    article.html = eval(res.article_template);
  } catch (error) {
    if (process.env.isDev) {
      throw error;
    }
    console.error(error);
    error.message = "解析模板失败";
    throw error;
  }
  const out_file_path = resolve(file_path)
    .replace(/md$/, "html")
    .replace(resolve(config.input_dir), resolve(config.out_dir));
  try {
    await fs.writeFile(out_file_path, article.html);
  } catch (error) {
    await fs.mkdir(Path.dirname(out_file_path), { recursive: true });
    await fs.writeFile(out_file_path, article.html);
  }
  try {
    /** 尝试写出json */
    await fs.writeFile(out_file_path.replace(/html$/, "json"),JSON.stringify(article) );
  } catch (error) {

  }
  return article;
}
