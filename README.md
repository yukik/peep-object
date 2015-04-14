peep-object
===========

オブジェクトの全構成要素を確認します

ブラウザに標準で追加されているデベロッパーツールは簡単に使用する事ができます。
しかしconsole.log等を入力し展開する手間がかかります。
また、簡単に循環参照を確認する事ができません。
peepを使用する事で、オブジェクトを簡単に確認する事が出来ます。

# 使用方法

`peep.js`と`peep.css`をロードして`peep({{target}})`を実行してください。

```
var obj = {
  a : 1,
  b : 'foo',
  c : {
    x: 2,
    y: /abc/g,
    z: new Date()
  },
  d : [1,2,3]
};

peep(obj);
```

オブジェクトの状態を確認する事が出来ます





