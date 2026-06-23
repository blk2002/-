// app.js
let envConfig;
try {
  envConfig = require("./env.local.js");
} catch (e) {
  envConfig = require("./env.template.js");
  console.warn("请复制 env.template.js 并重命名为 env.local.js，填入你的云环境ID");
}

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: envConfig.cloudEnvId,
        traceUser: true
      });
    }
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo._id) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
    }
  },
  checkLogin() {
    return this.globalData.isLoggedIn && this.globalData.userInfo;
  },
  getUserInfo() {
    return this.globalData.userInfo;
  },
  setUserInfo(user) {
    this.globalData.userInfo = user;
    this.globalData.isLoggedIn = true;
    wx.setStorageSync('userInfo', user);
  },
  logout() {
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    wx.removeStorageSync('userInfo');
  },
  isAdmin() {
    return this.globalData.userInfo && this.globalData.userInfo.role === 'admin';
  },
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    courses: [
      { id: 'python', name: 'Python', icon: '🐍', color: '#3776AB' },
      { id: 'cpp', name: 'C++', icon: '⚡', color: '#00599C' }
    ]
  }
});