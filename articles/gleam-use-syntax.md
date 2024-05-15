---
title: "Gleamのuseについて"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [gleam]
published: false
---

今回はGleamのuseについて解説します。サンプルプログラムは[Comamoca/sandbox]()にて公開しています。

useとは、端的に言うと**高階関数をネストせずフラットに記述できる糖衣構文**です。

主にコールバックを受け取る`result.try`などの関数や、Webフレームワーク[Wisp](https://github.com/gleam-wisp/wisp)のミドルウェアなどで使われています。


```rust:wispのミドルウェアでの使用例
import wisp.{type Request, type Response}

pub fn handle_request(request: Request) -> Response {
  use <- wisp.log_request(request)
  use <- wisp.serve_static(request, under: "/static", from: "/public")
  wisp.ok()
}
```


:::message
useは非常に強力な構文ですが、乱用すると読みずらくなるため注意してください。
5/12日現在[Gleam Playground](https://johndoneth.github.io/gleam-playground/)はuseに対応していません。
代わりに、[codesandbox](https://codesandbox.io)のGleamテンプレート[^1]や[The Gleam Language Tour](https://tour.gleam.run/)などを使用してください。
:::

## 構文

まずはuseの構文を解説します。

### 書式

useは次のように書きます。

- 高階関数が`fn (value) -> value`のように、**引数を受け取る**形の場合

```rust
use value <- func()
// `value`を使った処理を書く
io.println(value)
```

- 高階関数が`fn () -> value`のように、**引数を受け取らない**形の場合

```rust
use <- func()
io.println("Hello")
```

これは以下のコードと実質的に等価です。

- 高階関数が`fn (value) -> value`のように、**引数を受け取る**形の場合

```rust
func(fn (value) {
  // `value`を使った処理を書く
  io.println(value)
})
```

- 高階関数が`fn () -> value`のように、**引数を受け取らない**形の場合

```rust
func(fn () {
  io.println("Hello")
})
```

### サンプルプログラム

以下にuseを使った場合とそうでない場合のサンプルプログラムを示します。

:::message
以下のプログラムは実行に必要なimport宣言と`main`関数を省いています。
実行可能なプログラムについては[こちら](https://github.com/Comamoca/sandbox/blob/main/ex_gleam_use/src/ex_gleam_use.gleam)に公開しています。
:::

#### useで引数を受け取る場合

数値が偶数か判定し`Result`を返す`even`関数を使い、`even`関数の戻り値に依存する処理を実行するサンプルです。

:::message
useを使う場合、コールバックは最後に受け取る必要があります。
OK: `fn (arg, fun: fn () -> Int)`
NG: `fn (fun: fn () -> Int, arg)`
:::

```rust
import gleam/io
import gleam/result

pub fn main() {
  io.debug(with_use())     // Ok(4)
  io.debug(without_use())  // Ok(4)
}

fn even(n: Int) -> Result(Int, String) {
  case n % 2 {
    0 -> Ok(n)
    _ -> Error("Not even.")
  }
}

pub fn without_use() {
  result.try(even(2), fn(n) { Ok(n * 2) })
}

pub fn with_use() {
  use n <- result.try(even(2))
  Ok(n * 2)
}
```

#### useで引数を受け取らない場合

文字列を返す関数`middle_1`と`middle_2`を連鎖的に呼び出すサンプルです。
Gleamのwebフレームワーク[wisp](https://github.com/gleam-wisp/wisp)のmiddlewareを参考に書きました。

```rust
pub fn with_use_novalue() {
  use <- middle_1()
  use <- middle_2()
  "hi"
}

pub fn without_use_novalue() {
  middle_2(fn() { middle_1(fn() { "hi" }) })
}

fn middle_1(next: fn() -> String) {
  next()
}

fn middle_2(next: fn() -> String) {
  next()
}
```

## useの境界

useを使っていると以下のような**useのスコープの終了を明示的に示したい**ケースに遭遇することがあります。しかしこのコードはエラーが発生します。

なぜなら`"return"`の箇所までがuseのスコープだと解釈されるからです。
この場合、`result.try`に`fn(a) -> Result(c, b)`ではなく`fn(a) -> String`が与えられエラーになります。

```rust
fn fetch_content() -> String {
  // httpc.sendはResult(Response(String), Dynamic)を返すので、一旦Resultを剥したい
  use resp <- result.try(httpc.send(req))
  io.debug(resp)
  
  Ok(Nil)
  
  // Stringを返す関数なので最後に文字列を置きたい
  "return"
}
```

この場合は[ブロック構文](https://tour.gleam.run/basics/blocks/)を使ってuseをスコープ内で実行する必要があります。

```rust
fn fetch_content() -> String {
  let body = {
    use resp <- result.try(httpc.send(req))

    Ok(resp.body)
  }

  io.debug(body)
  
  // 関数の定義通りStringを返せる
  "return" 
}
```

なおこのブロック構文は**戻り値を受け取らなくてもかまいません**。
上記のコードの`let body = ...`の箇所はこのようにも書けます。

```rust
{
  use resp <- result.try(httpc.send(req))
  io.debug(resp.body)
  Ok(Nil)
}
```

## 実用的なサンプルコード

[sandbox/ex_gleam_httpc](https://github.com/Comamoca/sandbox/tree/main/ex_gleam_httpc)にてGleamのHTTPクライアント[httpc](https://github.com/gleam-lang/httpc)を使ったサンプルコードを公開しています。どのように使うのかイメージを掴めていただければ幸いです。

以下は使われている箇所の抜粋です。

`fetch.gleam`24行目から27行目
https://github.com/Comamoca/sandbox/blob/15563a1e6990a61643624d9b9880d9cd3e3893f9/ex_gleam_httpc/src/fetch.gleam#L24-L27

`ex_geam_httpc.geam`23行目から32行目
https://github.com/Comamoca/sandbox/blob/15563a1e6990a61643624d9b9880d9cd3e3893f9/ex_gleam_httpc/src/ex_gleam_httpc.gleam#L23-L32

## useはいつ使うべきでいつ使うべきではないのか

以下の条件に当てはまるのなら、使うことを検討すべきだと考えます。

- [ ] コールバックが2つ以上ネストしている
- [ ] 高階関数を複数連続で実行させたい

### コールバックが2つ以上ネストしている

冒頭でも述べたとおり、useは`result.try`などのコールバックを受け取る関数などで威力を発揮します。
しかし、**useは例外処理や非同期処理を内包する構文となっている**ため、[^2]それ以外でも使うことが可能です。

Gleamには[Elixir Task](https://hexdocs.pm/elixir/1.13/Task.html)のようにプロセス生成を手軽にできる[gleam/otp/task](https://hexdocs.pm/gleam_otp/gleam/otp/task.html)というモジュールがあります。

その`gleam/otp/task`にある`task.async`関数の仕様は以下のようになっており、useを用いて簡潔に処理を書けます。

```rust
pub fn async(work: fn() -> a) -> Task(a)
```

以下は模式的なサンプルコードです。

```rust
import gleam/otp/task

pub fn main() {
  fetch_proc()
  |> task.await_forever() // 終了するまで無限に待機
  |> io.println
}

fn fetch_proc() -> Task(String){
  use <- task.async
  // 重い処理、時間のかかる処理

  "result" // 戻り値
}
```

### 高階関数を再帰的に複数連続で実行させたい

`fn (fun: fn () -> value)`のような仕様の関数を連鎖させて実行させたいなどの場合にはuseの使用を考えるべきです。

```rust
import gleam/int
import gleam/io

pub fn main() {
  use <- foo()
  use <- mul2()
  "4"
}

fn foo(fun: fn() -> String) {
  let return = fun()
  io.debug("This is foo")
}

fn mul2(fun: fn() -> String) {
  let return = fun()

  case int.parse(fun()) {
    Ok(n) -> int.to_string(n * 2)
    Error(_) -> "not number"
  }
  |> io.debug

  return
}
```

### 関数を遅延実行させる

Goのdeferのような、処理が終わった時に特定の処理を実行させたい際もuseが使えます。

```rust
import gleam/io

pub fn main() {
  use <- defer(fn() { io.println("Goodbye") })
  io.println("Hello!")
}

fn defer(cleanup, body) {
  body()
  cleanup()
}
```

## まとめ

今回はGleamのuseについて解説しました。
useを使うと処理をスッキリと書けるので、適度に使って楽しくGleamを書いていきましょう！

[^1]: ダッシュボードから右上のdevboxをクリックし、検索欄に**Gleam**と入力すれば出てきます。
[^2]: https://github.com/gleam-lang/gleam/discussions/2051#discussioncomment-5213412
