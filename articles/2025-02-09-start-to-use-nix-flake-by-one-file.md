---
title: "1ファイルから始めるNix Flake"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["nix"]
published: false
---

ここ最近Nixに興味を持ってくれる方が増えている実感があります。
そんな中、Nixを始めるにあたって「とりあえず始めるためのとっかかりとなる情報」が少ないことを感じていて、僕がNixを始めた時もそれが始める際のネックになっていたことを思い出しました。

そこで僕が日ごろNixをどう使っているかを題材に、開発環境を構築するツールとして1ファイルからNixを使い始める方法を紹介していきたいと思います。

:::message
この記事ではnix-commandとflakesを有効化した状態を前提に解説していきます。
もし有効化していなければ[NixOS Wiki](https://wiki.nixos.org/wiki/Flakes/ja)を参考に有効化してください。
:::

:::message
Nixにいろいろな使い方があります。(deploy-rsの様にansibleに近い使い方も可能です)
この記事で紹介する方法は従来Dockerで行っていた領域に近いです。
ですが、Nixはこのような使い方以外も可能なのでDockerを完全に代替するものではないですし、DockerもまたNixを完全に代替するものではありません。
:::

## Flakeについて

現在のNixではFlakeと呼ばれる機能が主流となって用いられています。

FlakeはGitリポジトリ直下に`flake.nix`というファイル名で配置され、
その中では

- nixpkgs等依存しているものを記述する`inputs`
- mkShellやpackages等出力するものを記述する`outputs`

が定義されています。

Flakeはちょうど**inputsを引数に取ってoutputsを戻り値として返す関数**のように働きます。[^1]

## 最小限のFlake

最小限の動くFlakeは以下のようになります。

```nix:flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      ...
    }:
    let
      system = "x86_64-linux";

      # Macなら以下のように指定する
      # system = "x86_64-darwin";

      pkgs = nixpkgs.legacyPackages.${system};
    in { 
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.hello ];
      };
      packages.${system}.default = pkgs.hello;
    };
}
```

このNix式を`flake.nix`という名前で保存した後、同じディレクトリで以下のコマンドを実行すると
`hello`コマンドが使えるシェル(デフォルトはBash)が起動します。

```sh
nix develop
```

実際に実行している様子は以下のようになります。

```sh
❯ hello
The program 'hello' is currently not installed. It is provided by
(長いので省略)

❯ nix develop
# ここでの出力は消えているが、ここで環境を構築するログが流れている。

❯ hello
世界よ、こんにちは！
```

また、以下のコマンドを実行すると
`result`というディレクトリが生成され、その中の`/bin`ディレクトリにはさきほど実行した`hello`コマンド
が入っています。

```sh
❯ nix build
# ここでの出力は消えているが、ここで環境を構築するログが流れている。

❯ ls
 flake.lock   flake.nix   result

❯ ./result/bin/hello 
世界よ、こんにちは！
```

:::message
`nix run`というコマンドを使うと`nix build`で`./result`を作成せずとも直接実行できます。
また`nix run .#mypkg`のようにdefualt以外のパッケージに対しても適用可能です。
:::

## 何が起こったのか

さきほどのNix式では以下の項目を定義しました。

- `devShells.${system}.default`  
  デフォルトで起動するdevShellを定義
- `packages.${system}.default`  
  デフォルトでビルドされるDerivationの定義

Derivationは「Nixでビルドするための定義」と覚えておけば大丈夫です。[^2]

また、`pkgs = nixpkgs.legacyPackages.${system};`でnixpkgsから指定されたプラットフォーム向けの
パッケージセット[^3]を取得するものです。
これにより、`pkgs.hello`でsystem(上記のコードだと`"x86_64-linux"`)に合ったパッケージを参照できます。

### devShells

Flakeにおいて開発シェルを定義するのがdevShellsです。

`nix develop`コマンドを実行すると定義されたシェルに入れます。
また、devShell内で定義された環境は外部とは隔離されるので、
グローバルにインストールしたくないパッケージ(LSPサーバー等)を使う際に便利です。

devShellsはプラットフォームや名前を変えると複数定義できます。

たとえば、`myshell`という名前のdevShellを定義してみます。

```nix
devShells.${system} = {
  default = pkgs.mkShell {
    packages = [ pkgs.hello ];
  };
  "myshell" = pkgs.mkShell {
    packages = [ pkgs.cowsay ];
  };
};
```
```sh
❯ nix develop .#myshell

❯ cowsay "Nix!"
 ______
< Nix! >
 ------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

### mkShell

先述したmkSehllでも何回か登場しましたが、自分で開発シェルを定義するために使う関数が`mkShell`になります。

引数は以下の通りです。

- name  
シェルの名前を指定する。デフォルトは`nix-shell`。
- packages  
シェルに含めるパッケージを指定する。nixpkgsを使っている場合は[NixOS Search](https://search.nixos.org/packages?channel=unstable&size=50&sort=relevance&type=packages&query=hello)から使えるパッケージを検索できる。デフォルトは`[]`。
- inputsFrom  
指定したパッケージが**依存しているパッケージ**をシェルに追加します。デフォルトは`[]`。
- shellHook  
シェルの起動時に実行されるbashスクリプト。デフォルトは`""`。

### packages

Flakeでビルド成果物を定義するのがpackagesです。

devShells同様、これもsystemと名前を変えることで複数定義できます。

```nix
packages.${system} = {
  default = pkgs.hello;
  "mypkg" = pkgs.cowsay;
};
```

```sh
❯ nix build .#mypkg

❯ ls ./result/bin/
 cowsay   cowthink
```

### mkDerivation

自身でパッケージの内容を定義したい場合に使うのが`mkDerivation`関数です。

ちょうどdevSehllに対するmkShellの立ち位置になります。ただ、mkDerivation自体はもっと広範に使用できます。

mkDerivationの引数は以下の通りです。

#### メタ情報など

- name  
derivationの名前。必須。
- pname  
パッケージ名。
- version  
パッケージのバージョン。必須。
- src  
ビルドに使うソースのパス。必須。

#### ビルド時の定義

- buildInputs  
**実行時に用いられる依存**を指定します。
- nativebuildinputs  
**ビルド時に用いられる依存**を指定します。
- buildPhase  
ビルド時に実行されるbashスクリプト。
主に実行ファイルを生成するのに用いる。
- installPhase
インストール時に実行されるbashスクリプト。buildPhaseで生成した実行ファイルを配置するのに用いる。
- builder  
buildPhaseやinstallPhaseを記述したbashスクリプトのパス。
省略した場合はstdenvのデフォルト環境でビルドが実行される。


:::details 具体的な例
[Gist](https://gist.github.com/Comamoca/877fbd84103acaa1e25b84d8dc9e99ab)にあるJSファイルをQuickJSで実行ファイルにして、その実行ファイルをパッケージにするDerivationの例。
```nix
default = stdenv.mkDerivation {
  name = "mypkg";
  pname = "5000000000000000yen";
  buildInputs = [ pkgs.quickjs ];
  src = pkgs.fetchurl {
    url = "https://gist.githubusercontent.com/Comamoca/877fbd84103acaa1e25b84d8dc9e99ab/raw/5c7a348a3b2b0f3de5336686e105f0044eea0a41/5000000000000000yen.js";
    hash = "sha256-9sdS2kGvWHz/bqnnQGZASP+ch3A1NsQXdcG2ZHs6Qyk=";
  };

  # 圧縮されていないファイルの場合はunpackPhaseをスキップさせる
  unpackPhase = ":";

  buildPhase = ''
    qjsc $src
  '';

  installPhase = ''
    install -D a.out $out/bin/5000000000000000yen
  '';
};
```

`nix build`を実行すると`./result/bin`に実行ファイルが生成されます。

```sh
❯ nix build

❯ ls result/bin/
 5000000000000000yen

❯ nix run


⠀⠀⠀⠀⠀⠀⠀⣤⣤⣤⣤⣤⣤⡄⠀⠀⣀⣤⣤⣤⣤⡄⠀⠀⠀⣀⣤⣤⣤⣤⡀⠀⠀⠀⣀⣤⣤⣤⣤⡀⠀⠀⣀⡀⠀⣠⣶⠆⣴⡖⠀⣀⡀⠀⢀⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⡄
⠀⠀⠀⠀⠀⢀⣼⡿⠉⠉⠉⠉⠉⠀⣠⣾⡿⠋⠉⠙⣿⡿⠀⣠⣾⠟⠋⠉⢹⣿⡇⠀⣠⣾⠟⠋⠉⢹⣿⡇⠀⠀⣿⣷⣠⣿⠃⣼⣟⣤⡾⠟⠁⢀⣾⡟⠉⠉⣹⡿⠉⠉⢉⣿⠏⠀
⠀⠀⠀⠀⣠⣾⣿⣶⣶⣶⣦⠀⠀⣴⣿⠋⠀⠀⠀⣸⣿⢇⣼⡿⠃⠀⠀⠀⣼⣿⢃⣾⡿⠁⠀⠀⠀⣾⣿⠁⠀⠀⠛⣩⣿⢃⣾⣟⣝⠋⠀⠀⢀⣾⣟⣀⣀⣴⣿⣁⣀⣠⣿⠏⠀⠀
⠀⠀⠀⠀⠛⠋⠁⠀⠀⣿⡿⠀⣼⣿⠃⠀⠀⢀⣼⣿⠋⣾⣿⠁⠀⠀⣀⣼⡿⢃⣾⡿⠁⠀⠀⢀⣾⡿⠁⣴⣶⠾⣿⡿⢃⣾⡟⠙⣿⣷⠄⢀⣾⠟⠛⠛⠛⠛⠛⠛⢻⣿⠏⠀⠀⠀
⠀⠀⣰⣶⣆⣀⣀⣤⣾⠟⠁⣰⣿⣯⣀⣀⣤⣾⠟⠁⣸⣿⣧⣀⣀⣴⣿⠟⠁⢸⣿⣇⣀⣀⣴⣿⠟⠀⠈⣁⣤⣾⠟⣀⣾⠏⠀⣀⣾⠄⣠⣾⠏⠀⠀⠀⠀⠀⠀⣠⣿⠏⠀⠀⠀⠀
⠀⠀⠈⠛⠿⠿⠛⠋⠁⠀⠀⠀⠛⠿⠿⠛⠋⠁⠀⠀⠈⠛⠿⠟⠛⠋⠀⠀⠀⠈⠛⠿⠟⠛⠉⠀⠀⣶⡿⠟⠋⠀⠀⠾⢿⣷⠾⠿⠋⣠⣿⠏⠀⠀⠀⠀⠸⠿⠶⠿⠋⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣤⢤⣄⠀⣠⣶⠦⠀⠀⠀⠀⠀⠰⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡴⢟⣯⣄⣸⣿⣷⠿⠥⣴⣾⠄⠀⠀⠀⣴⡿⠋⠀⠀⠀⠀⠀⠀⠀⢀⣿⡆⠀⠀⠀⠀⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⣼⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢉⣴⠿⠛⣷⡴⢋⣿⠟⠞⠋⠀⠀⠀⢀⣼⠟⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⠟⠀⡀⠀⠀⠀ ⣿ ⠀⠀⠀⠀⠀⠀⣰⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⢶⣿⠓⣶⣾⠛⣡⣿⡟⠀⠀⠀⠀⠀⢀⣾⠋⠀⠀⠀⠀⠀⡀⠀⠀⠀⣾⠏⣠⠞⠀⠀⣀⣠⣼⡿⠀⠀⠀⠀⠀⠀⣠⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⠃⣰⡿⣁⣾⠟⣰⣷⡀⠀⠀⠀⠀⣾⡇⠀⣀⣀⣤⡶⠋⠀⠀⠀⠸⣿⣿⠁⠀⠀⠀⠀⠙⠉⠀⠀⠀⠀⠀⢀⣤⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡰⠿⠋⢉⡿⠟⠋⠀⠀⢸⠟⠋⠀⠀⠀⠀⠻⠿⠿⠛⠋⠁⠀⠀⠀⠀⠀⠀⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
```

:::


## Flakeをもっと便利に使いたい

最初に紹介した最小限のFlakeでも一応使うことはできますが、
もっと便利に使いたい人向けに便利な使い方を紹介していきます。

### 複数のsystem向けに一括定義する

いちいちLinux向けにこれを定義して、Mac向けにこれを定義して...と
定義を書いていくのは正直やってられないです。

そこでNixでは以下の方法で複数のsystem向けに一括して同じ定義を適用できます。[^4]
以下はNixとnixpkgsの関数のみで複数のsystemに向けて一括で定義するNix式です。

```nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      ...
    }:
    let
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system: 
        let
          pkgs = nixpkgs.legacyPackages.${system};
          stdenv = pkgs.stdenv;
        in {
          default = pkgs.mkShell {
            packages = [ pkgs.hello ];
          };
          myshell = pkgs.mkShell {
            packages = [ pkgs.cowsay ];
          };
        }
      );

      packages = forAllSystems (system: 
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.hello;
        }
      );
    };
}
```

一見複雑そうに見えますが、

- forAllSystemsという関数を定義している
- 内部ではsystemsの値を参照でき、上記のサンプルでは`system`という名前を使っている
- 内部で`system`の値を使ってパッケージセットを生成している

という点を押さえれば読めるはずです。

サードパーティのNixライブラリを使用するとより簡潔に上記のような定義を行えます。
たとえばflake-utilsでは以下のように定義できます。

```nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells = {
          default = pkgs.mkShell {
            packages = [ pkgs.hello ];
          };
          myshell = pkgs.mkShell {
            packages = [ pkgs.cowsay ];
          };
        };
        packages.default = pkgs.hello;
      }
    );
}
```

僕は以前flake-utilsを使っていましたが、今はflake partsを使っています。
いくつか理由はありますが、

- モジュールに基づいており再利用しやすい
- 多くのモジュールが対応しておりエコシステムが発達している

等が主な理由です。

### flake partsを導入する

flake partsを使った最小限のflakeは以下の通りです。
systemsの指定として[nix-systems/default](https://github.com/nix-systems/default)を使用しています。
これはあらかじめデフォルトで使われるプラットフォーム[^]が定義されているモジュールです。

これを使用することでtypoによるミスを軽減でき、inputsを見るだけでどのプラットフォームに対応しているか分かるので可読性の向上が期待できます。

```nix
{
  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    services-flake.url = "github:juspay/services-flake";
    systems.url = "github:nix-systems/default";
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      flake-parts,
      systems,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import systems;

      perSystem =
        { config,
          system,
          pkgs,
          ...
        }: {
          devShells = {
            default = pkgs.mkShell {
              packages = [ pkgs.hello ];
            };
            myshell = pkgs.mkShell {
              packages = [ pkgs.cowsay ];
            };
          };
          packages = {
            default = pkgs.hello;
          };
        };
    };
}
```

#### flake-partsの便利なモジュール

flake-partsには便利なモジュールが数多くありますが、その中で僕が日常的に使っているものを紹介します。

##### treefmt-nix

[treefmt](https://treefmt.com/latest/)というフォーマッタをまとめて実行できるツールのモジュール。
フォーマッタの設定がflake.nixひとつでまとまるので重宝してます。

:::details 使用例

nixfmtを有効にする例です。
使用可能なフォーマッタは[README](https://github.com/numtide/treefmt-nix?tab=readme-ov-file#supported-programs)で確認できます。

```nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    flake-parts.url = "github:hercules-ci/flake-parts";
    systems.url = "github:nix-systems/default";
  };

  outputs =
    inputs@{
      self,
      systems,
      nixpkgs,
      flake-parts,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        inputs.treefmt-nix.flakeModule
      ];
      systems = import systems;

      perSystem =
        {
          config,
          pkgs,
          system,
          ...
        }:
        {
          treefmt = {
            projectRootFile = "flake.nix";
            programs = {
              nixfmt.enable = true;
            };

            settings.formatter = { };
          };
        };
    };
}
```
:::

##### git-hooks

[pre-commit](https://pre-commit.com)を使ってcommit前に実行する処理を定義できるモジュールです。
pre-commit自体はPythonで書かれていますが、Nixだとそのあたりに気を遣わなくても良いのがうれしいですね。

僕はリポジトリにうっかり秘密鍵を入れてしまわぬようにgit-secretsによる秘密鍵の検出を組み込んで使っています。

https://comamoca.dev/blog/2024-11-11-flake-git-hooks/


また、先述したtreefmtもgit-hooksに対応しているのでcommit前にtreefmt-nixによるフォーマットのチェックを行えます。

:::details 使用例

ripsecretsとgit-secretsによるクレデンシャルが含まれていないか確認するhookを定義しています。

```nix
{
  description = "A basic flake to with flake-parts";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    systems.url = "github:nix-systems/default";
    git-hooks-nix.url = "github:cachix/git-hooks.nix";
  };

  outputs =
    inputs@{
      self,
      systems,
      nixpkgs,
      flake-parts,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        inputs.git-hooks-nix.flakeModule
      ];
      systems = import inputs.systems;

      perSystem =
        {
          config,
          pkgs,
          system,
          ...
        }:
        let
          git-secrets' = pkgs.writeShellApplication {
            name = "git-secrets";
            runtimeInputs = [ pkgs.git-secrets ];
            text = ''
              git secrets --scan
            '';
          };
        in
        {
          pre-commit = {
            check.enable = true;
            settings = {
              hooks = {
                ripsecrets.enable = true;
                git-secrets = {
                  enable = true;
                  name = "git-secrets";
                  entry = "${git-secrets'}/bin/git-secrets";
                  language = "system";
                  types = [ "text" ];
                };
              };
            };
          };
        };
    };
}
```

:::

##### service-flake

https://community.flake.parts/services-flake

[process-compose](https://f1bonacc1.github.io/process-compose)を使ってNixで宣言的にプロセスの実行を
定義するモジュールです。いわゆる`docker-comopse`に近い機能を持っています。

:::details 使用例

以下に[services-flakeのドキュメント](https://community.flake.parts/services-flake/start)を参考にしたflakeのサンプルを示します。

`nix run .#myservice`でRedisとそれを制御するコンソールが起動します。

