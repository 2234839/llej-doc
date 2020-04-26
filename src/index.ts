import { promises as fs } from "fs";
import fse from "fs-extra";
import Path from "path";
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
console.time("总共耗时");
yargs
  .command(
    "build",
    "编译",
    function (yargs) {
      return yargs.option("article", {
        alias: "article",
        describe: "单个文章的路径",
      });
    },
    async (argv) => {
      const three: directory_tree = {
        directory: {},
        files: {},
      };
      res = await getTemplate();
      if (argv.article) {
        // llejdoc build --article "D:/code/doc/record/每日总结/2020/4月.md"  // 命令使用示例
        console.log(await article_parse(String(argv.article), res));
      } else {
        process.once("exit", () => {
          console.timeEnd("总共耗时");
        });
        console.log("开始全量编译");
        await parse(config.input_dir, three);
        directory_to_generate(three, config.out_dir, res);
      }
      // fse
      // .watch(config.input_dir, {
      //   encoding: "utf-8",
      //   persistent: true,
      //   recursive: true,
      // })
      // .addListener("change", async (event, file_path) => {
      //   console.log(file_path);
      //   const input_path = Path.join(config.input_dir, "/", "" + file_path);
      //   const gorp = input_path.split(/[\/\\]/);
      //   const file_name = gorp[gorp.length - 1];
      //   if (["footer.html", "article.html", "header.html", "menu.html"].includes(file_name)) {
      //     res = await getTemplate();
      //     directory_to_generate(three, config.out_dir, res);
      //     console.log("生成目录完毕");
      //   }
      //   if (!input_path.endsWith(".md")) return;
      // });
    },
  )
  // .command(
  //   "search [search_str]",
  //   "从存储库中进行搜索",
  //   (yargs) => {},
  //   async (argv) => {
  //     console.log(await search(<string>argv.search_str));
  //   },
  // )
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
  return files;
}

/** 读取指定位置的文章并解析 */
async function article_parse(file_path: string, res: any) {
  let article;
  try {
    article = md_parser_article(await (await fs.readFile(file_path)).toString());
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
  const out_file_path = file_path.replace(/md$/, "html").replace(config.input_dir, config.out_dir);
  try {
    await fs.writeFile(out_file_path, article.html);
  } catch (error) {
    await fs.mkdir(Path.dirname(out_file_path), { recursive: true });
    await fs.writeFile(out_file_path, article.html);
  }
  return article;
}
