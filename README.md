# treeview

一个原生js写的树形控件。

使用
---
```javascript
var structure = {
    title: "root",
    id1: "title1",
    id2: "title2",
    id3: {
        title: "title3",
        id4: "title4"
    }
}
var tr = TreeForm(structure);
document.body.appendChild(tr.render());//finish;
```

以上的代码会生成以下的树结构。
```
- root  
|-title1  
|-title2  
|--title3  
||-title4
```

打算增加的新功能
---
1. 现在代码上面已经写了一个mediator模式在里面，可以考虑加入当title被修改时，自动替换修改后的内容。
2. 加入一些事件绑定函数。
