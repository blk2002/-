// pages/index/index.js
const app = getApp();

Page({
  data: {
    courses: [],
    userInfo: null
  },

  onLoad() {
    this.setData({
      courses: app.globalData.courses
    });
  },

  onShow() {
    // 检查登录状态
    if (!app.checkLogin()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({
      userInfo: app.getUserInfo(),
      courses: app.globalData.courses
    });
  },

  // 进入课程章节
  goToCourse(e) {
    const courseId = e.currentTarget.dataset.id;
    const courseName = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/pages/chapters/chapters?courseId=${courseId}&courseName=${courseName}`
    });
  }
});
