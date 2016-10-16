/**
 * Created by x on 2016/9/23.
 */
var TreeForm = (function () {
    var compatable = {
        IE: navigator.userAgent.match(/\bMSIE (.).*;/) ? Number(navigator.userAgent.match(/\bMSIE (.).*;/)) : null
    };
    var Mediator = (function () {
            var topics = [];

            function subscribe(topic, eventObj) {
                if (eventObj instanceof EventObj) {
                    if (hasTopic(topic)) {
                        topics[topic].push(eventObj);
                    }
                    else {
                        topics[topic] = [];
                        topics[topic].push(eventObj);
                    }
                }
                else throw Error("The type of eventObj isn't an instance of EventObj");
            }

            function publish(topic, data) {
                var topicItems = topics[topic];
                if (!topicItems) return;
                for (var i = 0, len = topicItems.length; i < len; i++) {
                    var item = topicItems[i];
                    item.callback.call(item._this, data);
                }
            }

            function EventObj(callback, _this) {
                "use strict";
                this.callback = callback || function () {
                    };
                this._this = _this;
            }

            function EventSpec(type, target, data) {
                this.type = type;
                this.target = target;
                this.data = data;
                this.isUserManipulate = false;
            }

            function hasTopic(topic) {
                return topics[topic];
            }

            return {
                subscribe: subscribe,
                publish: publish,
                EventObj: EventObj,
                EventSpec: EventSpec
            }
        })(),
        TreeNode = (function () {
            // constructor
            function TreeNode(type, title, dataID) {
                "use strict";
                if (typeof type !== "number") {
                    throw new Error("type is must.");
                }
                if (typeof dataID !== "string") {
                    throw new Error("dataID is must.")
                }
                this.type = type;
                this.title = title;
                this.dataID = dataID;
                this.nextChild = null;
                this.nextNode = null;
                this.previousNode = null;
                this.parent = null;
            }

            // consts
            TreeNode.ROOT = 0;
            TreeNode.EXPANDED = 1;
            TreeNode.ITEM = 2;
            // @function traverseChild
            // �����������ڵ���ӽڵ㡣
            // @param callback(node,dataID,isLastNode)
            //              @param this = parent,
            //              @param node ��ָ��ǰ�����Ľڵ�, isFirstNode = trueʱ��ָ��parent.
            //              @param dataID node.dataID
            //              @param isFirstNode Boolean ��ʾ����ڵ���/�������ϵĵ�һ���ڵ�
            // @param parent TreeNode ����ĸ����,�ұ���Ҫ����parent.type ���� TreeNode.EXPANDED�Ľڵ㡣���򱨴�
            function traverseChild(callback, parent) {
                parent = parent || this;
                if (parent.type === TreeNode.EXPANDED || parent.type === TreeNode.ROOT) {
                    callback = callback || function () {
                        };
                    var child = parent.nextChild,
                        nextNode = null;
                    if (child !== null) {
                        //child���ǿյ�
                        nextNode = child;
                        while (nextNode) {
                            if (!(callback.call(parent, nextNode, nextNode.dataID, false))) break;
                            nextNode = nextNode.nextNode;
                        }
                    }
                    else {
                        // ��һ��child
                        callback.call(parent, null, null, true);
                    }
                }
                else {
                    throw Error("parent.type must be TreeNode.EXPANDED.");
                }
            }

            function removeNode(node) {
                if (node.nextNode) {
                    node.nextNode.previousNode = node.previousNode;
                }
                if (node.previousNode) {
                    node.previousNode.nextNode = node.nextNode;
                }
                node.previousNode = null;
                node.nextNode = null;
                return node;
            }


            TreeNode.prototype.isRoot = function () {
                return this.type === TreeNode.ROOT;
            };
            TreeNode.prototype.removeSelf = function () {
                var node = this;
                removeNode(node);
                Mediator.publish(TreeForm.EVENT_NODE_REMOVE, {
                    eventType: TreeForm.EVENT_NODE_REMOVE,
                    node: result
                });
            };
            TreeNode.prototype.edit = function (obj) {
                if (typeof obj !== "object") throw Error("typeError : obj is not an Object");
                var item = this;
                for (var i in obj) {
                    if (item.hasOwnProperty(i) && obj.hasOwnProperty(i)) {
                        item[i] = obj[i];
                    }
                }
                Mediator.publish(TreeForm.EVENT_NODE_CHANGE, {
                    eventType: TreeForm.EVENT_NODE_CHANGE,
                    node: this
                })
            };

            TreeNode.prototype.appendChild = function (newNode) {
                if (newNode instanceof TreeNode) {
                    traverseChild.call(this, function (node, dataID, isFirstChild) {
                        var parent = this;
                        if (!isFirstChild) {
                            if (!node.nextNode) {
                                node.nextNode = newNode;
                                newNode.previousNode = node;
                                newNode.parent = parent;
                                return false; // ��traverChild��ѭ���ϵ�����Ϊ�Ѿ��������µĽڵ��ˣ������һֱѭ����
                            }
                            return true;
                        }
                        else {
                            // ��һ��child
                            parent.nextChild = newNode;
                            newNode.parent = parent;
                            return false;
                        }
                    });
                }
                else {
                    throw new Error("newNode is " + typeof newNode + ",expected TreeNode.");
                }
                Mediator.publish(TreeForm.EVENT_NODE_APPEND, {
                    eventType: TreeForm.EVENT_NODE_APPEND,
                    node: newNode
                });
                return newNode;
            };
            TreeNode.prototype.removeChild = function (diD) {
                if (this.type === TreeNode.EXPANDED) {
                    var result = null;
                    traverseChild.call(this, function (node, dataID, parent) {
                        if (!parent) {
                            if (diD === dataID) {
                                result = node;
                                removeNode(node);
                                return true;
                            }
                        } else {
                            result = null;
                        }
                    });
                    if (result !== null)
                        Mediator.publish(TreeForm.EVENT_NODE_REMOVE, {
                            eventType: TreeForm.EVENT_NODE_REMOVE,
                            node: result
                        });
                    return result;
                }
                console.warn("removeChild node.type is equal to TreeNode.ITEM.expected TreeNode.EXPAND.It will return null;");
                return null;
            };

            Object.defineProperty(TreeNode.prototype, "children", {
                get: function () {
                    var that = this,
                        result = [];
                    traverseChild(function (node) {
                        result.push(node);
                        return true;
                    }, that);
                    return result;
                }
            });

            return TreeNode;
        })(),
        TreeForm = (function () {
            // Constructors
            // TreeForm
            // ����һ�������б�
            //
            // singleton.
            var instance = null;
            function TreeForm(data, value, title) {
                "use strict";
                if (!instance) {
                    // ���û������ٷ�װһ���createTree����
                    var wrappedData = {};
                    title = title || "root";
                    data[TreeForm.TITLE] = value || "id-root";
                    wrappedData[title] = data;
                    var tree = createTree(new TreeNode(TreeNode.ROOT, "godRoot", "godRoot"), wrappedData).nextChild;
                    Object.defineProperty(this, "tree", {
                        value: tree,
                        writable: false
                    });
                    instance = this;
                }
                else return instance;
            }

            // consts
            TreeForm.CLASSNAME = "treeForm";
            TreeForm.EXPANDEDCLASS = "tree-expand";
            TreeForm.EXPANDEDTITLECLASS = "tree-expand-title";
            TreeForm.ITEMCLASS = "tree-item";
            TreeForm.ITEMTITLECLASS = "tree-item-title";
            TreeForm.ITEMWRAPPERCLASS = "tree-item-wrapper";
            // event code
            TreeForm.EVENT_TOGGLE = "toggle";
            TreeForm.EVENT_CLICK = "click";
            TreeForm.EVENT_CLICK_ITEM = "click-item";
            TreeForm.EVENT_CLICK_EXPAND = "click-expand";
            TreeForm.EVENT_NODE_CHANGE = "nodeChange";
            TreeForm.EVENT_NODE_APPEND = "nodeAppend";
            TreeForm.EVENT_NODE_REMOVE = "nodeRemove";
            // ����json�ṹ��title��
            TreeForm.TITLE = "title";
            TreeForm.prototype.render = function () {
                var tree = this.tree,
                    domFrag = document.createElement("div"),
                    domPointer = domFrag;

                domFrag.className = TreeForm.CLASSNAME;
                traverse(tree, function (node, dataID, message) {
                    if (!node && !dataID && message) {
                        try {
                            domPointer = domPointer.parentNode.parentNode;
                        } catch (e) {

                        }
                        return;
                    }
                    if (node.type === TreeNode.EXPANDED) {
                        var ul = document.createElement("ul"),
                            expandedTitle = document.createElement("span"),
                            itemsWrapper = document.createElement("div");

                        itemsWrapper.className = TreeForm.ITEMWRAPPERCLASS;
                        expandedTitle.className = TreeForm.EXPANDEDTITLECLASS;
                        expandedTitle.textContent = node.title;

                        ul.className = TreeForm.EXPANDEDCLASS;
                        // IE 9 ��֧��dataset
                        if (compatable.IE > 9 || compatable.IE === null) ul.dataset["id"] = dataID;
                        ul.appendChild(expandedTitle);
                        ul.appendChild(itemsWrapper);

                        domPointer.appendChild(ul);
                        domPointer = itemsWrapper;
                    } else if (node.type === TreeNode.ITEM) {
                        var li = document.createElement("li"),
                            itemTitle = document.createElement("span");
                        li.className = TreeForm.ITEMCLASS;
                        // IE 9 ��֧��dataset
                        if (compatable.IE > 9 || compatable.IE === null) li.dataset["id"] = dataID;
                        li.appendChild(itemTitle);
                        li.textContent = node.title;

                        itemTitle.className = TreeForm.ITEMTITLECLASS;
                        domPointer.appendChild(li);
                    }
                    return true;
                }, true);
                bindEventListener(domFrag);
                return domFrag;
            };

            TreeForm.prototype.search = function (dataID) {
                if (compatable.IE <= 9) return false;
                var result = null;
                traverse(this.tree, function (node, dID) {
                    if (dataID === dID) {
                        result = node;
                        return false; //�ɹ�������ֹͣ����
                    }
                    return true;//δ�ɹ���������������
                });
                return result;
            };
            // private methods

            // createTree
            // ����ģ�����ķ���
            // @param parent ÿ�α������ĸ��ڵ�
            // @param data ��ǰ��Ӧ���ڵ����ģ��
            // @return ��ǰ���ɵĽڵ�
            function createTree(parent, data) {
                var newNode = null;
                if (parent) {
                    if (data) {
                        for (var i in data) {
                            if (i === TreeForm.TITLE) {
                                continue;
                            }
                            if (data.hasOwnProperty(i) && data[i] instanceof Object) {
                                newNode = parent.appendChild(new TreeNode(TreeNode.EXPANDED, data[i][TreeForm.TITLE], i));
                                createTree(newNode, data[i]);
                            } else {
                                parent.appendChild(new TreeNode(TreeNode.ITEM, data[i], i));
                            }
                        }
                    }
                }
                return parent;
            }

            // traverse
            // ����ģ�����ķ���
            // @param from ��ǰ���ĸ��ڵ㡣
            // @param callback �ص�����
            // callback(node,node.dataID);
            //      @param this = null;
            //      @param node ��ģ�͵�node����
            //      @param nodeID ��ģ�͵�ID,��Ӧ��dom�е�data-id����
            //      @param forRender ������render�����ص���,��Ϊrender�����е�domPointer����֪��ʲôʱ��Ӧ�÷��ظ��ڵ���Ⱦ��
            // ����ڵݹ鷵�ص�ʱ������ٷ�һ���¼���ƽ������ʹ��ʱ����Ҫ�á�
            // @return false �ݹ����
            // @return true: �ݹ����;
            function traverse(from, callback, forRender) {
                callback = callback || function () {
                    };
                var node = from;
                while (node) {
                    if (node.type === TreeNode.EXPANDED) {
                        if (!callback(node, node.dataID)) return false;
                        traverse(node.nextChild, callback, forRender);
                    } else if (node.type === TreeNode.ITEM) {
                        if (!callback(node, node.dataID)) return false;
                    }
                    node = node.nextNode;
                }

                if (forRender) callback(null, null, true);
                return false;
            }

            // bindEventListener
            // ΪdomԪ�ذ��¼����ṩ������toggle����
            // ͬʱҲΪ�û������˼����¼���������󶨡�
            function bindEventListener(domNode) {
                domNode.addEventListener("click", function (event) {
                    var target = event.target,
                        eSpec = new Mediator.EventSpec(TreeForm.EVENT_CLICK, target);
                    Mediator.publish(TreeForm.EVENT_CLICK, eSpec);

                    if (target.className === TreeForm.ITEMTITLECLASS) {
                        event.stopPropagation();
                    }
                    if (target.className === TreeForm.EXPANDEDTITLECLASS) {
                        if (!eSpec.isUserManipulate) {
                            toggleItemVisibility(target);
                        }
                        event.stopPropagation();
                    }
                })
            }

            // toggleItemVisibility
            // ����toggle����ʵ�ֵĺ���
            function toggleItemVisibility(domNode) {
                domNode = domNode.parentNode.getElementsByClassName(TreeForm.ITEMWRAPPERCLASS)[0];
                var displayStatus = domNode.style.display;
                domNode.style.display = (displayStatus === "none" || displayStatus === "") ? "block" : "none";
            }

            return TreeForm;
        })();
    TreeForm.onClick = null;

    return TreeForm;
})();