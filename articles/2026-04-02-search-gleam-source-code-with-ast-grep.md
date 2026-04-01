---
title: "ast-grepでGleamのコードを検索する"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ast-grep", "gleam", "nix"]
published: true
---

[小宮果穂](https://shinycolors.idolmaster-official.jp/idol/hokagoclimaxgirls/kaho/)さん、お誕生日 247日目おめでとうございます！

---

この世には[ast-grep](https://ast-grep.github.io/)と呼ばれるツールがあります。

これは旧来のgrepとは異なり構文単位で検索が可能になるという代物です。
構文単位での検索が可能となるので、簡易的なlintとして使ったり、コードを破壊せず置換を行えたりします。
また、構文を使って直接検索できるのでコーディングエージェントがコードを検索する時に必要な情報のみを取得できトークンの消費量を抑えられるというメリットもあったりします。
Claude Codeで使う場合は公式がskillを公開しているのでそれを使うのが良さそうです。

https://github.com/ast-grep/agent-skill

そんな便利なast-grepですが、残念なことに現時点(2026/4/2)ではGleamに対応していません。
そこで今回はそんなast-grepをGleam対応させる方法を紹介します。

## ast-grepで任意の言語を扱えるようにする
ast-grepはその名の通り検索対象をASTに変換してから検索処理を行います。
このパース処理を行っているのがtree-sitterです。
tree-sitterは高速なパーサジェネレータ・構文解析ライブラリで、最近ではテキストエディタのハイライトなんかにも使われています。

ast-grepがtree-sitterを用いているという事は、**理論上tree-sitterを提供している言語はなんでもast-grepで検索可能という訳です。**
Gleamの場合公式がtree-sitterのgrammerを提供しているので、それが使えます。

https://github.com/gleam-lang/tree-sitter-gleam

## 設定していく
公式ドキュメントに[Mojo](https://www.modular.com/mojo)のサポートを追加する例が紹介されているので、これを見ながら設定していきます。
Mojo久々に聞いたな...

https://ast-grep.github.io/advanced/custom-language.html#custom-language-support

ast-grepで任意の言語を検索対象として設定するには、言語ごとの設定を`sgconfig.yml`というファイルに記述する必要があります。

sgconfig.ymlでは以下のように設定します。
`libraryPath`には対応する言語のtree-sitterのparserを指定します。

```yaml
customLanguages:
  gleam: # 言語名を指定する。この言語名はCLIでオプションを指定する際に使用する。
    extensions:
    - gleam # 検索対象とする言語の拡張子。Pythonならpyになる。
    libraryPath: /path/to/parser.so
```

`libraryPath`にはビルド済みのparserを配置します。**grammarではなくparser**な点に気を付けてください。

### Nixでは

僕は普段Nixを使っているのでNix前提で書いていきますが、大体こんな感じで書けば設定できます。
NixにはNix式からYAMLを生成する関数があるので、それを使って設定ファイルごとNixで生成します。
  こうすることで、grammarのパスをNix式から埋め込めるのと、全部の設定を`flake.nix`で完結できるので設定ファイルを管理する手間を多少省けます。

```nix
  yamlFormat = pkgs.formats.yaml {};
  ast-grep-config = yamlFormat.generate "sgconfig.yml" {
    customLanguages = {
      gleam = {
        extensions = ["gleam"];
        libraryPath = "${pkgs.vimPlugins.nvim-treesitter-parsers.gleam}/parser/gleam.so";
      };
    };
  };
```

grammarを取得するために`pkgs.vimPlugins.nvim-treesitter-parsers.gleam`を指定しています。
nixpkgsにはtree-sitterのgrammerを提供するパッケージが2種類あり、うち一つが`tree-sitter-grammars`、もう一つが`vimPlugins.nvim-treesitter-parsers`です。

  前者がgrammar、後者がparserを提供しており、ast-grepが必要なのは後者です。
  と言うのも、ast-grepは構文解析をする必要があるので構文を定義しただけのgrammarでは機能が足りないからですね。

生成したYAMLファイルはShellHookでsymlinkを貼ってdevShell内でファイルとして扱えるようにします。

```nix
devShells.default = pkgs.mkShell {
  shellHook = ''
    ln -sf ${ast-grep-config} sgconfig.yml
  '';
};
```

このNix式で生成した設定ファイルをShellHookでsymlinkにして扱えるようにするテクニックは[mcp-servers-nix](https://github.com/natsukium/mcp-servers-nix)等でも使われています。
この方法でtextlintの設定ファイルなども管理できるので、そういう方法が存在することだけでも頭に入れておくと役に立つのでオススメです。

## 実際に使ってみる

検索するにはパターンもしくはルールを定義する必要があります。
以下はインラインルールを定義して検索をする例です。
この例では`src/`配下にあるGleamコードのうち関数定義を行っている箇所を検索しています。

```sh
ast-grep scan --inline-rules '
language: gleam
rule:
  kind: function
' src/
```

あわせてruleに`has:`を指定すると、「関数名が_kahoで終わる関数」を検索できたりします。

```sh
ast-grep scan --inline-rules '
     language: gleam
     rule:
       kind: function
       has:
         kind: identifier
         regex: ".*_kaho$"
     ' src/
```

旧来のgrepだと骨が折れそうな検索もシュっとかけられて嬉しいですね。

### まとめ

今回はast-grepでGleamのコードを検索する方法を紹介しました。
以下は3行まとめです。

- ast-grepは便利
- 対応していない言語は`customLanguages`を設定することで対応できる
- Nixを使うとtree-sitterと設定ファイルをまとめて管理できて楽

という訳でast-grepでGleamのコードを検索する方法でした。
個人的には設定なしで使いたいところなので、気が向いたらPRとか出したいですね...
