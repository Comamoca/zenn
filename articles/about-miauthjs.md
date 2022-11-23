---
title: "簡単にMisskeyの認証が出来るライブラリを作った"
emoji: "🦊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [misskey, deno]
published: false
---

こちらになります。

https://github.com/Comamoca/miauth.js

Denoとnpmのページです。(DenoとNode両対応しています)

https://deno.land/x/miauthjs

https://www.npmjs.com/package/miauth-js

## 開発の動機

最近Misskeyを使い始めて、なかなか居心地が良くて気に入ったので何か貢献出来ないかと思い作りました。

始めはVimのクライアントを作ろうと思ったのですが、公式のSDKに認証機能が実装されていないらしい(READMEに記述はあるけど内容が書かれていない)のと、仕様が分かりづらくAPIを使ったプログラムの開発の支障になっているのでは、と感じ自分で実装する事にしました。

ちなみにVimのクライアントに関してはAllianaab2m さんが既に開発しています。MiAuth.jsを採用して下さるらしいので楽しみです。

https://github.com/Allianaab2m/vimskey

## Misskeyとは

[公式サイト](https://misskey-hub.net/)からの引用です。

>  Misskeyはフリーかつオープンなプロジェクトで、誰でも自由にMisskeyを使ったサーバー(インスタンスと呼ばれます)を作成できるため、既に様々なインスタンスがインターネット上に公開されています。
>
>  また重要な特徴として、MisskeyはActivityPubと呼ばれる分散通信プロトコルを実装しているので、どのインスタンスを選んでも他のインスタンスのユーザーとやりとりすることができます。
>
>  これが分散型と言われる所以で、単一の運営者によって単一のURLで公開されるような、Twitterなどの他サービスとは根本的に異なっています。
>
>  インスタンスによって主な話題のテーマやユーザー層、言語などは異なり、自分にあったインスタンスを探すのも楽しみのひとつです(もちろん自分のインスタンスを作るのも一興です)。

:::message
ちなみに最近ユーザーが1万人を超えました🎉
:::

## MiAuthとは

MiAuthとは、Misskeyの独自認証システムです。
以前はOAuthでしたが、独自の認証システムに変更されました。

[公式のドキュメント](https://misskey-hub.net/docs/api/#%E3%82%A2%E3%83%95%E3%82%9A%E3%83%AA%E3%82%B1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E5%88%A9%E7%94%A8%E8%80%85%E3%81%AB%E3%82%A2%E3%82%AF%E3%82%BB%E3%82%B9%E3%83%88%E3%83%BC%E3%82%AF%E3%83%B3%E3%81%AE%E7%99%BA%E8%A1%8C%E3%82%92%E3%83%AA%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%E3%81%99%E3%82%8B)

## MiAuthの仕様

[ここ](https://forum.misskey.io/d/6-miauth)が詳しいです。

ざっくり説明すると、
まず認証用のURLにユーザーがアクセスし、そこにアクセスした後確認用のURLに**POSTで**アクセスするとトークンが入ったJsonが入ってくる感じです。

## MiAuth.jsについて

リポジトリに全部書いてあるので([日本語版のドキュメント](https://github.com/Comamoca/miauth.js/blob/main/README.ja.md)も用意してあります)ここで説明することがあんまり無いのですが、サンプルコードについて簡単に説明します。

```ts
import { readLines } from "https://deno.land/std@0.101.0/io/mod.ts";
import { MiAuth, Permissions, UrlParam } from "https://deno.land/x/miauthjs@0.0.2/mod.ts";

// 認証するユーザーがいるインスタンスのアドレス
const origin = "https://misskey.io";

// 要求するするパーミッションを指定
const permission = [Permissions.AccountRead];

// URLの生成に使うUUID
const session = crypto.randomUUID();

// 認証についての情報を指定する
const param: UrlParam = {
  name: "MyApp",
  permission: permission,
};

// MiAuthオブジェクトを作成
const miauth = new MiAuth(origin, param, session);

// 表示されたURL にアクセスして認証します
console.log(miauth.authUrl());

// Enterが押されるまでまで処理を止める
console.log("☕ 認証が完了したらEnterを押してください。");
for await (const line of readLines(Deno.stdin)) {
  if (line == "") {
    break;
  }
}

// 認証が完了したら呼び出す
console.log(await miauth.getToken())
```

URLにアクセスするとこのような画面が表示されるので許可をクリックしたターミナルに戻ってEnterを押すとトークンが表示されます。
![](https://storage.googleapis.com/zenn-user-upload/ac3194463bcb-20221124.png)

`MiAuth`オブジェクトを作成し、[`authUrl()`](https://deno.land/x/miauthjs@0.0.2/mod.ts?s=MiAuth#method_authUrl_0)で作成したURLで認証を行い、[`getToken()`](https://deno.land/x/miauthjs@0.0.2/mod.ts?s=MiAuth#method_getToken_0)でトークンを取得する事だけ頭に入れておけば使えると思います。

権限を指定する[`Permissions`](https://deno.land/x/miauthjs@0.0.2/mod.ts?s=Permissions)は、**補完が効くよう頑張った**ので前に権限の名前、後ろに`Read`か`Write`が付くことを把握しておけば大丈夫だと思います。権限については[ここ](https://misskey.m544.net/api-doc/#section/Permissions)に詳しく書いてあります。

コード中にsessionという文字が出てきますが、これは認証URLの生成に必要なURLでUUID v4が推奨されています。ただ、他のバージョンを使うこともできます。UUIDを生成するのが面倒な場合は[`quickAuth()`](https://deno.land/x/miauthjs@0.0.2/mod.ts?s=quickAuth) というラッパーを用意しているのでこちらを使うのがオススメです。~~これ別にオプションにすれば良かったと記事を書きながら後悔してるので、近いうちにオプション化されるかもしれません。~~

## 実装した感想とか


