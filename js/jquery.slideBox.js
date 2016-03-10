/*
 * update log      
 * 
 * 		v1.1.0     2016.3.10       1.新增获取 子元素集合方法(getAllItem)
 * 					               2.新增重新加载方法(reload)			
 *  
 *      v1.2.0     2016.3.10       1.总页数计算
 * 	                               2.BUG修改
 * 
 *      v1.3.0     2016.3.10       1.修改调用reload方法时加载数据不正确的问题
 *
 *      v1.3.1     20163.10        1.修改_setLimit方法逻辑
 *      
 */




(function($){
	
	/*
	 * 
	 * 默认配置项
	 */
	var DEFAULT_SETTING={
    	itemWidth:null,               //元素宽度
        itemHeight:null,              //元素高度
        ifWantDefaultItem:true,       //是否需要缺省元素
        limit:4,                      //每页显示数据个数
        ajax:{
            url:"",                   //ajax请求url
            type:"POST",              //请求类型
            data:{},                  //请求参数
            dataKey:"",               //数据键值
            totalCountKey:"",          //总数据量键值
            limitPageKey:"",	      //每页显示数据个数键值
            startPageKey:"",          //每页起始索引位置键值
            render:function(item){}   //子元素渲染回调函数  item为子元素数据项（在此方法构建子元素dom结构）
        },
        event:{                       //以下事件回调函数都为子元素绑定
            click:function(){},       //click回调函数
            mouseover:function(){}    //mouseover回调函数            
        },
        version:"v1.2.0"
    }

	/*
	 * 传送带对象
	 * 
	 * @param {Object} source   目标节点dom对象
	 * @param {Object} options  配置项
	 * @author zhengchj
	 * @mail zhengchj@neusoft.com
	 */
    var SlideBox=function(source,options){
        this.source=source;
        this.options=options;
        this.currentPage=0;
        this._setLimit();
        this._init();
    }
	/*
	 * 
	 * 扩展传送带对象原型
	 */
    $.extend(SlideBox.prototype,{
    	/*
    	 * 
    	 * 初始化传送带控件
    	 * 
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        _init:function(){
            var options=this.options;
            var container=$("<div></div>").addClass("container-slide-box");
            var arrowLeft=$("<i></i>").addClass("arrow").addClass("arrow-left").addClass("active");
            var arrowRight=$("<i></i>").addClass("arrow").addClass("arrow-right");
            var list=$("<ul></ul>").addClass("clear-slide-box");
            this.arrowLeft=arrowLeft;
            this.arrowRight=arrowRight;
            this.list=list;
            container.append(arrowLeft).append(arrowRight).append($("<div></div>").addClass("list-slide-box").css({
                height:options.itemHeight,
                width:options.limit*options.itemWidth
            }).append(list));
            $(this.source).append(container);
            this._load(this.currentPage,false);
            this._bindEvent();
        },
        /*
    	 * 
    	 * 设置每页长度
    	 * 
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        _setLimit:function(){
            if(this.options.ajax.data[this.options.ajax.limitPageKey]){
                this.options.limit=this.options.ajax.data[this.options.ajax.limitPageKey];
            }
        },
        /*
    	 * 
    	 * 设置每页起始索引
    	 * 
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        _setStart:function(page){
            this.options.ajax.data[this.options.ajax.startPageKey]=page*this.options.limit;
        },
        /*
    	 * 
    	 * 通过ajax请求加载数据
    	 * 
    	 * @param {Object} options   页码
    	 * @param {Object} ifReload  是否重新加载
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        _load:function(page,ifReload){
            var me=this;
            var options=me.options;
            me._setStart(page);
            $.ajax({
                url:options.ajax.url,
                type:options.ajax.type,
                data:options.ajax.data,
                dataType:"json",
                success:function(data){
                	if(ifReload){
                		me._remove();
                	}
            		me.currentPage=page;
                    me.totalCount=eval("data."+options.ajax.totalCountKey);
                    me.totalPage=Math.floor((me.totalCount+options.limit-1)/options.limit);//计算总页数
                    var itemList=data[options.ajax.dataKey];
                    for(var i= 0,len=itemList.length;i<len;i++){
                        var item=new Item(itemList[i],options);
                        me.list.append(item._build());
                    }
                    if(me.options.ifWantDefaultItem){
                    	for(var j=0,len=me.options.limit-itemList.length;j<len;j++){
                    		var item=new Item("default",options);
                        	me.list.append(item._build());
                    	}
                    }
                    me.list.width(options.itemWidth*me.list.find("li").length);
                    if(me.totalPage==1){
                        me.arrowLeft.removeClass("active");
                    }
                    if(page!=0){
                        me._slide();
                    }
                }
            })
        },
        /*
    	 * 
    	 * 绑定事件（左右箭头）
    	 * 
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        _bindEvent:function(){
            var me=this;
            me.arrowLeft.click(function(){
                if(!$(this).hasClass("active")){
                    return;
                }
                me.currentPage+=1;
                if(me.currentPage==1){
                    me.arrowRight.addClass("active");
                }
                if(me.currentPage==me.totalPage-1){
                    me.arrowLeft.removeClass("active");
                }
                if(me.currentPage*me.options.limit>=me.list.find("li").length){
                    me._load(me.currentPage,false);
                }else{
                    me._slide();
                }
            })
            me.arrowRight.click(function(){
                if(!$(this).hasClass("active")){
                    return;
                }
                me.currentPage-=1;
                if(me.currentPage==me.totalPage-2){
                    me.arrowLeft.addClass("active");
                }
                if(me.currentPage==0){
                    me.arrowRight.removeClass("active");
                }
                me._slide();
            })
        },
        /*
    	 * 
    	 * 滑动效果
    	 * 
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        _slide:function(){
            var me=this;
            me.list.animate({
                left:-me.list.find("li").eq(me.currentPage*me.options.limit).position().left
            })
        },
        /*
    	 * 
    	 * 删除传送带内部
    	 * 
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        _remove:function(){
        	this.list.empty();
        	this.list.css({
        		left:0
        	})
        	this.arrowLeft.addClass("active");
        	this.arrowRight.removeClass("active");
        },
        /*
    	 * 
    	 * 对外暴露接口，获取所有传送带子元素jquery对象
    	 * 
    	 * @method public
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        getAllItem:function(){
        	return this.list.find("li").children();
        },
        /*
    	 * 
    	 * 对外暴露接口，重新加载数据
    	 * 
    	 * @method public
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        reload:function(){
        	this._load(0,true);
        }
    })

    /*
     * 传送带子元素对象
     * 
     * @param {Object} itemData    子元素数据
     * @param {Object} options     配置项
     * @author zhengchj
     * @mail zhengchj@neusoft.com
     */
    var Item=function(itemData,options){
        this.itemData=itemData;
        this.options=options;
    }

    
    /*
     * 
     * 扩展传送带子元素对象原型
     * 
     */
    $.extend(Item.prototype,{
    	/*
    	 * 
    	 * 构建子元素dom结构
    	 * 
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        _build:function(){
            var options=this.options,itemData=this.itemData;
            var li=$("<li></li>").css({
                height:options.itemHeight,
                width:options.itemWidth
            });
            li.append(options.ajax.render(itemData));
            this.itemObj=li;
            this._bindEvent();
            return li;
        },
        /*
    	 * 
    	 * 绑定子元素事件
    	 * 
    	 * @author zhengchj
    	 * @mail zhengchj@neusoft.com
    	 */
        _bindEvent:function(){
            this.itemObj.children().bind({
                click:this.options.event.click,
                mouseover:this.options.event.mouseover
            })
        }
    })










	/*
	 * 扩展jquery方法
	 * 
	 * @param {Object} options   配置项
	 * @return {TypeName}        传送带对象
	 * @author zhengchj
	 * @mail zhengchj@neusoft.com
	 */
    $.fn.slideBox=function(options){
        var me=this;
        var op= $.extend(true,DEFAULT_SETTING,options||DEFAULT_SETTING);

        return new SlideBox(me,op);
    }




})(jQuery);