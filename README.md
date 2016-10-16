# treeview

一个原生js写的树形控件。

使用
---
`var structure = {title : "root", id1 : "title1", id2 : "title2", id3 : { title : "title3" , id4 : "title4" } }`
`var tr = TreeForm(structure);`
`document.body.appendChild(tr.render());//finish;`
以上的结构会生成以下的树结构
`- root`
`|-title1`
`|-title2`
`|--title3`
`||-title4`
