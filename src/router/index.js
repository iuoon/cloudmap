import Vue from 'vue'
import Router from 'vue-router'
import index from '@/components/index'
import mp from '@/components/mp'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'index',
      component: index
    },
    {
      path: '/mp',
      name: 'mp',
      component: mp
    }
  ]
})
