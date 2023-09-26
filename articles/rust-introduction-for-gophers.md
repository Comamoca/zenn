---
title: "GoCLIツール職人のためのRust入門"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [go, rust, cli]
published: false
---

三連休中にこんなツールを作った。

https://github.com/Comamoca/neoenv

普段はGoでCLIツールを書いているけど、このツールで初めてRustを本格的に使ったのでその際に得た知見を元にGoでCLIを作っている人向けに**とりあえずRustでツールが作れる**状態になれることを目指して、CLIツールを作るときによく使っている処理やRustならではの構文などを中心に書いてみた。

この記事を通して「なぁ～んだ。案外Rustでもサクッとツール作れそうじゃん」とか「Rustにも意外とツール向けのライブラリとかあるんだなぁ」とか思って貰えると嬉しい限り。

:::message
自分も最近書き始めた初心者なので間違っている事を書いている可能性が高い。(主に所有権・文字列周り)
もし間違っている箇所があったらコメントなりTwitterでメンション飛ばしてくれる助かります。
:::

[余談](#余談)にも書いてあるけど、「説明は良いから早くサンプルを動かしたいんだけど」という人向けにここにも同じ表を置いておく。

|サンプルコード|対応する項目|
|--------------|------------|
|[rust-reqwest](https://github.com/Comamoca/sandbox/tree/main/rust-reqwest)|[HTTPクライアント](#httpクライアント)|
|[rust-serde](https://github.com/Comamoca/sandbox/tree/main/rust-serde)|[JSONパース](#jsonパース)|
|[rust-notify](https://github.com/Comamoca/sandbox/tree/main/rust-notify)|[ファイル監視](#ファイル監視)|
|[rust-axum-utoipa](https://github.com/Comamoca/sandbox/tree/main/rust-axum-utoipa)|[Webサーバー](#webサーバー)|
|[rust-markdown-rs](https://github.com/Comamoca/sandbox/tree/main/rust-markdown-rs)|[MarkDownをHTMLへ変換](#markdownをhtmlへ変換)|
|[rust-sled](https://github.com/Comamoca/sandbox/tree/main/rust-sled)|[KV](#kv)|

## CLIツールを作る際のGoとRustの使い分け

これは戦争になる可能性が高いので、

- バイナリサイズ・速度に拘るのならRust
- 並列処理・開発スピード・ポータビリティに拘るのならGo

みたいに使い分けるのが良いと考えている。(そういう事にする)

**結局好きなもの使うのが一番ハピハピ☆出来るので気にしすぎないほうが良い**

## GopherがRustを書く際に気をつけた方が良いポイント

## 文字列
なんかもうプリキュアかな？って思うくらい種類がある。だけどツールを作る程度なら`String`と`&str`の相互変換が出来ればなんとかなる。

```rust
fn main() {
    let dog = "ワンちゃん";
    let elephant = "ゾウさん".to_string();
    
    feel_at(dog);
    feel_at(&elephant);
}

fn feel_at(things: &str) {
    println!("{}の気持ちになるですよ", things)
}
```
[Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=ddcbcbdad1b0c5d589e66dd147fb6228)

- String
実態は`Vec<u8>`。中身がUTF-8であることが保証される。(ただの`Vec<u8>`だと中身がUTF-8じゃない場合がある)
主に文字列を破壊的に変更する(副作用のあるメソッド等を実行する場合)などに使われる。

- &str
実態はUTF-8の配列。ただ内容を表示する時とかに使う。

---

上のサンプルコードの`feel_at`関数の引数が`&str`なのは与えられた値を消費してしまうのを避けるため。[^1] (一回値を与えてしまうと他の関数で使えなくなる)
ここでもう一度さっきのコードを読み直してみる。

```rust
fn main() {
    let dog = "ワンちゃん"; // &str
    let elephant = "ゾウさん".to_string(); // String
    
    feel_at(dog); // &strなのでそのまま渡せる
    feel_at(&elephant); // Stringなので*参照にして*渡している

    // `feel_at`は借用しただけなのでprintln!でも使うことが出来る
    println!("{}", elephant);
}

fn feel_at(things: &str) {
    println!("{}の気持ちになるですよ", things)
}
```

## 所有権

[文字列](#文字列)であらかた書いてしまったけれど、引数に破壊的な変更を行ってしまうことを防ぐためにこの様な機構になっている。(メモリ管理をするためという側面もある)

基本的には関数を実行/定義する際に`&`を使って借用したり、破壊的変更を行う関数に対して`.clone()`メソッドや`.copy()`メソッドを実行して回避していくのがメインになってくる。
**ぶっちゃけここら辺はrust-analyzerとRustコンパイラを使えば雰囲気で書いていける。**

## 構造体

Goと同じようにRustにもクラスの構文は無く、構造体を用いた抽象化を行う。ただGoと少し違う書き方をするため簡単に紹介してみる。

```rust
// 構造体を定義
struct Idol {
    name: String,        // 名前
    age: u8,             // 年齢
    height: u8,          // 身長
    zodiac_sign: String, // 星座
}

// 構造体に紐づけされた関数
impl Idol {
    fn show_profile(&self) {
    // &selfか&mut selfが必須
        println!("{}
身長 - {}cm 年齢 - {}歳
星座 - {}座
", self.name, self.height, self.age, self.zodiac_sign);
    }
}

fn main() {
    // 構造体から実体を生成
    let arisu = Idol {
        name: "橘ありす".to_string(),
        age: 12,
        height: 141,
        zodiac_sign: "獅子".to_string()
    };
    
    let chie = Idol {
        name: "佐々木千枝".to_string(),
        age: 11,
        height: 139,
        zodiac_sign: "双子".to_string()
    };
    
    // メソッドを実行
    arisu.show_profile();
    chie.show_profile();
}
```
[Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=e21244e24f2f3637f3ff7cd990b9989c)


ポイントは以下の3つ

- `struct`で構造体を宣言
- `impl`でメソッドを定義。その際`&self`か&mut self(Goで言うレシーバ)を第一引数に指定する。
- 実体を生成する際に(newみたいな)キーワードは要らない

## 例外処理

Rustの例外処理では主に`Result`と呼ばれる型が使われる。これは成功するか不確定な処理結果を表現するための型で、

- Ok
- Err

の2種類の値のどちらかを返す。

とりあえず値を取り出したい場合は`unwrap()`を使うことで取り出すことができる。だた、もし`Err()`が返された場合はパニックを起こすので要注意。
例外処理をキャッチするには`match`構文を使って**パターンマッチ**を行う。

```rust
fn main() {
    let result_ok = ok().unwrap();
    println!("{}", result_ok);

    let result_err = err();

    match result_err {
        Ok(val) => {
            println!("{}", val);
        }
        Err(err) => {
            println!("{}", err);
        }
    }
}

fn ok() -> Result<String, String> {
    return Ok("オッケーなの！".to_string());
}

fn err() -> Result<String, String> {
    return Err("むーりぃー".to_string());
}
```
[Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=fb1c73f6f020c2d54e5eee095882d733)

:::message
Rustには[Anyhow](https://github.com/dtolnay/anyhow)というエラー管理のためのクレートがある。著名なライブラリにも採用されているため、これらを使うのも良いかもしれない。
(ただ小規模なCLIツールならは標準の`Result`とパターンマッチだけでも十分強力に例外処理をサポートしてくれる。)
:::

## Rustは式指向

この記事を[知り合い](https://zenn.dev/aspulse)に見せたところ「Gopher向けに書くのなら式志向の話もした方が良い」という助言を頂いたので、それについても解説していく。(この場を借りてお礼をさせていただく)

### 式指向？

Goなどの言語では通常`if`や`for`の様な構文は値を持たない。(文指向)
一方Rustでは**それらの構文が値を持つ**。つまり`let ~`に続けてif文などを書くことで処理結果を格納することができる。

:::message
サンプルコードで使っている`if let ~`という構文を使うと、**複数の`Some()`を用いた分岐や、それらの値を用いた処理をスッキリと書くことが出来る。**
また、if式と組み合わせる事でそれらの値を回収することも出来るため非常に強力。複数の`Option()`や`Result()`を扱う際にオススメ
:::

```rust
fn main() {
    let result_ok = ok();
    let result_ok2 = ok();
    
    let ok = if let (Ok(_ok), Ok(_ok2)) = (result_ok, result_ok2) {
        "両方ともオッケーなの！"
    } else {
        "むーりぃー"
    };
    
    println!("{}", ok);
}

fn ok() -> Result<String, String> {
    return Ok("オッケーなの！".to_string());
}

fn err() -> Result<String, String> {
    return Err("むーりぃー".to_string());
}
```
[Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=ff49c1464b37e5524e884a0185ba542d)

Rustでは`for`や`loop`などの構文も値を返すため、ループ終了時の値の回収処理をスッキリと書くことが出来る。
また、サンプルコードでは触れてないが`match`も値を返すことができる。

```rust
fn main() {
    let result = loop {
        let range = std::ops::Range { start: 1, end: 30 };

        let fizzbuzz: Vec<String> = range
            .map(|v| match v {
                v if v % 15 == 0 => "FizzBuzz".to_string(),
                v if v % 3 == 0 => "Fizz".to_string(),
                v if v % 5 == 0 => "Buzz".to_string(),
                v => v.to_string(),
            })
            .collect();

        break fizzbuzz;
    };

    println!("{}", result.join("\n"));
}
```
[Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=4d589867c685c20e707d060db3217756)


## CLIツールで使いそうな処理

CLIツールならではの処理の書き方を書いていく。長くなってしまったので見通しを良くするために各項目をアコーディオンにしている。

### ファイル操作

:::details ファイル操作
自分は設定などを保存したいときによく使っている。特定のライブラリを`use`しないと使えない関数があったりするので注意。

- ファイル読み込み

```rust
let file = File::open(&path); // ファイルを開いている

match file {
    // ファイルが正常に開けた
    Ok(mut file) => {
        // バッファの作成
        let mut buf = Vec::new();
        // 最後まで一気に読み込み
        let _ = file.read_to_end(&mut buf).unwrap();

        // バッファを`String`に変換
        let buf_string = String::from_utf8(buf).unwrap();
        // 文字列を改行で`Vec<String>`分割
        let buf_splited: Vec<String> =
            buf_string.lines().into_iter().map(String::from).collect();

        // Hashに変換して重複を排除
        let uniq: HashSet<String> = buf_splited.into_iter().collect();
        // 再びVec<String>に変換
        let uniq_string: Vec<String> = uniq.into_iter().map(String::from).collect();

        return uniq_string;
    }
    // ファイルを開くのに失敗した
    Err(_) => {
        // ファイルの新規作成
        create_config();
        return vec![];
    }
}
```
[該当箇所](https://github.com/Comamoca/neoenv/blob/main/src/utils.rs#L67-L88)

- ファイル書き込み

書き込みには以下の標準ライブラリを読み込む必要がある。これを読み込んでいないと**そもそも補完に出てこない**。

```rust
use std::io::Write;
```
[該当箇所](https://github.com/Comamoca/neoenv/blob/e36151f3023c21f1c0a0c35777b93b3353fe9337/src/utils.rs#L8)

書き込みには`write!`マクロや`write_all`メソッドなどがある。`write!`メソッドは`println!`メソッドみたいに書き出すことができる。
```rust
let mut file = File::create(env_path().unwrap()).unwrap();
file.write_all(envs.join("\n").as_bytes()).unwrap();
```
[該当箇所](https://github.com/Comamoca/neoenv/blob/main/src/utils.rs#L124-L125)

:::

### プログラムの終了

:::details プログラムの終了
CLIツールなんかで異常が発生したため終了する時の書き方。

```rust
use std::process::exit;

pub fn main() {
  exit(1); // フラグ1で終了
  // exit(0); // フラグ1で終了
}
```

ちなみにrust-analyzerは関数内の`exit()`で引数が戻ってこないことを認識できる。とてもお利口さん。

:::

### 引数のパース

::::details 引数のパース

[clap](https://github.com/clap-rs/clap)というクレートがデファクトスタンダードになっている。
main関数内に定義していくスタイルと、構造体を使うスタイルがあるけど、プログラムの見通しが良くなるため、構造体スタイルで書くのがオススメ。

:::message alert
構造体スタイルでプログラムする際は`--features derive`を付けて`cargo add`する必要がある。
これで数時間溶かした人が居るので要注意
:::

neoenvでの実際の使用例
```rust
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct App {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Add { app_name: String },
    Remove {},
    Switch {},
}
```
[該当行](https://github.com/Comamoca/neoenv/blob/main/src/main.rs#L7-L19)

::::

### ファジーファインダー

:::details ファジーファインダー

Goには[go-fuzzyfinder](https://github.com/ktr0731/go-fuzzyfinder)というGoでサクッとファジーファインダーが実装できるクレート[^2]がある。
RustにはRust版fzfこと[skim](https://github.com/lotabout/skim)というCLIツールがあって、そのツールがクレートも提供しているためRustで似たような事を再現できる。またこの使用方法は[リポジトリのREADMEにも書かれている](https://github.com/lotabout/skim#use-as-a-library)

日本語の情報は以下の記事に詳しく書いてある。

https://zenn.dev/urawa72/articles/556d0bc2f9c1ec44adfe

`Vec<String>`や任意の構造体を選択するアイテムとして使えるため、go-fuzzyfinderでできる事は大体できる。もちろん見た目の変更も複数選択も可能。
またプレビューウィンドウを作成することも可能。[公式のサンプルコード](https://github.com/lotabout/skim/blob/291fc34c58b1670a5e8c95f1e8f930b82c030b19/examples/custom_item.rs#L26)

:::

### プロンプト

:::details プロンプト

Goの[promptui](https://github.com/manifoldco/promptui)みたいな対話的にユーザーから情報を入力してもらう際に使われるクレートとして[inquire](https://github.com/mikaelmello/inquire)がよく使われている。

neoenvで使われている箇所は[ここ](https://github.com/Comamoca/neoenv/blob/main/src/utils.rs#L13-L37)

```rust
let ans = Confirm::new("Notthing neoenv config file. Create config now?")
        .with_default(false)
        .prompt();

    match ans {
        Ok(true) => {
            let xdg_dirs = xdg::BaseDirectories::with_prefix("neoenv").unwrap();
            let path = xdg_dirs.get_config_file("neoenv");

            let _ = File::create(path);
            println!(
                "🚀 Create neoenv config at {}\nPlease restart neoenv.",
                env_path().unwrap().to_string_lossy()
            );
            std::process::exit(0);
        }
        Ok(false) => {
            eprintln!("Notthing config file. aborted.");
            std::process::exit(1)
        }
        Err(_) => {
            eprintln!("Cant get your input at create_config().");
            std::process::exit(1)
        }
    }
```
設定ファイルが見つからない際にユーザーにファイルを新規作成するかどうか聞いて、Yesと入力されたら作成、Noと入力されたら作らずそのまま終了、取得する際にエラーが発生した場合は何もせず終了している。

:::

### HTTPクライアント

:::details HTTPクライアント

[reqwest](https://github.com/seanmonstar/reqwest)が一番よく使われている。[hyper](https://github.com/hyperium/hyper)というクレート[^3]をベースにしてより使いやすいインターフェースになっている。非同期とブロッキングでのリクエストに対応している。ここでは[Tokio](https://github.com/tokio-rs/tokio)ベースの非同期リクエストを行ってみる。

```toml:Cargo.toml
[package]
name = "rust-reqwest"
version = "0.1.0"
edition = "2021"

[dependencies]
reqwest = "0.11.20"
tokio = { version = "1", features = ["full"] }
```

```rust:main.rs
use reqwest::get;

#[tokio::main]
async fn main() {
    let resp = get("https://www.rust-lang.org/ja")
        .await
        .unwrap()
        .text()
        .await
        .unwrap();

    println!("{}", resp);
}
```
HTTPクライアントライブラリを使ったことのある人なら行っている処理が何となく分かるような感じになっている。

:::

### JSONパース

:::details JSONパース

[serde](https://github.com/serde-rs/json)と呼ばれるクレートがよく使われている。
構造体に`derive`マクロを使うのでCargo.tomlでそのように指定する必要がある。

```toml:Cargo.toml
[package]
name = "rust-serde"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = {version = "1.0.188", features = ["derive"]}
serde_json = "1.0.107"
```

```rust:main.rs
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug)]
struct Point {
    x: i32,
    y: i32,
}
fn main() {
    let point = Point { x: 1, y: 3 };

    // 構造体を文字列にシリアライズ
    let to_s = serde_json::to_string(&point).unwrap();
    println!("Serialized: {}", to_s);

    // 文字列を構造体にデシリアライズ
    let p: Point = serde_json::from_str(&to_s).unwrap();

    println!("Deserialized:\nPoint.x: {}\nPoint.y: {}", p.x, p.y);
}

```
コードを見て多くの人が感じたと思いますが、**一々構造体を指定していくのは正直やってられない**です。
なので`serde_json`には`Value`という値と`get`というメソッドがあります。先程のサンプルコードの構造体を使って`Point.x`の値を引っ張ってみます。

```rust
    // Value.get()を使って構造体無しで値を引っ張ってくる
    let p: Value = serde_json::from_str(&to_s).unwrap();
    println!("Point.x: {}", p.get("x").unwrap()); //戻り値はOption()
```

以下は気象庁の天気予報JOSNをパースして石狩の天気情報を出力するコード。

```rust:main.rs
async fn fetch_json() -> String {
    let resp = get("https://www.jma.go.jp/bosai/forecast/data/forecast/016000.json")
        .await
        .unwrap()
        .text()
        .await
        .unwrap();

    return resp;
}

async fn fetch_wether() {
    let resp = fetch_json().await;

    let wether: Value = serde_json::from_str(&resp).unwrap();
    let today = wether.get(0).unwrap();
    let date: Vec<String> = ["今日　", "明日　", "明後日"].iter().map(|&s| s.to_string()).collect();

    let office = today.get("publishingOffice").unwrap().to_string();
    let series = today.get("timeSeries").unwrap();

    let ishikari = series.get(0)
        .and_then(|v| v.get("areas")).and_then(|v| v.get(0)).unwrap();

    let name = ishikari.get("area").and_then(|v| v.get("name")).unwrap();
    let weathers = ishikari.get("weathers").unwrap();

    println!("気象台名: {}", office.replace(r#"""#, ""));
    println!("地域: {}", name.to_string().replace(r#"""#, ""));

    for (weather, date) in weathers.as_array()
        .unwrap()
        .iter()
        .zip(date.iter()) {
            println!("{}| {}", date, weather.to_string().replace(r#"""#, ""))
        }
}

```

構造体を定義せず値を取得できてはいるけど階層が深くなっていくと更にしんどさが増していく。[^4]

構造体の定義をしなくても値を引っ張ってこれるので楽にはなったけど、複雑な構造のデータが来るとその分`.get()`をしなければいけないのでまだしんどい。せめて[gojson](https://github.com/ChimeraCoder/gojson)みたいなやつがあれば良いなぁと思っているGopherの方もいると思う。

これではあんまりなので[valq](https://github.com/jiftechnify/valq)というgojsonっぽいマクロを使う。
下のサンプルコードは上のサンプルコードを`query_value!`マクロを使って書き直したもの。jqと同じ感覚で値にアクセス出来るので使い勝手がとても良い。

https://zenn.dev/jiftechnify/articles/rust-macro-for-query-json

(`fetch_json`は省略している)
```rust:main.rs
async fn fetch_wether_valq() {
    let resp = fetch_json().await;

    let date: Vec<String> = ["今日　", "明日　", "明後日"]
        .iter()
        .map(|&s| s.to_string())
        .collect();

    let wether: Value = serde_json::from_str(&resp).unwrap();
    let office = query_value!(wether[0].publishingOffice).unwrap();
    let today = query_value!(wether[0]).unwrap();

    let series = query_value!(today.timeSeries).unwrap();
    let ishikari = query_value!(series[0].areas[0]).unwrap();
    let name = query_value!(ishikari.area.name).unwrap();
    let weathers = query_value!(ishikari.weathers).unwrap();

    println!("気象台名: {}", office.to_string().replace(r#"""#, ""));
    println!("地域: {}", name.to_string().replace(r#"""#, ""));

    for (weather, date) in weathers.as_array()
        .unwrap()
        .iter()
        .zip(date.iter()) {
            println!("{}| {}", date, weather.to_string().replace(r#"""#, ""))
        }
}

```
:::

### 外部コマンド実行

:::details 外部コマンド実行

https://qiita.com/Kumassy/items/3fb3e52729e375efd5ed

同期的にコマンドを実行するのなら標準ライブラリの`std::process::Command`が使える。
普通に`.spawn()`すると標準入出力は実行元――すなわち`cargo run`を実行しているターミナルに出力される。
プログラム内部で出力を使いたい場合は`.output()`を使って出力を文字列として取得する。

```rust:main.rs
use std::process::Command;

fn main() {
    let output = Command::new("ls")
        .args(&["-l", "-a"])
        .output()
        .expect("failed to start `ls`");

    println!("{}", String::from_utf8_lossy(&output.stdout));
}
```

時間のかかるコマンドを実行する時には非同期で実行したい時もある。そういう時は`tokio::process::Command`を使って非同期実行する。

```rust
use tokio::process::Command;

pub async fn async_ls() {
    let output = Command::new("ls")
        .args(&["-l", "-a"])
        .output()
        .await
        .expect("failed to start `ls`");

    println!("{}", String::from_utf8_lossy(&output.stdout));
}
```
:::

### ファイル監視

:::details ファイル監視

[notify](https://github.com/notify-rs/notify)というライブラリを使ってファイルの変更を監視出来る。
以下サンプル

```rust
use notify::{Config, PollWatcher, RecommendedWatcher, RecursiveMode, Watcher, WatcherKind};
use std::path::Path;
use std::sync::mpsc::channel;
use std::time::Duration;

fn main() {
    let (tx, rx) = channel();

    let mut watcher: Box<dyn Watcher> = if RecommendedWatcher::kind() == WatcherKind::PollWatcher {
        let config = Config::default().with_poll_interval(Duration::from_secs(1));
        Box::new(PollWatcher::new(tx, config).unwrap())
    } else {
        Box::new(RecommendedWatcher::new(tx, Config::default()).unwrap())
    };

    watcher
         // カレントディレクトリを再帰的に監視対象とする
        .watch(Path::new("."), RecursiveMode::Recursive)
        .unwrap();

    for e in rx {
        let event = e.unwrap();
        let path = event.paths[0].to_string_lossy();
        let kind = event.kind;
        let kind_name: &str;

        match kind {
            notify::EventKind::Any => kind_name = "Any",
            notify::EventKind::Access(_) => {
                kind_name = "Access";
            }
            notify::EventKind::Create(_) => {
                kind_name = "Create";
            }
            notify::EventKind::Modify(_) => {
                kind_name = "Modify";
            }
            notify::EventKind::Remove(_) => {
                kind_name = "Remove";
            }
            notify::EventKind::Other => {
                kind_name = "Other";
            }
        }

        // Event名と対象のPathを表示する
        println!("Kind: {}\nPath: {}", kind_name, path);
    }
}

```
恐らくこの手の処理を実装している時はライブプレビューとかを実装する時なので、当然並列に処理を走らせたくなる。
上に上げたサンプルは処理をブロッキングするため、Tokioを使ってもう少し手を入れてあげる必要ある。[参考issue](https://github.com/notify-rs/notify/issues/380)

:::

### Webサーバー

:::details Webサーバー

RustのWebサーバーは[actix-web](https://github.com/actix/actix-web)や[Hyper](https://github.com/hyperium/hyper)など、色んな実装がある。
この項ではTokioが作っている[axum](https://github.com/tokio-rs/axum)と[utopia](https://github.com/juhaku/utoipa)を使って、Swaggerドキュメントを自動的に生成してサーバーから見れるようにする。[^5]

このutoipa自身は別にSwagger専用と言う訳ではなく、[ReDoc](https://github.com/Redocly/redoc)や[RapiDoc](https://rapidocweb.com)などのOpenAPI準拠のAPIをドキュメントにすることができる。
更に、Utopia自身は単体でも動作することが出来るので、単体でAPIドキュメントを生成する事もできる。

axumの基本的な使い方は以下の通り。引用元のサンプルコードではaxum & utoipaとsledによるKVでデータを保存している。(データストア部分は[KV](#KV)の部分の流用)

```rust
#[tokio::main]
async fn main() {
    let app = Router::new()
        // SwaggerUIの設定。後述するけどもう一つ設定する項目がある。
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        // ハンドラー。関数を別で書いて指定しても良いし、lambda関数を直接書き込んでも良い。
        .route("/", get(show))
        .route("/", post(register));

    // localhost:3000で起動する
    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap()
}
```
[該当箇所](https://github.com/Comamoca/sandbox/blob/770e9638182afcc086187610cceeb01d30e46399/rust-axum-utoipa/src/main.rs#L26-L36)


ハンドラー自体はこのように書く事が出来る。`Query<T>`という型に定義した型を与えることでURLクエリパラメータを指定できる。
```rust
async fn show(params: Query<Person>) -> String {
```
[該当箇所](https://github.com/Comamoca/sandbox/blob/770e9638182afcc086187610cceeb01d30e46399/rust-axum-utoipa/src/main.rs#L54)

`Person`という構造体は以下の様になっている。
```rust
#[derive(Deserialize, Debug, IntoParams)]
pub struct Person {
    #[serde(default, deserialize_with = "empty_string_as_none")]
    name: Option<String>,
    age: Option<u8>,
    key: Option<String>,
}
```
[該当箇所](https://github.com/Comamoca/sandbox/blob/770e9638182afcc086187610cceeb01d30e46399/rust-axum-utoipa/src/main.rs#L8-L14)

値が欠け無い場合は上のように書けば良いのだけど、これだけではもし値が無い場合にエラーが発生してしまうため、値が欠ける可能性がある場合は欠損値を`None`に変更する関数を書く必要がある。また、`Query<T>`に指定する型も`Option<T>`に変更しなければならない。

```rust
// 欠損値を`None`に変換する関数
fn empty_string_as_none<'de, D, T>(de: D) -> Result<Option<T>, D::Error>
where
    D: Deserializer<'de>,
    T: FromStr,
    T::Err: fmt::Display,
{
    // 欠落した値を`None`に置換する
    let opt = Option::<String>::deserialize(de)?;
    match opt.as_deref() {
        None | Some("") => Ok(None),
        Some(s) => FromStr::from_str(s).map_err(de::Error::custom).map(Some),
    }
}
```
[該当箇所](https://github.com/Comamoca/sandbox/blob/770e9638182afcc086187610cceeb01d30e46399/rust-axum-utoipa/src/main.rs#L38-L50)

:::

### MarkDownをHTMLへ変換

::::details MarkDownをHTMLへ変換

[pulldown-cmark](https://github.com/raphlinus/pulldown-cmark)がダントツで人気があるけど、ASTを弄れたり拡張機能があったりと機能面で期待できる[markdown-rs](https://github.com/wooorm/markdown-rs)を使ってみる。


:::message alert
名前が再利用されているため、現行の最新は`1.0.0-alpha.14`を使用すること。
cargo add: `cargo add markdown@1.0.0-alpha.14`
:::

基本的な使い方は簡単で、  

- `markdown::to_html`でCommonMarkで変換
- `markdown::to_html_with_options`でExtentionを使って変換

以上の2通りの変換が出来る。GFMを使って変換を行うには、`markdown::to_html_with_options`の第二引数に`markdown::Options`のメソッドを与える必要がある。
また、`Options`のメソッドは`MDX`を除いてエラーが発生しないため`.unwrap()`してしまって良いそう。[参照](https://docs.rs/markdown/1.0.0-alpha.14/markdown/fn.to_html_with_options.html#errors)

```rust
async fn html() -> Html<String>{
    return Html(to_html(MD));
}

async fn gfm() -> Html<String> {
    return Html(to_html_with_options(MD, &Options::gfm()).unwrap());
}

```
[該当箇所](https://github.com/Comamoca/sandbox/blob/19bfb30ef2df5f2743c7ccd97c242a827001fc18/rust-markdown-rs/src/main.rs#L42-L48)

引用元はプレビュー向けにaxumでWebサーバ化している。プレビューサーバーを作りたい時の参考にぜひ。

::::

### XDG Base Directory

:::details XDG Base Directory

最近のCLIツールはXDG Base Direcoryという規約に従って設定ファイルとかを配置しているものが多い。
RustでXDG Base Directoryを扱えるライブラリとして[rust-xdg](https://github.com/whitequark/rust-xdg)というクレートがあるのでそれを使ってみる。
このクレートはneoenvでも使っている。
以下該当箇所。

```rust
pub fn env_path() -> std::result::Result<std::path::PathBuf, std::io::Error> {
    let xdg_dirs = xdg::BaseDirectories::with_prefix("neoenv").unwrap();
    let path = xdg_dirs.place_config_file("neoenv");

    return path;
}
```
`xdg::BaseDirectories::with_prefix(prefix)`で`~/.config/prefix`の様なプレフィックス付きのパスを生成するインスタンスを生成する。
`xdg_dirs.place_config_file(file_name)`で`XDG_CONFIG_HOME`(Linuxユーザーならデフォルトで`~/.config/prefix/`)とファイル名が連結されたパスが生成される。

```rust
let xdg_dirs = xdg::BaseDirectories::with_prefix("neoenv").unwrap();
let path = xdg_dirs.get_config_file("neoenv");
```
[該当箇所](https://github.com/Comamoca/neoenv/blob/e36151f3023c21f1c0a0c35777b93b3353fe9337/src/utils.rs#L19-L20)

パスを取得できるメソッドは`place_*`系と`get_*`系がある。前者はディレクトリを作成して後者はディレクトリを作成しない。
細かい違いだけどディレクトリ作成の手間を省けたりするので知っておいて損はないと思う。

:::

### KV

:::details KV

先述したXDG Base Directoryとファイル読み込み/書き込み、serdeを用いたパースを使えば簡単なデータストアは書けてしまうけど、もっとお手軽に構造化データを保存したいケースとかがある。そういう時は[sled](https://github.com/spacejam/sled)という組み込みデータベースを使うと良い感じに保存できる。

https://zenn.dev/yosemat/articles/3c281c7d6e073d

以下サンプル(長くなってしまったので抜粋している)
```rust
fn main {
    let key = "".as_bytes();
    let value = "".as_bytes();

    // DBの作成。事前にファイルやディレクトリを用意しとかなくても勝手に生成される。
    // 引数には絶対パス又は相対パスを指定する。
    // このサンプルの場合ローカルに`db`という名前のディレクトリが作成される
    let db = sled::open("db").unwrap();

    // 値の設定
    set(&db, &key, &val);

    // 値の取得
    let result = get(&db, &key);
    println!("Key: {}\nValue: {}", key, result.to_string());

    // 値の削除
    // remove(&db, &key);

    println!("--------- show_all ---------");

    show_all(&db);

}

fn set(db: &sled::Db, key: &str, value: &str) {
    // DBにデータを登録する
    db.insert(key.as_bytes(), value.as_bytes()).unwrap();
}

fn get(db: &sled::Db, key: &str) -> String {
    // DBからデータを取得する
    let result = db.get(key).unwrap();
    let ivec = result.unwrap();

    return String::from_utf8(ivec.to_vec()).unwrap();
}

fn remove(db: &sled::Db, key: &str) {
    // DBからデータを削除する
    db.remove(key).unwrap();
}

fn show_all(db: &sled::Db) {
    // DBのデータを一覧表示する
    db.iter().for_each(|v| {
        let (key, value) = v.unwrap();

        let key_str = String::from_utf8(key.to_vec()).unwrap();
        let value_str = String::from_utf8(value.to_vec()).unwrap();

        println!("Key: {}\nValue: {}", key_str, value_str);
    });
}
```
:::

## 余談

ちなみに、[CLIツールで使いそうな処理](#CLIツールで使いそうな処理)以降のneoenvで使っていない処理は全て挙動を確認済み。(この記事を書いている時間の大半はサンプルコードを書いていた)

その時書いたコードは[sandbox](https://github.com/comamoca/sandbox/)リポジトリにpushしているので、手元で動かしてみたい人向けに対応表を置いておく。
sandboxリポジトリはかなりコード量が多いので、ディレクトリ毎に[tiged](https://github.com/tiged/tiged)を使うなり、`sparse-checkout`なりを使って部分的にcloneするのがオススメ。

|サンプルコード|対応する項目|
|--------------|------------|
|[rust-reqwest](https://github.com/Comamoca/sandbox/tree/main/rust-reqwest)|[HTTPクライアント](#httpクライアント)|
|[rust-serde](https://github.com/Comamoca/sandbox/tree/main/rust-serde)|[JSONパース](#jsonパース)|
|[rust-notify](https://github.com/Comamoca/sandbox/tree/main/rust-notify)|[ファイル監視](#ファイル監視)|
|[rust-axum-utoipa](https://github.com/Comamoca/sandbox/tree/main/rust-axum-utoipa)|[Webサーバー](#webサーバー)|
|[rust-markdown-rs](https://github.com/Comamoca/sandbox/tree/main/rust-markdown-rs)|[MarkDownをHTMLへ変換](#markdownをhtmlへ変換)|
|[rust-sled](https://github.com/Comamoca/sandbox/tree/main/rust-sled)|[KV](#kv)|

[^1]: Rustの所有権はメモリ管理と予期しない値の変更を防ぐためにある。...と自分の中では理解している。(安全性と堅牢性の担保)
[^2]: 一般的にライブラリと呼ばれるものはRustではクレートと呼ばれている。
[^3]: hyper自体はClientもServerも対応している。
[^4]: `?`演算子を使えばもうちょいスッキリと書いていくことができるらしい。自分は`?`演算子を使うたびなぜかエラーが出るのでまるで使っていない。
[^5]: FastAPIみたいに自動でドキュメントが生成できると期待していたのだけど結構自力で書く部分が多くてがっかりしてしまった...今後はマクロを使ってもっと簡略化できないか調べたい。
