---
title: "関数型まつりでGleamについて話しました"
emoji: "🦊"
type: "idea"
topics: ["gleam"]
published: true
---

https://fortee.jp/2025fp-matsuri/proposal/e9df1f36-cf2f-4a85-aa36-4e07ae742a69

関数型まつり2日目 16:30〜のセッションでGleamについて話しました。

この記事では当日のスライドを交えながら、話した内容や実際に発表した感想を書いていこうと思います。

https://speakerdeck.com/comamoca/gleamtoiuxuan-ze-zhi-jia

## 自己紹介

![](https://storage.googleapis.com/zenn-user-upload/92939a476c51-20250621.png)

実は今年から就活で山梨から上京しました。
山手線沿線あたりだったらわりと行けるので、生でGleamの話を聞きたい方がいたら一緒にご飯を食べにいきましょう！

## Gleamの概要

![](https://storage.googleapis.com/zenn-user-upload/55a7caede58f-20250621.png)

GleamはErlang VMとJavaScript Runtimeで動く静的型付けな関数型言語です。

Louis Pilfold氏が開発している、シンプルな構文とErlang VMにもとづく並列性が特徴です。

多くのAltJS(JavaScriptへトランスパイルされる言語)はNode.jsのみ対応していることがほとんどですが、Gleamは他のAltJSと異なりNode.js, Deno, Bunの3つのランタイムに公式で対応しています。
さらにGleamが出力するJavaScriptコードはES6で出力されます。

AltJSとして見てもこの要素を備えている言語はなかなかないと思っています。

## Gleamの哲学

![](https://storage.googleapis.com/zenn-user-upload/3a84e80878ad-20250621.png)
![](https://storage.googleapis.com/zenn-user-upload/46ff34cb994f-20250621.png)
![](https://storage.googleapis.com/zenn-user-upload/b0470d97c8de-20250621.png)
![](https://storage.googleapis.com/zenn-user-upload/6ef115b1210e-20250621.png)

Gleamの考え方を知ってもらうのが大事だと思っていたので結構多めに盛り込みました。

同じシンプルを目指しつつも、Goとは切り口が違うというのが伝わっていれば良いなと思っています。

スライドに載せている画像はこちらのサイトになります。

https://crowdhailer.me/2024-10-04/6-years-with-gleam/

ちなみにこちらの記事を書かれた[Peter Saxton](https://github.com/CrowdHailer)さんは[Gleam Weekly](https://gleamweekly.com/)という毎週Gleamのニュースが読めるニュースレターを運用しています。

僕も購読したりvim-jpのチャンネルに流したりしているのですが、知らないライブラリの情報が流れてきたりするので結構面白いです。


## Gleamの特徴

![](https://storage.googleapis.com/zenn-user-upload/d59456e075b0-20250621.png)

Gleam本体の特徴についてです。

- シンプルな構文
公式いわく「半日で覚えられる」そうです。

- 関数型
関数型言語なのでmapやfilterなども標準装備されています。
また、パイプ演算子や[関数キャプチャ](https://tour.gleam.run/functions/function-captures/)など、関数を合成する手段が整っています。

- エラーメッセージが親切
Rust由来の読みやすい形式でエラーメッセージで表示されます。
Gleamは型定義が他の言語と少し異なり混乱する人が一定数いる[^1]のですが、そのようなケースに対してエラーメッセージでアドバイスが表示されたりします。

- Erlang VM / JavaScript Runtime
GleamはErlang VMとJavaScript Runtimeで実行できます。
Erlang VMで動くのでスケールするアプリケーションが比較的書きやすい言語です。

このあたりが哲学の話と混じってしまっていて、もっと整理するべきだったかなと思っています。

## Erlang VMについて

![](https://storage.googleapis.com/zenn-user-upload/9e9e91fb343e-20250621.png)

セッションでも触れましたが、こちらの記事に全部書いてあるので僕の方から言えることはあんまりないです...
個人的には雑に並列処理が書けたり、処理系でプロセスを良い感じに管理してくれるのが他の言語にはない魅力だと思ってます。

https://gist.github.com/voluntas/81ab2fe15372c9c67f3e0b12b3f534fa

## エラーメッセージの例

![](https://storage.googleapis.com/zenn-user-upload/7cee5f680702-20250621.png)

スライドにも書いてありますが、こちらにもあらためて書いておきます。
```
error: Unknown variable
  ┌─ /src/main.gleam:3:8
  │
3 │   echo prson
  │        ^^^^^ Did you mean person?

The name prson is not in scope here.

warning: Unused variable
  ┌─ /src/main.gleam:2:7
  │
2 │   let person = "Jhon"
  │       ^^^^^^ This variable is never used

Hint: You can ignore it with an underscore: _person.
```

Gleamはユーザーフレンドリーに重きを置いている言語です。
エラーメッセージからLSPに至るまで細かく開発者をサポートしてくれる機能が付いています。

## LSP

![](https://storage.googleapis.com/zenn-user-upload/21f9cc31b0ca-20250621.png)

先述したように、Gleamはユーザーフレンドリーに重きをおいています。
特にLSPのコードアクションがとても充実しており、構文がシンプルゆえに書くのが面倒になりがちな部分を補っています。

このあたりのバランス感覚の良さがGleamの良さにつながっていると個人的には思っています。

## 構文

![](https://storage.googleapis.com/zenn-user-upload/66759db46610-20250621.png)

![](https://storage.googleapis.com/zenn-user-upload/2708dc6cf611-20250621.png)
![](https://storage.googleapis.com/zenn-user-upload/5429fb3a1f48-20250621.png)
![](https://storage.googleapis.com/zenn-user-upload/3748434d7f04-20250621.png)


## 環境構築

公式ドキュメントが分かりやすいのでお勧めです。

https://gleam.run/getting-started/installing/


注意点としては、Gleam本体だけだとコードの変換しかできないのでErlang VMやNode.jsといった処理系もインストールする必要があります。

## エコシステム

### Webサーバ

![](https://storage.googleapis.com/zenn-user-upload/7e97e8fa2d7c-20250621.png)

Gleamは公式が[HTTPライブラリ](https://github.com/gleam-lang/http)を提供していて、サードパーティのライブラリは基本的にこれを使って書かれています。
Gleamのライブラリどうしが型を共有しているため、ライブラリが組み合わせやすいというメリットがあります。

他にGleamでWebサーバを書く時に使われるライブラリを紹介していきます。

- mist
Gleamで書かれたHTTPサーバです。
HTTP/2やWebSocketにも対応していて、事実上のデファクトスタンダードになっています。

- wisp
mistをベースに書かれたライブラリです。
Webサーバを書く際に毎回定義するような処理を提供しています。

GleamでWebサーバを書く際はルーティングをパターンマッチで行います。


### フロントエンド

#### Lustre

![](https://storage.googleapis.com/zenn-user-upload/a21e01629e62-20250621.png)

スライドでも触れたGleamのWebフレームワークです。
TEAベースの純粋関数型のアプローチでフロントエンドを構築できます。

UIの部品が純粋であるがゆえに、クライアントサイドからサーバサイド、果てはハイドレーションまで可能というレンダリングの柔軟さが特徴です。

個人的には、Gleam自身が非純粋な関数型言語であるのにもかかわらずコミュニティでは純粋関数型のアプローチが支持されている点がおもしろいなと思っています。

### Gleamで実装されたアプリケーション

![](https://storage.googleapis.com/zenn-user-upload/43586b7d2f44-20250628.png)

後述しますが、Gleamはデータベースにアクセスするライブラリも整っているため、フルスタックなアプリケーションを開発するポテンシャルをすでに備えています。
ここではそれらのアプリケーションをいくつか紹介していきます。

#### Gleam Packages
![](https://storage.googleapis.com/zenn-user-upload/2bc91505edb2-20250628.png)

https://packages.gleam.run/

Gleamのパッケージを検索できるサイトです。
内部では[Hex](https://hex.pm/)というErlang/ElixirのパッケージレジストリのAPIにアクセスしています。

#### Gloogle

![](https://storage.googleapis.com/zenn-user-upload/816ad007c0b0-20250628.png)

https://gloogle.run/

Haskellの[Hoogle](https://hoogle.haskell.org/)のようにキーワードでライブラリの関数名などを検索できます。
以前はかなりレスポンスが遅かったのですが、最近になって速度が向上したため普段使いもしやすくなりました。

#### kirakira

![](https://storage.googleapis.com/zenn-user-upload/35d84726faf6-20250628.png)

https://kirakira.keii.dev/

Gleamで実装された掲示板です。
登録には運用をしている方にDMをする必要があるらしく、僕は登録できていませんがフルスタックなアプリケーションの実装例としても価値があると思っています。


---

ここからはスライドに書けなかったSQLについて書いていきます。

### 補題: SQL

Gleamでもデータベース系のライブラリはいくつか出ており、データベースの操作は可能です。

#### cake

https://github.com/inoas/gleam-cake

Gleamで作成されたクエリビルダです。

以下のデータベースに対応しています。

- PostgreSQL
- SQLite
- MariaDB & MySQL

クエリを生成するだけですので、データベースにアクセスするには別途ライブラリが必要です。

対応しているアダプタとして

- [pog](https://github.com/lpil/pog)
- [sqlight](https://github.com/lpil/sqlight)

などがあります。

#### squirrel

https://github.com/giacomocavalieri/squirrel

SQLからGleamのコードを生成するパッケージです。
Goの[sqlc](https://sqlc.dev/)をイメージしてもらえると分かりやすいです。

PostgreSQLしか対応していない点は注意です。

#### これからの展望

![](https://storage.googleapis.com/zenn-user-upload/4362f86d42ed-20250621.png)

Gleamはv1に到達して以降も活発に開発されています。

そのため今後はさらなる開発支援機能の追加や新なコンパイルターゲットの追加などを期待しています。

またコミュニティではコード生成技術の発達によるデコードの簡易化や、フルスタックフレームワークの登場による開発速度の向上などを期待しています。

事前にTwitterで何か聞きたいことがないか募集したところ、現状不満に思っている点について聞きたいとのツイートを見かけたのでここでいくつか挙げました。

内容としては、

- 個人的な要望としては、現状コードを生成するライブラリとコードを解析するライブラリのAPIが異なる点
- Webフレームワークのミドルウェア、特に認証系のミドルウェアが不足している
- 構文的な不満としてはレコードの書き方が冗長な点

これらの問題が解消されたら良いなと思っています。

### 寄付について

![](https://storage.googleapis.com/zenn-user-upload/40d4e18d09df-20250621.png)

![](https://storage.googleapis.com/zenn-user-upload/3a66ab1cf33c-20250621.png)

Gleamの開発者であるLouisさんは、現在フルタイムでGleamを開発しています。
しかし現状、寄付が十分ではありません。

もしGleamを気に入っていただけたのなら寄付をしてくださるとうれしいです。

## 余談

登壇後にTwitterを見ていた際、「どうしてそこまでモチベーションを保って追い続けられるのか」というツイートをちらほら見かけました。
 
いろいろ考えてたのですが、正直僕もよく分かっていません...

ただ、僕の中でGleamはアイマスとかラブライブと同じカテゴリにあって、記事を書くのはいわゆる「推し活」に近い感覚でやっています。
個人的には推し活は無理のないペースでやるものだと思っているので、頑張りすぎて息切れしないようジョギングするイメージで続けているのもその秘訣なのかもしれません。

いつかGleamの聖地巡礼がてらロンドンに行きたいですね...

[^1]: 僕もその混乱した人のひとりです。
