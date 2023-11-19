---
title: "Neovimでdpp.vimをセットアップする"
emoji: "🦊"
type: "tech"
topics: ["neovim", "denops"]
published: true
---

:::message
この記事は[このメモ書き](https://note.comamoca.dev/Vim/dpp.vim%E3%82%92Lua%E3%81%A7%E8%A8%AD%E5%AE%9A%E3%81%99%E3%82%8B)をZenn向けに清書したものです。
更新がある場合はZennのこの記事を優先して更新します。
:::

以前から注目していたdpp.vimですが、ついにShougoさん自身がドッグフーディングを開始したそうですのでこれを機にdpp.vimの導入を始めてみました。
この記事ではdein.vimからdpp.vimへと移行する事を想定して、どのように設定を構成していけば良いのか書いていきます。

## 環境
以下は自分の環境です。

- Manjaro Linux
- NVIM v0.10.0-dev-25cfe3f

#### ちょっとした宣伝

:::message
**現状fishでしか動きません。**
:::

自分は今回お手製環境切り替えツール[neoenv](https://github.com/comamoca/neoenv)を使い`NVIM_APPNAME`を変更してインストール作業を行いました。
neoenvはざっと以下のようなことができます。

- `neoenv add APP_NAME`で環境を新規作成
- `neoenv remove`でファインダーが開くので絞り込んで指定すると環境が削除されます。
- `neoenv switch`で環境を切り替えるシェルスクリプトを出力します。パイプで`source`すると適用されます。
例）`neoenv switch | source`

neoenvは自身の設定ファイル以外のファイル操作を一切行わないため、`init.lua`などを格納するためのディレクトリはユーザー自身が作成する必要があります。

## dpp.vimの基本コンセプト
> デフォルトでは何もしない、ユーザーが全てをコントロール出来るパッケージマネージャー

- denops(Deno)依存
- プラグインのインストール周りの設定はTypeScript(Deno)で記述
- 必要な機能は拡張機能を使って実現

詳しい説明は[Shougoさんの紹介記事](https://zenn.dev/shougo/articles/dpp-vim-beta#dpp.vim-%E3%81%AE%E7%89%B9%E5%BE%B4)で詳しく紹介されています。

## 下準備
**dpp.vimは Neovim (0.10.0+)またはVim 9.0.1276+をサポートしているので、v0.9などを使っている人はNightlyなどをインストールする必要があります。**

dpp.vimにはまだインストールスクリプトもなく、作る予定もないそうなので手作業で準備を行います。

ここではプラグインのインストール先は`~/.cache/dpp/`とします。
まずdpp.vimとdenopsを`git clone`します。
```sh
mkdir -p ~/.cache/dpp/repos/github.com/
cd ~/.cache/dpp/repos/github.com/

mkdir Shougo
mkdir vim-denops

cd ./Shougo
git clone https://github.com/Shougo/dpp.vim

git clone https://github.com/Shougo/dpp-ext-installer
git clone https://github.com/Shougo/dpp-protocol-git
git clone https://github.com/Shougo/dpp-ext-lazy
git clone https://github.com/Shougo/dpp-ext-toml

cd ../vim-denops
git clone https://github.com/vim-denops/denops.vim
```
以下のようなディレクトリ構造になっていたらOKです。(各プラグイン内のディレクトリを省略しています)
```
.
├─── Shougo
│    ├── dpp-ext-installer
│    ├── dpp-ext-lazy
│    ├── dpp-ext-toml
│    ├── dpp-protocol-git
│    └── dpp.vim
└── vim-denops
    └── denops.vim
```

次に設定用のTSファイルを作成します。ここでは`~/.config/nvim/dpp.ts`配下に配置することにします。
`touch ~/.config/nvim/dpp.ts`

## init.lua
[READMEのConfig example](https://github.com/Shougo/dpp.vim#config-example)を参考に自分がLuaに書き直したものがこちらになります。
```lua
local dpp_base = "~/.cache/dpp/"
local dpp_src = "$HOME/.cache/dpp/repos/github.com/Shougo/dpp.vim"

local ext_toml = "$HOME/.cache/dpp/repos/github.com/Shougo/dpp-ext-toml"
local ext_lazy = "$HOME/.cache/dpp/repos/github.com/Shougo/dpp-ext-lazy"
local ext_installer = "$HOME/.cache/dpp/repos/github.com/Shougo/dpp-ext-installer"
local ext_git = "$HOME/.cache/dpp/repos/github.com/Shougo/dpp-protocol-git"
local denops_src = "$HOME/.cache/dpp/repos/github.com/vim-denops/denops.vim"

local dpp_config = "~/.config/nvim/dpp.ts"

vim.opt.runtimepath:prepend(dpp_src)

vim.opt.runtimepath:append(ext_toml)
vim.opt.runtimepath:append(ext_git)
vim.opt.runtimepath:append(ext_lazy)
vim.opt.runtimepath:append(ext_installer)

if vim.fn["dpp#min#load_state"](dpp_base) then
	vim.opt.runtimepath:prepend(denops_src)

	vim.api.nvim_create_augroup("dpp", {})

	vim.cmd(string.format("autocmd User DenopsReady call dpp#make_state('%s', '%s')", dpp_base, dpp_config))
end

vim.cmd("filetype indent plugin on")

if vim.fn.has("syntax") then
	vim.cmd("syntax on")
end
```
autocmdを定義するところがかなり見苦しいけど、とりあえずこの設定で動きます。いつか直したい...

## TypeScript

こちらのGistを参考に書いていきました。

https://gist.github.com/raa0121/d8634a7971ec95fb5fcbcb6baad27f65

遅延ロードが有効な状態の設定をここに貼っておきます。
`dein.toml`や`dein_lazy.toml`が`~/.config/nvim`にあるという想定で書いています。
もしAPP_NAMEがこれと違う場合は、`dotfilesDir`の値を変更してください。

```ts
import {
  BaseConfig,
  ContextBuilder,
  Dpp,
  Plugin,
} from "https://deno.land/x/dpp_vim@v0.0.5/types.ts";
import { Denops, fn } from "https://deno.land/x/dpp_vim@v0.0.5/deps.ts";

export class Config extends BaseConfig {
  override async config(args: {
    denops: Denops;
    contextBuilder: ContextBuilder;
    basePath: string;
    dpp: Dpp;
  }): Promise<{
    plugins: Plugin[];
    stateLines: string[];
  }> {
    args.contextBuilder.setGlobal({
      protocols: ["git"],
    });

    type Toml = {
      hooks_file?: string;
      ftplugins?: Record<string, string>;
      plugins?: Plugin[];
    };

    type LazyMakeStateResult = {
      plugins: Plugin[];
      stateLines: string[];
    };

    const [context, options] = await args.contextBuilder.get(args.denops);
    const dotfilesDir = "~/.config/nvim/";

    const tomls: Toml[] = [];
    tomls.push(
      await args.dpp.extAction(
        args.denops,
        context,
        options,
        "toml",
        "load",
        {
          path: await fn.expand(args.denops, dotfilesDir + "dein.toml"),
          options: {
            lazy: false,
          },
        },
      ) as Toml,
    );

    tomls.push(
      await args.dpp.extAction(
        args.denops,
        context,
        options,
        "toml",
        "load",
        {
          path: await fn.expand(args.denops, dotfilesDir + "dein_lazy.toml"),
          options: {
            lazy: true,
          },
        },
      ) as Toml,
    );

    const recordPlugins: Record<string, Plugin> = {};
    const ftplugins: Record<string, string> = {};
    const hooksFiles: string[] = [];

    tomls.forEach((toml) => {

      for (const plugin of toml.plugins) {
        recordPlugins[plugin.name] = plugin;
      }

      if (toml.ftplugins) {
        for (const filetype of Object.keys(toml.ftplugins)) {
          if (ftplugins[filetype]) {
            ftplugins[filetype] += `\n${toml.ftplugins[filetype]}`;
          } else {
            ftplugins[filetype] = toml.ftplugins[filetype];
          }
        }
      }

      if (toml.hooks_file) {
        hooksFiles.push(toml.hooks_file);
      }
    });

    const lazyResult = await args.dpp.extAction(
      args.denops,
      context,
      options,
      "lazy",
      "makeState",
      {
        plugins: Object.values(recordPlugins),
      },
    ) as LazyMakeStateResult;

    console.log(lazyResult);

    return {
      plugins: lazyResult.plugins,
      stateLines: lazyResult.stateLines,
    };
  }
}
```
## 遅延ロード
遅延ロードを設定するには`dpp-ext-lazy`が必要です。
上の手順通りに作業を行った場合はすでに使える状態なので大丈夫です。

遅延ロードのポイントはこの部分です。
```typescript
tomls.push(
      await args.dpp.extAction(
        args.denops,
        context,
        options,
        "toml",
        "load",
        {
          path: await fn.expand(args.denops, dotfilesDir + "dein_lazy.toml"),
          options: {
            lazy: true,
          },
        },
      ) as Toml,
    );
```

`tomls`には読み込まれるTOMLファイルのオブジェクトの配列が入ります。
つまり、`tomls.push()`を実行することで新たにTOMLファイルを追加できます。
この際、`options.lazy`を`true`にすることで読み込まれるファイルの遅延ロードが有効化されます。

今回は読み込まれるデータがTOMLのみなので`push`するだけで済みました。しかし、もし違うデータを読み込む場合は**手動でマージする必要があります。**

## プラグインデータのマージ

dppではプラグインをマージする必要があると書きました。マージと聞くと複雑そうに聞こえますが、取得したデータをプラグイン一覧に`push`すれば大丈夫です。

以下はローカルのプラグインを`dpp-ext-local`で取得したプラグインのデータをマージするサンプルです。

```ts
const localPlugins = await args.dpp.extAction(
  args.denops,
  context,
  options,
  "local",
  "local",
  {
    directory: "~/plugins/",
    options: {
      frozen: true,
      merged: false,
    },
  },
) as Plugin[];

localPlugins.forEach((plugin: Plugin) => {
  recordPlugins[plugin.name] = plugin;
});
```
## stateLinesについて
stateLinesは、遅延ロードされる際に読み込まれるVimScriptです。
どんな内容か見たい場合は`console.log(lazyResult.stateLines)`することで内容を見ることができます。
![](https://storage.googleapis.com/zenn-user-upload/a7ee1b6e39e6-20231026.png)

下あたりの行にある`command -complete=custom~`で始まるスクリプトは`dein_lazy.toml`で以下のように設定したものです。

```toml
[[plugins]]
repo = 'miyakogi/seiya.vim'
on_cmd = ["SeiyaEnable", "SeiyaDisable"]
```
ちゃんとコマンドで読み込み処理が実行されるようにスクリプトが生成されています。

## インストール処理の実行
[dpp-ext-installer](https://github.com/Shougo/dpp-ext-installer)のREADMEにも書いてありますが、`dpp-ext-installer`を使ってインストール処理を実行するには以下のコマンドを実行します。
```sh
# インストール
call dpp#async_ext_action('installer', 'install')

# アップデート
call dpp#async_ext_action('installer', 'update')
```


## 【おまけその1】プラグインの手動追加

かなり場面が限られますが、そのようなケースがまれにあります。
自分の場合だと、ghqで管理しているプラグインをdppで読み込みたいケースがそれにあたります。

そのような場合は、これまでextentionが行っていたデータ生成を自分で行えば手動でプラグインを追加できます。
また、そのようなデータ形式を出力するプログラムを作成することはdppのextentionを作ることに等しいです。

先述した`dpp-ext-local`は以下のようなデータを出力します。
```ts
{
      frozen: true,
      merged: false,
      repo: "/home/coma/ghq/github.com/coma/runit.nvim",
      local: true,
      path: "/home/coma/ghq/github.com/coma/runit.nvim",
      name: "runit.nvim",
}
```

また、`dpp-ext-toml`は以下のようなデータを出力します。
```ts
{
  lazy: true,
  repo: "miyakogi/seiya.vim",
  on_cmd: [ "SeiyaEnable", "SeiyaDisable" ],
  name: "seiya.vim",
  dummy_commands: [ "SeiyaEnable", "SeiyaDisable" ]
}
```

これらextentionが出力するデータは`Plugin`と呼ばれるinterfaceに準拠しています。
Pluginの定義は[ここ](https://github.com/Shougo/dpp.vim/blob/13e6b554215ef763f467c910e1971e7accf079b3/denops/dpp/types.ts#L81)で見ることができます。

コードを読んでみるといろいろ書いてありますが、Pluginに必須の要素は`name`だけです。つまり**nameさえあればdppにプラグインだと認識されます。**
この`name`ですが、dpp内で扱われるプラグインの名前となっています。これは主にextentionで生成される値です。
たとえば、`sainnhe/gruvbox-material`は`gruvbox-material`という`name`で認識されます。

これらを踏まえると、以下のように記述することでextentionなしでもプラグインを追加できます。以下設定のサンプルを2つ紹介します。

### GitHub上のプラグインをインストールしたい

- lazy
遅延ロードを行うかどうか。行う場合は読み込まれるタイミングを指定する必要がある。
例)`on_cmd`&`dummy_commands`,`on_source` etc...
名前の多くはdein.vimを踏襲しているようですので、dein.vimを使っていた人は比較的簡単に設定できると思います。
- repo
リポジトリ名。`miyakogi/seiya.vim`のように指定する。
- name
プラグイン名。`seiya.vim`のように指定します。

### ローカルの任意の箇所にあるプラグインを読み込ませたい

- frozen

- merged
マージされているか。`false`と指定します。
- repo
リポジトリの名前。`path`と同じ名前で指定します。
- local
ローカルにあるかどうか。`true`と指定します。
- path
プラグインが配置されている場所。絶対パスで指定する。
- name
プラグインの名前を指定します。


ところで、dpp.vimの拡張機能の戻り値は`Plugin[]`となっています。
そうです。先述した**Objectの配列を生成するプログラムを作成する事で拡張機能を作成できます**。

このような特性上、dpp.vimの拡張機能は**複数のデータから`Plugin`の配列を生成することに向いています**。
一つ々追加したい場合には上記の方法で手書きしほうが良さそうです。


## 【おまけその2】dpp拡張の作り方

肺が痛くてゴロゴロしてたらいつの間にかdpp拡張の方が先に完成してしまったので、「おまけその2」と題してdpp拡張機能の作り方を簡単に解説します。

今回作成したdpp拡張はこちらです。

https://github.com/comamoca/dpp-ext-ghq

この拡張機能は、ghqで管理されているVimプラグインをリストで指定してそれらを読み込んでくれる機能を持っています。
機能としては`dpp-ext-local`に`hostname`と`repos`というパラメータが追加された感じになっています。

では実際にコードを見ながらどういった処理を行っているのか解説していきます。

```ts
type Args = {
  ghq_root: string;
  repos: string[];
  hostname: string;
  options?: Partial<Plugin>;
};
```
[該当箇所](https://github.com/Comamoca/dpp-ext-ghq/blob/12c3be6e0faadd1baacf5484137a96f2617d6b55/denops/%40dpp-exts/ghq.ts#L15-L20)

ここでは拡張機能に渡される引数を定義しています。この拡張機能はghqのルートディレクトリである`ghq_root`と、ghq内にあるプラグインのリポジトリ名である`repos`、それとリポジトリがホストされているサーバのアドレスである`hostname`、すべてのプラグインに適用されるオプションを定義しています。

```ts
        const params = args.actionParams as Args;
        const defaultOptions = params.options ?? {};


        const expanded_ghq_root = await args.denops.call(
          "expand",
          params.ghq_root,
        );


        const plugins: Plugin[] = [];
```
[該当箇所](https://github.com/Comamoca/dpp-ext-ghq/blob/d787b8db2aedc39226db7f06956b2a33e4a7882b/denops/%40dpp-exts/ghq.ts#L28-L36)

ここでは以下のような処理を行っています。

- `params`に拡張機能の引数
- `defaultOptions`にプラグインのオプション
- `expanded_ghq_root`にghqのルートディレクトリを`call expand()`した結果
- `plugins`を初期化

3つめの`expand`ですが、これを行うことで`~/ghq/`といったパスに対応できます。

```ts
        params.repos.forEach((repo) => {
          if (is.String(repo)) {
            if (is.String(expanded_ghq_root)) {
              const abs_path = join(expanded_ghq_root, params.hostname, repo);


              plugins.push({
                ...defaultOptions,
                repo: abs_path,
                local: true,
                path: abs_path,
                name: basename(abs_path),
              });
            }
          }
        });


        return plugins;
```
[該当箇所](https://github.com/Comamoca/dpp-ext-ghq/blob/d787b8db2aedc39226db7f06956b2a33e4a7882b/denops/%40dpp-exts/ghq.ts#L38-L54)


いよいよ拡張機能のメイン処理を見ていきます。といっても[【おまけその1】プラグインの手動追加](#【おまけその1】プラグインの手動追加)で書いた通り、`Plugin`にのっとった形式のオブジェクトをpushしていくだけです。

プログラム中にたびたび出てきている`is.String()`という関数ですが、これは[unknownutil](https://deno.land/x/unknownutil@v3.10.0)という`unknown`な型を扱いやすくするためのライブラリです。dpp.vimでは柔軟性を持たせるためにたびたび`unknown`な値が登場するので合わせて使うのがお勧めです。


## 🍵余談

今回は新進気鋭なVimパッケージマネージャー`dpp.vim`の使い方と簡単な拡張機能の使い方を解説しました。
今後は`dpp-ext-installer`のソースコードを読んで`dpp.vim`にCLIツール管理機能を付け加える`dpp-ext-binary`を作りたいと思っています。
これは以前Vim界隈で目にした以下の記事から着想を得たものです。

https://zenn.dev/vim_jp/articles/a33de9d64b90d8

この記事では「悪用」と呼ばれていますが、**dpp.vimなられっきとした活用方法になる**ため、より良いツール管理手法になるはずです。

このほかにもいろいろ作りたいものがあったり[^1]、リアルの方で就活があったり[^2]とかでなかなか時間も厳しいですが、VimConfまでに何かしらの成果をお土産として持っていけたらなぁと考えているので乞うご期待！

[^1]: DenopsでVimのSpotifyクライアントだとか、自作SSGとブログのリプレースだとか、DenopsでVimのバッファを良い感じに操作できるライブラリだとか、アイマスとか
[^2]: 免許・基本情報のB試験などなど懸案事項が多い...
