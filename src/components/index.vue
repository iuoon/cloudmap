<template>
  <div>
    <div ref="cloudMap" class="cloudMap">

    </div>
  </div>
</template>

<script>

export default {
  name: 'index',
  mounted() {
    this.init()
  },
  methods:{
    init (){
      let myChart =this.$echarts.init(this.$refs.cloudMap)
      myChart.setOption({
        // use amap component
        amap: {
          center: [120.13066322374, 30.240018034923],
          zoom: 5,
          resizeEnable: true,
          mapStyle: 'amap://styles/whitesmoke'
        },
        // demo serie showing the capital BEIJING of our PRC :cn:
        series: [{
          type: "scatter",
          // 使用高德地图坐标系
          coordinateSystem: "amap",
          // 数据格式跟在 geo 坐标系上一样，每一项都是 [经度，纬度，数值大小，其它维度...]
          data: [[120, 30, 8], [120.1, 30.2, 20]]
          }]
      })
    }
  }
}
</script>

<style scoped>
.cloudMap{
  width: 1920px;
  height: 1080px;
}
</style>
