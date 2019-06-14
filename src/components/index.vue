<template>
  <div>
    <Row>
      <Col span="20">
        <div ref="cloudMap" class="cloudMap"></div>
        <div class="input-card">
          <div>
            年份：<Select v-model="year" placeholder="选择年份" style="width:6rem" @on-change="choseYear">
              <Option v-for="item in yearList" :value="item" :key="item">{{ item }}</Option>
            </Select>
            属性：<Select v-model="attr" placeholder="选择属性" style="width:6rem" @on-change="choseAttr">
              <Option v-for="item in attrs" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
            <Button type="info" ghost style="margin-left:10px;width: 80px" @click="multiSelect()">{{multiSelectText}}</Button>
          </div>

        </div>


      </Col>
      <Col span="2">
        <div style="margin-left: 5px;width: 100%">
          <Card :dis-hover="true" style="width:240px">
            <p slot="title">当前选中网格</p>
            <div style="width:240px"><p>网格编号：{{getIds()}}</p></div>
            <p>网格信息：</p>
          </Card>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Select v-model="province" @on-change="choseProvince" placeholder="选择省" style="width:240px">
            <Option v-for="item in provinceList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Select v-model="city" @on-change="choseCity" placeholder="选择市" style="width:240px">
            <Option v-for="item in cityList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Select v-model="area" @on-change="choseArea" placeholder="选择区" style="width:240px">
            <Option v-for="item in areaList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Input placeholder="请输入邮箱" style="width: 240px"><Icon type="ios-mail" slot="prefix" /></Input>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Button type="success" style="width: 240px">下载选中网格数据</Button>
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 30px;">
          <Input v-model="fankui" type="textarea" :rows="4" placeholder="填写反馈信息" style="width: 240px" />
        </div>
        <div style="margin-left: 5px;width: 100%;margin-top: 10px;">
          <Button type="success" style="width: 240px">提交反馈信息</Button>
        </div>
        <div ref="histogram" style="height: 300px;width: 240px;">

        </div>
      </Col>
    </Row>
    <div class="input-card2">

    </div>
  </div>
</template>

<script>

  import axios from 'axios'
  import echarts from 'echarts'

  var COLORS = ["#00F61F","#a8f600","#f6f2a5","#f6b489","#f66300","#f691d1","#f600a1","#f6000e"];


