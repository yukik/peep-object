peep-object
===========

オブジェクトの全構成要素を確認する


# 使用方法

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

peepObject(obj);
```