また、flake-serviceはGrafanaなども対応しています。
これについては[サンプルを書いてみた](https://github.com/Comamoca/sandbox/tree/main/service-flake-redis)ので参考にしてみてください。


```nix
{
  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    systems.url = "github:nix-systems/default";
    services-flake.url = "github:juspay/services-flake";
    process-compose-flake.url = "github:Platonic-Systems/process-compose-flake";
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      flake-parts,
      systems,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import systems;

      imports = [
        inputs.process-compose-flake.flakeModule
      ];

      perSystem =
        { ... }:
        {
          process-compose."myservice" = {
            imports = [
              inputs.services-flake.processComposeModules.default
            ];

            services.redis."r1".enable = true;
          };
        };
    };
}
```

:::


### Templateを定義する

以下のコマンドを実行するとflake-partsのテンプレートがカレントディレクトリにダウンロードされます。

```sh
nix flake init -t github:hercules-ci/flake-parts
```

これはFalkeのテンプレートと呼ばれる機能で、flake内の`templates`属性に定義をすることで使用できます。

以下は実際にテンプレートとして[公開](https://github.com/Comamoca/scaffold)しているflakeの抜粋です。

https://github.com/Comamoca/scaffold/blob/645dd21c957972b0c0d35727738b9f5c3244d655/template.nix#L3-L6

モジュールとして切り出しているのでやや変則的になっていますが、これは以下のNix式と等価です。

```nix
flake-parts.lib.mkFlake { inherit inputs; } {
  flake = {
    templates = flake-basic = {
      path = ./flake-basic;
      description = "Nix flake basic template.";
    };
  }; 
}
```

こうして定義されたテンプレートは以下のコマンドで取得できます。
`flake-basic`の部分が`templates`の属性となっています。

```sh
nix flake init -t github:Comamoca/scaffold#flake-basic
```

### devSehllでも普段使っているシェルを使いたい

さて、これまで何回かdevShellに入っていると思いますが、devShell内ではシェルがbashになっていることに気付いたと思います。
日ごろからシェルをカスタマイズしている皆さんにとってこれはとても苦痛だと感じたはずですが、ちゃんと解決方法があります。

#### direnv

https://github.com/nix-community/nix-direnv

nix-direnvというツールを使うと、

- devSehllを定義したflakeファイルがある
- `use flake`と書かれた`.envrc`ファイルがある

の以上2つを満たしたディレクトリで自動的に`nix develop`相当の処理が実行され**普段使っているシェルのまま**開発環境に入ります。

Emacsなら[emacs-direnv](https://github.com/wbolster/emacs-direnv)を入れておくと、
該当のディレクトリのファイルを開いた時に自動で有効化されるので便利です。

僕はVimを普段ディレクトリごとに開くタイプですのでこういったプラグインは使いませんが、
[direnv.vim](https://github.com/direnv/direnv.vim)等プラグインが存在してます。

## 余談

この記事ではNix Flakeを1ファイルから開発環境を構築するツールとして利用する方法を紹介してきました。
Nixは汎用性が非常に高い技術ですので、ここで紹介できた内容も氷山の一角でしかありませんがそれでも日ごろの開発を改善していくには十分です。

もしここに書かれている内容が物足りなくなってきたら、nixpkgsコミッターもいることで有名な[vim-jp Slack](https://vim-jp.org/docs/chat.html)の`#tech-nix`チャンネルを覗いてみてください。
そこには毎日生活をNixで破壊しているNixの猛者がたくさんいるのできっと満足できるはずです。


[^1]: なおNix言語は純粋な関数型言語なのでこれは偶然ではなく必然。
[^2]: ただNixにおけるビルドは従来のビルドツールが行っているビルドと違い、実行ファイルやバイナリを作らなくても成立する点は注意。
[^3]: Nixにおいてパッケージの集合を指す言葉。
[^4]: https://zenn.dev/asa1984/books/nix-hands-on/viewer/ch02-02-use-nixpkgs#%E3%83%A6%E3%83%BC%E3%83%86%E3%82%A3%E3%83%AA%E3%83%86%E3%82%A3%E9%96%A2%E6%95%B0%E3%81%AE%E8%87%AA%E4%BD%9C
[^5]: aarch64-darwin, aarch64-linux, x86_64-darwin, x86_64-linux