export default {
  name: 'index',
  data () {
    return {
      map:{},
      echart:{},
      selectGrids:[],
      selectPloygons:[],
      fankui:'',
      mapJson:'../static/map.json',
      provinceList:[],
      cityList:[],
      areaList:[],
      province:'',
      city:'',
      area:'',
      attr:"Water",//当前网格属性
      attrs:[{"label":"Water","value":"Water"},{"label":"SVC","value":"SVC"},
        {"label":"Aviation","value":"Aviation"},{"label":"SVN","value":"SVN"},
        {"label":"SVO","value":"SVO"},{"label":"INDP","value":"INDP"},
        {"label":"Rail","value":"Rail"},{"label":"INDTT","value":"INDTT"},
        {"label":"INDT","value":"INDT"},{"label":"UBC","value":"UBC"},
        {"label":"AGC","value":"AGC"},{"label":"UBN","value":"UBN"},
        {"label":"RUC","value":"RUC"},{"label":"UBO","value":"UBO"},
        {"label":"Road","value":"Road"},{"label":"AGN","value":"AGN"},
        {"label":"AGO","value":"AGO"},{"label":"RUN","value":"RUN"},{"label":"RUO","value":"RUO"}
      ],
      overlays:[], //选择框
      prezoom:8, //前缩放级别
      currentzoom:8,//当前缩放级别
      year:2007,  //年份
      yearList:[2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019],
      point:"114.291362,30.566915",
      ploygons:[],
      options:{}, //直方图属性
      multiSelectText:'框选',
      multiSelectFlag:false,
      mouseTool:{},
    }
  },
  mounted() {
    var userAgent = navigator.userAgent;
    if (userAgent.indexOf("Firefox") > -1) {
      window.addEventListener("DOMMouseScroll",this.handleScroll,false)
    }else{
      window.addEventListener('mousewheel',this.handleScroll,false)
    }
    this.init();
    this.initCityData();
    this.initHistogram();
    this.initHistogram(this);
  },
  methods:{
    init (){
      this.map = new AMap.Map(this.$refs.cloudMap, {
        center: [114.291362,30.566915],
        zoom: 8,
        zooms:[7,20],
        resizeEnable: true,
        keyboardEnable: true,//地图是否可通过键盘控制
        dragEnable: true,//地图是否可通过鼠标拖拽平移
        showLabel: true ,//是否显示地图文字标记
        mapStyle: 'amap://styles/whitesmoke', //地图样式
        layers: [
          // 卫星
          new AMap.TileLayer.Satellite({opacity:0.5}),
          // 路网
          new AMap.TileLayer.RoadNet({opacity:0.3})
        ],
      });
      this.map.on('moveend', this.mapMoveend);
      this.mouseTool = new AMap.MouseTool(this.map);
      var self=this;
      setTimeout(function () {
        self.initGrid();
      },1000)
      //this.showAreaBounds();
    },
    getCurrentBounds() {
       var bs = this.map.getBounds();        //获取当前地图范围的经纬度
       var bssw = bs.getSouthWest();		//获取西角的经纬度(左下端点)
       var bsne = bs.getNorthEast();		//获取东北角的经纬度(右上端点)
       return { 'x1': bssw.lng, 'y1': bssw.lat, 'x2': bsne.lng, 'y2': bsne.lat };
    },
    initGrid(){
      var self=this;
      console.log("zoom",self.map.getZoom())
      // if (self.map.getZoom()<8){
      //   return
      // }

      var p=self.getCurrentBounds();
      var lt=0;
      var rb=0;
      if(this.currentzoom<this.prezoom){
        lt=(p.x1-1.0)+","+(p.y2+1.0);
        rb=(p.x2+1.0)+","+(p.y1-1.0);
      }else{
        lt=p.x1+","+p.y2;
        rb=p.x2+","+p.y1;
      }

      axios.get("http://localhost:8082/shape/getData2/"+self.year+"?zoom="+self.map.getZoom()+"&ltpoint="+lt+"&rbpoint="+rb).then((res) => {
        if(res.data.code != 0){
          return;
        }

        self.ploygons=[]
        self.map.clearMap()

        let  list= res.data.data
        for(var i = 0,len=list.length;i < len; i++) {
          var obj=list[i]
          var patharr=obj.the_geom;

          var polygon = new AMap.Polygon({
            path: patharr,
            strokeColor:"#0f0f0f",
            strokeWeight:1,
            strokeOpacity:0.3,
            fillColor: self.getColor(self.getAtrrValue(obj)),
            fillOpacity: 0.6,
          });
          polygon.setMap(self.map);
          polygon.ID=obj.ID;
          polygon.Water=obj.Water;
          polygon.SVC=obj.SVC;
          polygon.Aviation=obj.Aviation;
          polygon.SVN=obj.SVN;
          polygon.SVO=obj.SVO;
          polygon.INDP=obj.INDP;
          polygon.Rail=obj.Rail;
          polygon.INDTT=obj.INDTT;
          polygon.INDT=obj.INDT;
          polygon.UBC=obj.UBC;
          polygon.AGC=obj.AGC;
          polygon.UBN=obj.UBN;
          polygon.RUC=obj.RUC;
          polygon.UBO=obj.UBO;
          polygon.Road=obj.Road;
          polygon.AGN=obj.AGN;
          polygon.AGO=obj.AGO;
          polygon.RUN=obj.RUN;
          polygon.RUO=obj.RUO;
          self.ploygons.push(polygon);

          // var infoWindow = new AMap.InfoWindow({offset: new AMap.Pixel(0, 0)});
          // var pMouseover = function () { infoWindow.open(self.map, obj.center_point) };
          polygon.content = ''+obj.ID;
          polygon.on("click",self.changeSelectGrid);
        }
      })
      console.log(self.ploygons.length)
    },
    //初始化直方图
    initHistogram(){
      var self=this;
      let eChart= echarts.init(this.$refs.histogram);
      this.option = {
        title : {
          text: self.attr,
          x:'center'
        },
        color: ['#ffef00'],
        tooltip : {
          trigger: 'axis',
          axisPointer : {            // 坐标轴指示器，坐标轴触发有效
            type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        grid: {
          left: '2%',
          right: '2%',
          bottom: '2%',
          containLabel: true
        },
        xAxis : [
          {
            type : 'category',
            data : ['总值', '平均值', '最大值'],
            axisTick: {
              alignWithLabel: true
            },
            scale: true
          }
        ],
        yAxis : [
          {
            type : 'value'
          }
        ],
        series : [
          {
            name:'value',
            type:'bar',
            barWidth: '60%',
            data:[0, 0, 0]
          }
        ]
      };
      eChart.setOption(this.option);
      this.echart=eChart
    },
    showGrid(){
      var self=this;
      var XY = this.getCurrentBounds();
      console.log(XY);
      var infoWindow = new AMap.InfoWindow({offset: new AMap.Pixel(0, 0)});
      function infoClose(e) {
        infoWindow.close(self.map, e.target.getPosition());
      }
      function infoOpen(e) {
        infoWindow.setContent(e.target.content);
        infoWindow.open(self.map,e.target.getPath()[0]);
      }


      for (var i = XY.x1; i < XY.x2; i = i + 0.3) {
        for (var j = XY.y2; j > XY.y1; j = j - 0.3) {
             var num=Math.floor(Math.random()*6);
          //此类表示绘制一个多边形覆盖物（注意:一定要下面的Point列表为多变形的顶点,描线顺序为从上到下,从左到右，顺序乱了,绘制出来的多边形也会乱，如图二所示，图二是将顶点的顺序给错了（网格左上端点,网格///左下端点，网格右上端点，网格右下端点））
             var polygon = new AMap.Polygon({
               path: [[i, j],[i, j-0.3],[i+0.3, j-0.3],[i+0.3, j]],
               strokeColor:"#ccc",
               strokeWeight:1,
               strokeOpacity:0.2,
               fillColor: COLORS[num],
               fillOpacity: 0.07*num,
             });
            polygon.content =
            '<div className="custom-infowindow input-card">' +
              '<label style="color:grey">网格</label>' +
            '<div>' +
            '<div>' +
               '<span class="input-item-text" >'+i+','+j+'</span>' +
            '</div>' +
            '</div>' +
            '<div>' +
              '<span class="input-item-text" >邮箱：</span>' +
              '<input id="m_email" type="mail"/>' +
            '</div>' +
            '<input id="downloadBtn" type="button" class="btn" style="margin-left: 25%;margin-top: 8px;" value="下载网格数据" onclick="downloadData()"/>' +
            '</div>';
             //polygon.on("click",infoOpen);
             polygon.on("click",self.changeSelectGrid);
             //polygon.on('mouseover', infoOpen);
             polygon.setMap(self.map);
        }
      }



      var polygon_t = new AMap.Polygon({
        path: [[115.79011490197605,44.89508474224183],[115.91679790903335,44.88538600295825],[115.90297162495256,44.79638930050085],[115.77643316632485,44.80610526526714]],
        strokeColor:"#ccc",
        strokeWeight:1,
        strokeOpacity:0.2,
        fillColor: "#cc0019",
        fillOpacity: 1,
      });
      polygon_t.setMap(self.map);

      var mouseTool = new AMap.MouseTool(self.map);
      mouseTool.rectangle({
        fillColor:'#00b0ff',
        strokeColor:'#80d8ff'
        //同Polygon的Option设置
      });
      mouseTool.on('draw',function(e){
        //绘制矩形框结束时触发该事件, //计算哪些框在矩形内
        //先清除之前选择的，然后重新计算
        var drawobj=e.obj
        console.log(222)
        // for(var i=0;i<self.selectPloygons.length;i++){
        //   self.map.remove(self.selectPloygons[i])
        // }
        self.map.remove(drawobj)
      })
    },
    clearGrid(){

    },
    changeSelectGrid(e) {
      var self=this;
      if (event.shiftKey !=1) {
        //判断没有按下shift键则清除之前选中的网格
        for(var i=0;i<self.selectPloygons.length;i++){
          self.map.remove(self.selectPloygons[i])
        }
        self.selectPloygons=[]
      }
      var ploygon=new AMap.Polygon({
        path: e.target.getPath(),
        strokeColor:"#7100f6",
        strokeWeight:2,
        strokeOpacity:1,
        fillColor: "#00f6f5",
        fillOpacity: 0.7,
      });
      ploygon.Water=e.target.Water;
      ploygon.SVC=e.target.SVC;
      ploygon.Aviation=e.target.Aviation;
      ploygon.SVN=e.target.SVN;
      ploygon.SVO=e.target.SVO;
      ploygon.INDP=e.target.INDP;
      ploygon.Rail=e.target.Rail;
      ploygon.INDTT=e.target.INDTT;
      ploygon.INDT=e.target.INDT;
      ploygon.UBC=e.target.UBC;
      ploygon.AGC=e.target.AGC;
      ploygon.UBN=e.target.UBN;
      ploygon.RUC=e.target.RUC;
      ploygon.UBO=e.target.UBO;
      ploygon.Road=e.target.Road;
      ploygon.AGN=e.target.AGN;
      ploygon.AGO=e.target.AGO;
      ploygon.RUN=e.target.RUN;
      ploygon.RUO=e.target.RUO;
      ploygon.setMap(self.map);

      self.selectPloygons.push(ploygon);
      var grid={id:e.target._amap_id}
      self.selectGrids.push(grid)

      var total=0;
      var max=0;
      var len=self.selectPloygons.length
      for(var i=0;i<len;i++){
        var v=self.getAtrrValue(self.selectPloygons[i]);
        total+=v;
        if(v>=max){
          max=v;
        }
      }
      var avg=total/len

      console.log(total,max,avg)
      self.option.series[0].data=[];
      self.option.series[0].data.push(total,avg,max)
      self.echart.setOption(self.option);

    },
    showAreaBounds(){
      var self=this;
      /*绘制小地图的各个省份的分界线*/
      AMapUI.loadUI(['geo/DistrictExplorer'], function(DistrictExplorer) {
        //创建一个实例
        var districtExplorer = new DistrictExplorer({
          map: self.map
        });
        var adcode = 420000;
        districtExplorer.loadAreaNode(adcode, function(error, areaNode) {
          //清除已有的绘制内容
          districtExplorer.clearFeaturePolygons();
          //绘制子区域
          districtExplorer.renderSubFeatures(areaNode, function(feature, i) {
            return {
              bubble: true,
              strokeColor: "#B5B5B5", //线颜色
              strokeOpacity: 1, //线透明度
              strokeWeight: 1, //线宽
              fillColor: "#EEEEEE", //填充色
              fillOpacity: 0.35, //填充透明度
            };
          });
        });
      });
    },
    getIds(){
      let ids='';
      for(var i=0;i<this.selectGrids.length;i++){
        if (i<=3) {
          ids=ids+this.selectGrids[i].id+","
        }
        if (i==4) {
          ids=+" ..."
        }
      }
      return ids;
    },
    getAtrrValue(obj){
      switch (this.attr) {
        case 'Water':return obj.Water
          break
        case 'SVC':return obj.SVC
          break
        case 'Aviation':return obj.Aviation
          break
        case 'SVN':return obj.SVN
          break
        case 'SVO':return obj.SVO
          break
        case 'INDP':return obj.INDP
          break
        case 'Rail':return obj.Rail
          break
        case 'INDTT':return obj.INDTT
          break
        case 'INDT':return obj.INDT
          break
        case 'UBC':return obj.UBC
          break
        case 'AGC':return obj.AGC
          break
        case 'UBN':return obj.UBN
          break
        case 'RUC':return obj.RUC
          break
        case 'UBO':return obj.UBO
          break
        case 'Road':return obj.Road
          break
        case 'AGN':return obj.AGN
          break
        case 'AGO':return obj.AGO
          break
        case 'RUN':return obj.RUN
          break
        case 'RUO':return obj.RUO
          break
        default: return ''
      }
    },
    handleScroll(){
      var self=this;
      let center=this.map.getCenter()
      console.log(this.map.getZoom())
      this.prezoom=this.currentzoom
      this.currentzoom=this.map.getZoom()
      this.point=center.lng+","+center.lat
      this.$nextTick(function(){
        //缩放级别改变的时候，清除之前的网格覆盖，对网格聚合重建
        if(this.currentzoom != this.prezoom){
          setTimeout(function () {
            self.initGrid();
          },100)
        }
      })
    },
    updated(){
      // var self=this;
      // console.log(this.currentzoom,this.prezoom)
      // this.$nextTick(function(){
      //   //缩放级别改变的时候，清除之前的网格覆盖，对网格聚合重建
      //   if(this.currentzoom != this.prezoom){
      //      self.map.clearMap()
      //      self.ploygons=[];
      //      setTimeout(function () {
      //       self.initGrid();
      //     },200)
      //   }
      // })
    },
    mapMoveend(){
       //地图移动结束
      console.log("移动结束开始加载数据")
      var self=this;
      setTimeout(function () {
        self.initGrid();
      },200)
    },
    getColor(val) {
      var bili=val/2;
      var a=(val%255).toFixed(1)
      bili=parseInt(bili)
      if(bili>=255){
        a=0.8
      }

      var one = (255+255) / 100;
      var r=0;
      var g=0;
      var b=0;

      if ( bili < 50 ) {
        // 比例小于50的时候红色是越来越多的,直到红色为255时(红+绿)变为黄色.
        r = one * bili;
        g=255;
      }
      if ( bili >= 50 ) {
        // 比例大于50的时候绿色是越来越少的,直到0 变为纯红
        g =  255 - ( (bili - 50 ) * one) ;
        r = 255;
      }
      r = parseInt(r);// 取整
      g = parseInt(g);// 取整
      b = parseInt(b);// 取整
      if (bili<=0.0){
        return "rgb(160,255,160,0.7)";
      }
      return "rgb("+r+","+g+","+b+","+a+")";
    },
    //省市区三级加载
    initCityData:function(){
      axios.get(this.mapJson).then((data) => {
        console.log(data.data);
        this.provinceList = data.data
      })
    },
    // 选省
    choseProvince:function(e) {
      for (var i = 0; i < this.provinceList.length;i++) {
        if (e === this.provinceList[i].value) {
          this.cityList=this.provinceList[i].children
          this.areaList=[]
          this.area=''
          break;
        }
      }

    },
    // 选市
    choseCity:function(e) {
      for (var i = 0; i < this.cityList.length;i++) {
        if (e === this.cityList[i].value) {
          this.areaList = this.cityList[i].children
          break;
        }
      }
    },
    // 选区
    choseArea:function(e) {
      console.log(e)
    },
    // 选年
    choseYear:function(e){
       console.log(e)
       var self=this;
       this.map.clearMap();
       this.ploygons=[];
       this.year=e
       setTimeout(function () {
        self.initGrid();
       },200)
    },
    //开启或关闭多选模式
    multiSelect(){
      var self=this;
       if(this.multiSelectFlag){
         this.multiSelectText='框选'
         this.multiSelectFlag=false
         this.mouseTool.close(true)//关闭，并清除覆盖物
       }else{
         this.multiSelectText='结束框选'
         this.multiSelectFlag=true
         this.mouseTool.rectangle({
           fillColor:'#00b0ff',
           strokeColor:'#80d8ff'
           //同Polygon的Option设置
         });
         this.mouseTool.on('draw',function(e){
           //绘制矩形框结束时触发该事件, //计算哪些框在矩形内
           //先清除之前选择的，然后重新计算
           var drawobj=e.obj
           console.log(222)
           // for(var i=0;i<self.selectPloygons.length;i++){
           //   self.map.remove(self.selectPloygons[i])
           // }
           self.map.remove(drawobj)
         })
       }
    },
    // 选属性
    choseAttr:function(e){
      var self=this;
      this.attr=e
      self.option.title.text=this.attr;
      self.option.series[0].data=[];
      self.option.series[0].data.push(0,0,0)
      self.echart.setOption(self.option);
      //清除网格选中
      for(var i=0;i<self.selectPloygons.length;i++){
        self.map.remove(self.selectPloygons[i])
      }
      self.selectPloygons=[]
      //改变网格颜色
      for(var i=0;i<this.ploygons.length;i++){
        var color=this.getColor(this.getAtrrValue(this.ploygons[i]))
        this.ploygons[i].setOptions({
          fillColor: color,
          fillOpacity: 0.7,
        });
      }
    }
  }
}
</script>

<style scoped>
  .cloudMap {
    width: 100%;
    height: 800px;
    }
.input-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border-radius: .25rem;
    width: 26rem;
    border-width: 0;
    border-radius: 0.4rem;
    box-shadow: 0 2px 6px 0 rgba(114, 124, 245, .7);
    position: fixed;
    top: 1rem;
    left: 1rem;
    -ms-flex: 1 1 auto;
    flex: 1 1 auto;
    padding: 0.75rem 1.25rem;
    background: rgba(255,255,255,0.9);
}
.input-card2 {
  display: flex;
  flex-direction: column;
  min-width: 0;
  word-wrap: break-word;
  background-color: #fff;
  background-clip: border-box;
  border-radius: .25rem;
  width: 36rem;
  border-width: 0;
  border-radius: 0.4rem;
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  padding: 0.75rem 1.25rem;
  background: rgba(0,0,0,0.0);
}
</style>
