---
title: "TypeScriptユーザーに贈るGleam入門"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [gleam, typescript]
published: true
---

:::details スマホの人向け目次
- [Erlangについて](#erlangについて)
- [GleamとTypeScriptは何が違うのか](#gleamとtypescriptは何が違うのか)
- [インストール方法](#インストール方法)
- [GleamとJavaScript](#gleamとjavascript)
- [実行方法](#実行方法)
- [エントリポイント](#エントリポイント)
- [標準出力](#標準出力)
- [変数](#変数)
- [定数](#定数)
- [プリミティブ型](#プリミティブ型)
- [コレクション型](#コレクション型)
- [その他の型](#その他の型)
- [型変換(キャスト)](#型変換(キャスト))
- [カスタム型](#カスタム型)
- [四則演算](#四則演算)
- [比較](#比較)
- [パターンマッチ](#パターンマッチ)
- [例外処理](#例外処理)
- [use](#use)
- [関数](#関数)
- [パイプライン](#パイプライン)
- [関数キャプチャ](#関数キャプチャ)
- [ジェネリクス](#ジェネリクス)
- [モジュール](#モジュール)
- [外部関数](#外部関数)
- [パッケージ](#パッケージ)
- [Gleamパッケージの探し方](#gleamパッケージの探し方)
- [寄付について](#寄付について)
- [参考文献](#参考文献)
:::

最近v1に到達したGleamという静的型付けな関数型言語があります。

https://gleam.run/

Gleamは**Erlang**と**JavaScript**をターゲットに実行できるため、今TypeScriptを使っている領域でも使うことができます。

この記事ではTypeScriptユーザー向けにGleamの文法を解説していきます。
記事を通してGleamの良さを感じていただければ幸いです。

Gleamの公式サイトでは以下の言語のユーザー向けのチートシートもあるため、この中に知っている言語があるのならそちらを読んでみるのがオススメです。

- Elixir
- Elm
- Erlang
- PHP
- Python
- Rust


https://gleam.run/documentation

また、個人的にGleamの情報を[Cosense(Scrapbox)](https://scrapbox.io/gleam-jp/)にまとめているので、リファレンスがてら覗いてみてください。
organizationとして管理していきたいと考えているので、編集のリクエスト等も歓迎です。
編集したい場合は自分の[Twitter](https://twitter.com/@Comamoca_)にDMを送るかメンションしてください。

## Erlang/OTPについて

この記事ではTypeScriptユーザーに馴染み深いJavaScriptターゲットを前提として解説していきますが、ここで少しErlangとOTPについて説明します。

https://www.erlang.org/

Erlangは可用性の高いアプリケーションを構築するための**オープンソースな動的型付けな関数型プログラミング言語**です。

スウェーデンの通信会社エリクソンによって開発され社内で利用されていましたが、後にOSSとして公開されたという経緯をもっています。
Erlang VM(BEAM)というVM上で実行され、**高い並列性・堅牢性**を持っています。

Erlang/OTPは高い並列性・堅牢性を生かして以下のようなプロダクトで使われています。

- Discord(Elixir)  
あんまり知られてないですがDiscordは[fastglobal](https://github.com/discord/fastglobal)等著名なElixir向けライブラリを公開しています。

https://elixir-lang.org/blog/2020/10/08/real-time-communication-at-scale-with-elixir-at-discord/

- RabbitMQ(Erlang)  

OSSのメッセージキューイングシステムです。

https://www.rabbitmq.com/

- CouchDB(Erlang)  

OSSのドキュメント指向のデータベースです。
[Obsidian Livesync](https://github.com/vrtmrz/obsidian-livesync)のバックエンドなんかで使われています。

https://couchdb.apache.org/

- Nintendo Switchプッシュ通知システム(Erlang & ejabberd)

https://speakerdeck.com/elixirfest/otp-to-ejabberd-wohuo-yong-sita-nintendo-switch-tm-xiang-ke-hutusiyutong-zhi-sisutemu-npns-false-kai-fa-shi-li


Erlang/OTPは主に以下のような機能を備えています。

- 軽量なプロセスベースの並列処理
- プロセスの状態を自動で管理するSupervisor
- 実行中のプログラムをシャットダウンせずに入れ替えるホットスワップ
- 他のErlang VM上の関数を容易に呼び出せる

Erlangのプロセスは非常に軽く、一般的なマシン上で万単位のプロセスを起動できます。

また、Erlang VM上で動く言語はErlang以外にも以下のものが挙げられます。

- Elixir
- LFE(Lisp Flavoured Erlang)

**Gleamはこれらの言語を呼び出したり、逆にElixirなどからライブラリとして使うことができます。**

これらの連携方法は以下を参照してください。

https://zenn.dev/comamoca/articles/call-elixir-library-from-gleam-project

https://zenn.dev/comamoca/articles/interop-of-gleam-and-elixir

### OTP

OTPはErlangに付属しているライブラリ郡です。

https://www.erlang.org/doc/readme.html

よく使われるのは以下のモジュールです。

- プロセスを監視して自動的に再起動させたりできる`Supervisor`
- 状態と振舞いを実装できる`GenServer`
- 内蔵かつ堅牢なインメモリストア`Erlang Term Storage` 
- 同じく内蔵された分散データベース`Mnesia`


### Erlangの並列性を体感してみる

Erlangの並列性を感じるため、実際に動かしてみます。
ここでは[`gleam_otp`](https://hexdocs.pm/gleam_otp/)という公式のOTPバインディングを使ってみます。

以下のコードはこちらで公開しています。

https://github.com/comamoca/sandbox/tree/main/ex_gleam_parallel

```rust
import gleam/erlang/process
import gleam/int
import gleam/io
import gleam/iterator
import gleam/list
import gleam/otp/task
import gleam/string


/// 並列に実行しない場合
fn not_parallel() {
  iterator.range(0, 10)
  |> iterator.map(fn(n) { sleep(n) })
  |> iterator.to_list
}

/// 並列に実行する場合
fn parallel() {
  iterator.range(0, 10)
  |> iterator.map(fn(n) { task.async(fn() { sleep(n) }) })
  |> iterator.to_list
  |> list.map(fn(t) { task.await_forever(t) })
}

// Sleep処理。1秒処理を停止させる。
fn sleep(n: Int) {
  io.println(string.concat(["[", int.to_string(n), "]", " Sleeping..."]))
  process.sleep(1000)
}
```

![](https://storage.googleapis.com/zenn-user-upload/5e9ca03529d4-20240614.gif)

`not_parallel`を実行すると10秒かかりますが、`parallel`を実行すると2秒程度で終わります。


JavaScriptでは似たような処理をするために`Promise.all`を使います。
ですが、Erlangの並列処理はこれと違い**task.asyncの時点で並列に動作するプロセスが生成されている**というのが大きな違いです。


## GleamとTypeScriptは何が違うのか

Gleamには以下に挙げるような構文・機能が存在しません。

- for・while文
- if文
- throw-catch(大域脱出)
- クラス

逆に、GleamにはありTypeScriptにはない構文・機能は以下になります。

- パターンマッチ
- Result型
- パイプライン

総じて以下のように考える人が向いていると考えています。

- 関数型言語の構文や静的型付けをJavaScriptでも使いたい
- 馴染みのある文法でErlang VMの能力を生かした堅牢・高可用なWebアプリケーションを作りたい


## インストール方法

Gleamを実行するためにはGleamコンパイラとそれぞれのターゲットの実行環境が必要です。

インストール方法は公式サイトに書かれているので割愛します。

https://gleam.run/getting-started/installing/

miseを使うとGleamコンパイラのみならず、Erlangやraber、Node.jsなどコンパイラや実行環境がまとめて手に入るのでオススメです。

https://mise.jdx.dev/

## GleamとJavaScript

GleamはES6に準拠したJavaScriptを出力します。
また、Gleamは珍しくNode.jsやブラウザー以外にDenoとBunの実行もサポートしています。

Denoに関しては設定ファイル`gleam.toml`にて実行時権限の指定が可能です。

https://gleam.run/writing-gleam/gleam-toml/

例えば実行にDenoを使い、`--allow-net`を指定する場合は以下のように書きます。

```toml
name = "my_project"
version = "1.0.0"
licences = ["MIT"]
description = "Gleam bindings to..."

target = "javascript"
runtime = "deno"

[dependencies]
gleam_stdlib = ">= 0.18.0 and < 2.0.0"

[javascript.deno]
allow_net = true
```


## 実行方法

:::message
今すぐ実行したい方は公式の[Language tour](https://tour.gleam.run/)からインタラクティブに実行できるのでそちらを使ってみてください。
Erlangバックエンドを試したい方は[Codesandbox](https://codesandbox.io/)からGleamのdevboxが使えるので、そちらを試してみてください。
:::

GleamコンパイラはRustで書かれたシングルバイナリとして配布されているので、コンパイラをダウンロードすればコードの変換は可能です。
実行するためにはErlangターゲットの場合はErlangとraber3、JavaScriptターゲットの場合はNode.jsまたはDenoとBunが必要です。

`gleam new`コマンドで生成されるプロジェクトのディレクトリ構造は以下のようになっています。

```
.
├── gleam.toml
├── README.md
├── src
│   └── sample.gleam <- `gleam run`するとこのファイルのmain関数が実行される。
└── test
    └── sample_test.gleam
```

```rust:src/sample.gleam
import gleam/io

pub fn main() {
  io.println("Hello from sample!")
}
```

初回実行時は依存パッケージのダウンロードも併せて行われます。
```sh
❯ gleam run
Downloading packages
 Downloaded 2 packages in 0.01s
  Compiling gleam_stdlib
  Compiling gleeunit
  Compiling sample
   Compiled in 1.18s
    Running sample.main
Hello from sample!
```


## エントリポイント

TypeScriptは基本的に言語側で決められたエントリポイントは存在しません。
Gleamでは`gleam run`コマンドが実行されると`src/`配下にある`プロジェクト名.gleam`というファイルの`main`という関数が実行されます。

また`gleam run -m tmp`のように、`-m`オプションを付けることで実行されるモジュールを指定できます。
この場合、指定されたモジュールの`main`関数が実行されます。

個人的には`src/tmp.gleam`にプロトタイプを記述して挙動を確認しているのでとても重宝しています。

:::message
なお、これ以降Gleamのサンプルコードは原則`main`関数や`import`を省略して書きます。
:::

```ts
console.log("Hello!")
```

```rust:project_name.gleam
import gleam/io

pub fn main() {
  io.println("Hello!")
}
```

## 標準出力

TypeScriptには`console.log`という関数が組込みで使えます。
Gleamでは標準出力は`gleam/io`というライブラリで提供されてます。

`gleam/io`ライブラリにある`io.debug`という関数は**あらゆる型を受け入れ標準出力する関数**で、デバッグする際非常に便利です。
またこの関数は**入力された値をそのまま返す**という特性を持っているためパイプラインに容易に挿入できます。

```rust
let a = 1
let b = 2

a
|> io.debug   // => 2
|> int.add(b)
```

```ts
console.log(149)
```

```rust
import gleam/io

io.debug(149)
```

## 変数

Gleamでは`let`キーワードで変数を束縛できます。
また、同じ変数名で変数を束縛すると上書きされます。

Gleamでは型以外**大文字の使用が禁止**されているため、変数は基本的に小文字のスネークケースで表記されます。

```ts
const name = "temari" // name is temari
const name = "kotone" // name is kotone

console.log(name) // "kotone"
```

```rust
let name = "temari" // name is temari
let name = "kotone" // name is kotone

io.debug(name) // "kotone"
```

## 定数

`const`で定数を宣言できます。
Gleamの`const`は**コンパイル時に確定する**ため、TypeScriptとは異なり`const`の右辺には関数呼び出しを含めることはできません。
また、モジュールのトップレベルでしか宣言できません。

```rust
import gleam/io

const name = "arisu"

pub fn main() {
  io.debug(name) // "arisu"
}
```

## プリミティブ型

プリミティブ型として以下のものがあります。

- String
- Int
- Bool
- Float

### String

UTF-8で表現された文字列です。
`<>`で文字列同士を結合できます。

`\`を使うことでエスケープシーケンスが使えます。
複数行の記述は`""`で可能です。

```ts
let name = "arisu"

let kiremeki = `
キラキラ夢見よう 夢を見ることに
早すぎるも遅すぎるもないから 自分らしい夢を！
`
```


```rust
let name = "arisu"

let kiremeki = "
キラキラ夢見よう 夢を見ることに
早すぎるも遅すぎるもないから 自分らしい夢を！
"

io.println("name is" <> name)
```

TypeScriptでよく使われるテンプレートリテラルは**Gleamには存在しません**。
代わりに文字列のListを結合する`string.concat`関数を使うと似た感じで書くことができます。
もし結合する際の文字を指定したい場合は`string.join`関数を使います。

```ts
const name = "hifumi"
console.log(`${name} daisuki`)
```

```rust
import gleam/string

let name = "hifumi"
let tmpl = [name, "daisuki"]

string.concat(tmpl)
```

### Int

小数を含まない数値を扱います。また、負数も束縛できます。
Erlangターゲットの場合は大きさに制限がありませんが、JavaScriptターゲットの場合は`number`として扱われるため`number`の制約がかかります。

```ts
const u = 149
const n = -3
```

```rust
let u = 149
let n = -3
```

## コレクション型

以下のコレクション型があります。

- List
- Tuple
- Dict


### List

順序付けされた値が格納される型です。全ての要素が同じ値でないといけません。

また単一リストで作られており、先頭から要素を追加したり削除したりする処理が非常に非効率な特徴があります。

インデックスに直接アクセスするような処理は非常に非効率なため推奨されておらず、Gleam標準ライブラリv0.38.0からListのインデックスにアクセスする関数`list.at`が削除されています。
そのようなケースでは[iterator](https://hexdocs.pm/gleam_stdlib/gleam/iterator.html)の方が向いてるでしょう。

```ts
const even = [2, 4, 6, 8, 10]
const words = ["hello", "world"]
```

```rust
let even = [2, 4, 6, 8, 10]
let words = ["hello", "world"]
```

### Tuple

型の異なる値をまとめて扱える型です。
このようなケースではカスタム型を作った方が良いため、あまり使われるケースはありません。

```ts
const arisu: [string, number] = ["arisu", 12] 
```

```rust
let arisu: #(String, Int) = #("arisu", 12)
```

### Dict

Key Value形式で値をまとめて扱えます。
それぞれの要素の型は全て同じである必要があります。

また、Dict型はタプルのリストから作るケースが多いです。
その際は`dict.from_list`関数を使います。

```ts
const arisu = {name: "arisu", age: 12}
```

```rust
let arisu = dict.from_list([#("name", "arisu"), #("age", "12")])
```

```rust
let arisu = dict.from_list([#("name", "arisu"), #("age", 12)]) // => `12`はInt型なのでコンパイルエラーになる。
```

## その他の型

その他の型として以下のものがあります。

- Nil
- Result

### Nil

TypeScriptでいう`undefined`や`void`のような型です。  
Gleamは**全ての関数が値を返す必要がある**ため、返す値がない場合はNilが返されます。

```ts
console.log("Hello") // -> undefined
```

```rust
io.println("Hello") // -> Nil
```

### Result

Resultは失敗する可能性のある処理を行う関数が返す型です。
TypeScriptは`Result`型が存在しないので、[ts-results](https://github.com/vultix/ts-results)を使っています。[^1]

```ts
import { Ok, Err, Result } from 'ts-results';

function iseven(n: number): Result<number, string> {
  if (n % 2 == 0) {
    return Ok(n)
  } else {
    return Err("Not even.")
  }
}

iseven(2) // t { ok: true, err: false, val: 2 }
iseven(5) // t { ok: false, err: true, val: "Not even.", _stack: "..." }
```

```rust
fn iseven(n: Int) -> Result(Int, String) {
  case n % 2 {
    0 -> Ok(n)
    _ -> Error("Not even.")
  }
}

iseven(2) // Ok(2)
iseven(5) // Error("Not even.")
```

## 型変換(キャスト)

Gleamは型変換が言語仕様として存在しないので、標準ライブラリを使って変換します。
また、TypeScriptには小数を扱う専用の型が存在しないのでFloatのサンプルコードは省略しています。

### Int -> String

```ts
String(149) // "149"
```

```rust
import int

int.to_string(149) // => "149"
```

### String -> Int

```ts
Number(149)     // => "149"
Number("arisu") // => NaN
```

```rust
import int

int.parse("149") // => Ok(149)
int.parse("arisu") // => Error(Nil)
```

### String -> Float

```rust
import float

float.parse("14.9") // => Ok(14.9)
float.parse("arisu") // => Error(Nil)
```

### Float -> Int

```rust
import float

float.round(14.9) // => 15
```

### Float -> String

```rust
import float

float.to_string(14.9) // => "14.9"
```

### Bool -> String

```ts
String(true) // => "true"
String(false) // => "true"
```

```rust
import bool

bool.to_string(True) // => "True"
bool.to_string(Bool) // => "Bool"
```

### Bool -> Int

```ts
Number(true)
Number(false)
```

```rust
import bool

bool.to_int(True)  // => 1
bool.to_int(False) // => 0
```

## カスタム型

`type`キーワードで型を定義できます。型定義はモジュールのトップレベルに記述する必要があります。

`let`や`const`、`fn`キーワードと同様に`pub`キーワードを使って外部に公開できます。

Gleamの型定義はTypeScriptと違って、型の中にバリアントを含む構造をとっています。
また、バリアントの要素は`.`でアクセスでき、バリアントそのものがコンストラクタになっています。

このコンストラクタさえあればどこでも型の実体を生成できます。
ですが、プリミティブ型に何らかの制約を課している型(e.g. メールアドレスを定義した型など)を作りたい場合などはコンストラクタを自分で定義したくなるケースがあります。そのような場合に使えるのが`opaque`です。

`opeque`は不透明型と言って、**型自体は公開されているものの、そのバリアントを自ら呼び出せないよう制限されている型**を指します。

詳しくは以下の記事で解説しています。

https://zenn.dev/comamoca/articles/gleam-opaque-type


ちょっと紛らわしい[^2]ですが、typeで宣言している`Idol`とバリアントの`Idol`は**全く異なるもの**です。
`import`で型を指定する際には以下のようにimportします。

- `type`で宣言している型  
`import modname.{type TypeName}`でimportします。

- バリアント  
`import modname.{VariantName}`でimportします。


```ts
interface Idol {
  name: string
  age: number
}
```

```rust
type Idol {
  Idol(name: String, age: Int)
}
```

```ts
const idol: Idol = {name: "arisu", age: 12}
```

```rust
let idol: Idol = Idol("arisu", 12) // バリアント名で型の実体を生成している。
idol.name // => "arisu"
idol.age  // => 12
```

カスタム型は`case`にてパターンマッチを行えます。
これを使うことで状態による条件分岐をスッキリと記述できます。

```rust
pub type State {
 Continue
 Shutdown
 State(val: Int)
}

let state = State(149)

case state {
  State(val) -> io.println("state: " <> int.to_string(val))
  Continue -> io.println("Continue")
  Shutdown -> io.println("Continue")
}

let state = Continue

case state {
  State(val) -> io.println("state: " <> int.to_string(val))
  Continue -> io.println("Continue")
  Shutdown -> io.println("Continue")
}
```


## 四則演算

TypeScriptでも使えるような演算子がGleamでも使えます。
Gleamは他の言語と異なり**ゼロ除算で0を返します**。

これに疑問を感じる方が多いと予想しているので、詳しい説明を以下折り畳みにて書いておきました。
興味があったらぜひ読んでみてください。

:::details なぜGleamは0を返すことを選んだのか

Gleam 0.13のリリースノートの**Type safe division**の項目にはこのように書かれています。

https://gleam.run/news/gleam-v0.13-released

> Gleam aims to be an exception free language, and the assert keyword is intended as being the only way to crash a process. Errors should be represented by the type system, so it is not in keeping with the design and goals of the language for division to sometimes crash when dividing numbers.

> Languages such as JavaScript that follow IEEE 754 return an Infinity value when dividing by zero, which may be positive or negative. This is a familiar solution to many programmers, and it fits well with Gleam’s “never implicitly crash” goal.

> Unfortunately there is no Infinity value on the Erlang virtual so Gleam would have to implement this. While possible this would cause problems with Erlang and Elixir interop- we could no longer safely pass Gleam numbers to Erlang functions as they may be this special Infinity value, which would likely cause a crash. The same problem would occur when calling Gleam code from Erlang or Elixir, resulting in adding Gleam libraries to your Erlang or Elixir application being less appealling.

邦訳すると以下のようになります。

> Gleamは例外のない言語を目指しており、assertキーワードはプロセスをクラッシュさせる唯一の方法であることを目的としています。
> エラーは型システムで表現される必要があるため、数値を除算するときに時々クラッシュすることは除算の言語設計と目標に沿っていません。

> IEEE754に準拠するJavaScriptなどの言語はゼロで除算すると正または負の無限値を返します。
> これは多くのプログラマーにとって馴染みのある挙動であり、Gleamの「暗黙的にクラッシュしない」という目標によく適合します。

> 残念ながら、Erlang仮想にはInfinity値がないためGleamはこれを実装する必要があります。
> これにより、ErlangとElixirの相互運用性で問題が発生する可能性があります。
> Gleamの整数型はこの特別なInfinity値である可能性があるため、Erlang関数に安全に渡すことができなくなりクラッシュが発生する可能性があります。
> ErlangまたはElixirからGleamコードを呼び出すときにも同じ問題が発生し、その結果ErlangまたはElixirアプリケーションにGleamライブラリを追加する魅力が低下します。

とあるように、GleamではErlangやElixirなどの言語との相互運用性と、「例外が起こらない言語」を目指す目標を加味した結果このような選択をしました。

:::

```ts
700 + 31
200 - 51
72 * 2
24 / 2
```

```gleam
700 + 31
200 - 51
72 * 2
24 / 2
```

小数の演算は別で、専用の演算子が用意されています。

```ts
100.0 + 1.8
100.0 - 1.8
100.0 * 1.8
100.0 / 1.8
```

```gleam
100.0 +. 1.8
100.0 -. 1.8
100.0 *. 1.8
100.0 /. 1.8
```
## 比較

比較に関しても基本的にTypeScriptと同じ演算子が使えます。
四則演算子と同じように小数は専用の演算子が存在します。
等号だけは例外で、全ての型で同じ演算子が使えます。

```ts
100 < 200
100 <= 200

30.0 > 50.0
30.0 >= 50.0

100 == 200
1.0 == 1.2
```

```gleam
100 < 200
100 <= 200

30.0 >. 50.0
30.0 >=. 50.0

100 == 200
1.0 == 1.2
```

## パターンマッチ

Gleamには強力なパターンマッチが存在します。

これはTypeScriptの`switch`などと違い、リストの中身などでも条件分岐を行えます。
また複数の値によるマッチングも行えます。

また以下のケースではコンパイルエラーになります。

- 全てのパターンを網羅していない。
- 戻り値の型が一致しない。

`_`は全ての値にマッチします。
また、左辺に変数を配置することでそのパターンに合致した部分の値を変数として使えます。

### パターンマッチの網羅性

パターンマッチが網羅されていないとエラーが発生します。

```ts
const n = 100

if (n == 100) {
  console.log("Number is 100")
} else if (n == 200) {
  console.log("Number is 200")
} else if (n == 300) {
  console.log("Number is 300")
}
```

```rust
case 100 {
  100 -> io.println("Number is 100") 
  200 -> io.println("Number is 200")
  300 -> io.println("Number is 300")
} // => 全てのパターンが記述されていないためコンパイルエラーになる。
```

逆に、パターンが網羅されていればコンパイルが通ります。

```ts
const n = 100

if (n == 100) {
  console.log(100)
} else {
  console.log(n * 2)
}
```

また、パターンマッチの一部に変数を置いてマッチした値を使えます。

```rust
case 100 {
  100 -> io.debug(100)
  number -> io.debug(number * 2)
} // => 全てのパターンが網羅されているためコンパイルできる
```

### パターンマッチと型の同一性

パターンマッチは右辺全てが同じ型を返さないとコンパイルエラーになります。

```ts
const n = 100

if (n == 100) {
  console.log("Number is 100")
} else {
  console.log(n * 2)
}
```

これは左辺に変数を割り当てている場合でも同じです。

```rust
case 100 {
  100 -> io.debug("Number is 100")  // String
  number -> io.debug(number * 2)    // Int
} // => 右辺の戻り値の型が一致しないためコンパイルエラーになる。
```

```ts
const n = 100

if (n == 100) {
  console.log("Number is 100")
} else {
  console.log("Number is not 100")
}
```

### パターンマッチとワイルドカード

`_`を用いると全てのパターンを記述できます。

```ts
const n = 100

if (n == 100) {
} else {
  console.log("Number is not 100")
}
```

```rust
case 100 {
  100 -> io.println("Number is 100")
  _ -> io.println("Number is not 100")
} // => 全てのパターンが記述されているためコンパイルできる
```

```rust
case ["user", "arisu"] {
  ["user", name] -> io.println("username is " <> name)
  _ -> io.println("username is not found.")
} // => リストもパターンマッチ可能。変数を置くことでその値を使える。
```

## 例外処理

Gleamではエラーを`Result`という型で表現します。
`Result`は正常な場合の`Ok`とエラーの`Error`の2つになりえます。

```rust
fn iseven(n: Int) -> Result(Int, String) {
  case n / 2 {
    0 -> Ok(n)
    _ -> Error("Not even.")
  }
}
```

`Result`から値を取り出すには以下の方法があります。

### let assert

最も簡単に値を取り出せます。値が`Error`だった場合は実行時エラーが発生します。

```rust
let assert Ok(n) = iseven(8)
```

### パターンマッチ

一番オーソドックスな方法です。
やや冗長になりやすい所があります。

```rust
case iseven(8) {
  Ok(n) -> io.println(int.to_string(n) <> "is even.") // => "8 is even."
  Error(err) -> io.println(err) // => "Not even."
}
```

### result.try

`Result`の値が`Ok`だった場合、コールバックが実行されます。`Error`だった場合はその`Error`が返されます。
特に`Result`な値に依存している値を処理したい場合に効果を発揮します。

また内部で`case`を使っているため、`case`のように戻り値の型は同じでなくてはなりません。

```rust
import gleam/result

result.try(iseven(5), fn (n) { Ok(int.to_string(n) <> "is even.") })

result.try(iseven(5), fn (n) { 
  result.try(iseven(n / 3), fn (n) {
    Ok(n)
  })
})
```

## use

コールバックを展開して記述できる構文糖です。
上記の`result.try`を用いたサンプルコードは少し読みづらいですが、この構文を用いるとスッキリと記述できます。

```rust
use n <- result.try(iseven(5))
use n <- result.try(iseven(n / 3))

Ok(n)
```

`use`についての詳しい解説は以下の記事を参照してください。

https://zenn.dev/comamoca/articles/gleam-use-syntax


## 関数

`fn`キーワードで関数を定義できます。
`pub`キーワードを付けると外部のモジュールから呼び出せる関数を定義できます。

また、Gleamの関数は巻き上げ(ホイスティング)されるため、同一モジュール内ならどこで宣言されていても呼び出せます。
:::message
エントリポイントになる`main`関数には必ず`pub`を付ける必要があります。
付けていない場合`gleam run`を実行した際にエラーが発生します。
:::


Gleamにおける型注釈はオプションなので、付けなくてもコンパイルは通りますし**自動的に型推論されコンパイル時に型が検証**されます。
ですがコンパイルエラーが分かりやすくなったり、`gleam docs build`で生成されるドキュメントに型情報が載ったりするので極力書くのをおすすめします。


```ts
function fizzbuzz(n: number): string {
  const mod = n % 15
  if (mod == 0) {
    console.log("FizzBuzz")
  } else if (mod  == 3 || mod == 6 || mod  == 9 || mod == 12) {
    console.log("Fizz")
  } else if (mod == 5 || mod == 10) {
    console.log("Buzz")
  }
}
```

```rust
fn fizzbuzz(n: Int) -> String {
  case n % 15 {
    0 -> "FizzBuzz"
    3 | 6 | 9 | 12 -> "Fizz"
    5 | 10 -> "Buzz"
  }
 }
```

### ラムダ関数(無名関数)

`fn () {}`でラムダ関数を定義できます。
**Gleamの関数は一級関数**なので変数に束縛可能です。

```ts
const greet = (name: string => `Hello! ${name}!`)
greet("arisu") // => Hello! arisu!
```

```rust
let greet = fn (name) {"Hello! " <> name <> "!"}
greet("arisu") // => Hello! arisu!
```

### 即時関数

GleamではJavaScriptでおなじみの即時関数も使えます。

```ts
(()=> {console.log("Hello!")})()
```

```rust
fn () {io.println("Hello!")}()
```

ですが、このようなケースではブロック構文を使った方が良いでしょう。
ブロック構文では複数の式をまとめて実行しその返り値を変数に束縛できます。

```rust
let _ = {
  io.println("Hello!")
}
```


## パイプライン

Gleamには連続する関数の呼び出しをスッキリと記述できるパイプライン演算子があります。
パイプライン演算子を使って関数を呼び出すと、左辺の関数の戻り値が右辺の関数の第一引数に渡されます。

```ts
const add = (a: number, b: number) => a + b
const mul = (a: number, b: number) => a * b

const tmp = add(1, 2)
const n = mul(tmp, 3)
```

```rust
let add = fn (a, b) {a + b}
let mul = fn (a, b) {a * b}

let n = add(1, 2) |> mul(3)
```

## 関数キャプチャ

Gleamには関数キャプチャという構文があります。
これを使うと、いわゆるcurryingのように**与えられていない引数を受け取る新たな関数を作れます**。

```ts
const add = (a: number, b: number) => a + b
const add1 = (a: number) => add(a, 1)

add1(2) // => 3
```

引数を`_`にして値を与えないことで関数がキャプチャされ、新たな関数`add1`が束縛されます。

```rust
let add = fn (a: Int, b: Int) { a + b }
let add1 = add(a, _)

add1(2) // => 3
```

## ジェネリクス

Gleamはジェネリクスをサポートしており、柔軟な型付けが行えます。

```ts
function chooseRandomly<T>(a: T, b: T): T {
  return Math.random() <= 0.5 ? a : b
}
```

```rust
import gleam/int
import gleam/bool

fn choose_randomly(a: t, b: t) -> t {
  use <- bool.guard(when: int.random(10) >= 5, return: a)
  b
}
```

Gleamの型変数はTypeScriptと異なり、**命名規則さえ守っていればどんな名前でもコンパイルが通ります**。
例えば以下のような型変数も可能です。

```rust
import gleam/int
import gleam/bool

fn choose_randomly(a: hifumi_daisuki, b: hifumi_daisuki) -> hifumi_daisuki {
  use <- bool.guard(when: int.random(10) >= 5, return: a)
  b
}
```

## モジュール

`import`でモジュールを読み込めます。
モジュールのパスは全て`src/`からの絶対パスになっています。

```
.
├── gleam.toml
├── manifest.toml
├── README.md
├── src
│   ├── sample.gleam
│   └── sub.gleam
└── test
    └── sample_test.gleam
```

```rust:sub.gleam
pub fn greet(name) {
  "Hello! " <> name <> "!"
}
```

```rust:sample.gleam
import gleam/io
import sub

pub fn main() {
  io.println(sub.greet("arisu"))
}
```

## 外部関数

GleamはErlangとJavaScriptに変換されて実行されます。
そのため、Gleamからそれらターゲットの言語の関数や機能を扱いたい場合が往々にしてあります。

関数定義の上の行に`@external`から始まるアノテーションを付けると、Gleam外部の関数を呼び出せます。

書式は以下の通りです。


JavaScriptターゲットの場合はこのように呼び出します。
デフォルトの実行先がNode.jsなため、ファイル名の拡張子は`.mjs`にする必要があります。

```rust
@external(ターゲット, "ファイル名", "呼び出す関数名")
```

```rust
@external(javascript, "./ffi.mjs", "now") // ffi.mjsのnow関数を呼び出す
```

Erlangターゲットの場合はこのように呼び出します。

```rust
@external(ターゲット, "モジュール名", "呼び出す関数名")
```

```rust
@external(erlang, "calendar", "local_time") // calendar:local_time/0を呼び出す
```

```rust
@external(javascript, "./ffi.mjs", "now")
```

```
.
├── gleam.toml
├── manifest.toml
├── README.md
├── src
│   ├── ffi.mjs
│   ├── sample.gleam
│   └── sub.gleam
└── test
    └── sample_test.gleam
```

## パッケージ

Gleamでは他のユーザーが作成したパッケージを簡単に使えます。
Gleamのパッケージは[hex.pm](https://hex.pm/)という、Erlang VM上で動く言語全てが共有しているパッケージレジストリにて公開されています。

プロジェクトに依存を追加するには`gleam add`コマンドを使います。
ここでは試しに、ANSIエスケープシーケンスを提供している`gleam_community_ansi`を追加してみます。

```sh
gleam add gleam_community_ansi
```
```rust
import gleam/io
import gleam_community/ansi

pub fn main() {
  ansi.bg_pink(ansi.black("Hello Gleam!"))
  |> io.println
}
```

こんな感じで表示されたら成功です。

![](https://storage.googleapis.com/zenn-user-upload/96d4f7ecbb99-20240613.png)


### Gleamパッケージの探し方

Gleam PackagesというHex.pmのGleamパッケージのみを表示してくれるサイトがあるので、自分は専らそこから探してきています。

https://packages.gleam.run/

また、Awesome GleamというGleamで評価の高いパッケージなどが集められているリストがあるので、そこから探すのもオススメです。

https://github.com/gleam-lang/awesome-gleam

GleamにはDiscordコミュニティがあり、**sharing**チャンネルでは毎日ライブラリの更新情報や記事の投稿などがシェアされています。
新しいパッケージの情報がよく見つかるので自分も毎日覗いてます。

https://discord.gg/Fm8Pwmy

## 寄付について

Gleamのブログやリポジトリを見ると必ず最後にスポンサーの名前が載っています。
[GitHub sponsers](https://github.com/sponsors/lpil)経由でGleamを開発しているLouis Pilfoldさんへ寄付ができるので、もしGleamのことを気に入ったのならぜひ寄付してみてください。

ちなみに毎月寄付をしていると先述したスポンサー一覧に名前が載ります。
自分も寄付しているのでぜひ探してみてください。

## 参考文献

https://tour.gleam.run/everything/

https://typescriptbook.jp

https://developer.mozilla.org/ja/docs/Web

https://elixirschool.com/ja

[^1]: 個人的には[monads](https://github.com/thames-technology/monads)の方が好みです。[ブログ記事](https://comamoca.dev/blog/2023-08-24-monads/)
[^2]: ちなみにGleam v1.2.0にて型とバリアントを間違えている旨のコンパイルエラーが出るようになりました。結構間違えやすい箇所だと感じていたので嬉しい変更です。
[^3]: 
