// pages/lesson/lesson.js
const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    chapterId: '',
    lessonId: '',
    courseId: '',
    lessonData: null,
    isFavorite: false,
    // 题目相关
    questions: [],
    showAnswers: [], // 记录每道题是否显示答案
    userAnswers: [], // 用户选择的答案
    loading: true
  },

  onLoad(options) {
    this.setData({
      chapterId: options.chapterId,
      lessonId: options.lessonId,
      courseId: options.courseId
    });

    if (options.title) {
      wx.setNavigationBarTitle({ title: decodeURIComponent(options.title) });
    }

    this.loadLesson();
  },

  // 加载知识点详情
  async loadLesson() {
    this.setData({ loading: true });

    try {
      const result = await db.courses.getLesson(this.data.lessonId);
      const lesson = result.data;

      // 解析题目数据
      let questions = [];
      if (lesson.questions) {
        try {
          if (typeof lesson.questions === 'string') {
            questions = JSON.parse(lesson.questions);
          } else {
            questions = lesson.questions;
          }
        } catch (e) {
          questions = [];
        }
      }

      // 初始化答案和用户答案数组
      const showAnswers = questions.map(() => false);
      const userAnswers = questions.map(() => null);

      // 检查是否已收藏
      let isFav = false;
      const userInfo = app.getUserInfo();
      if (userInfo && userInfo._id) {
        try {
          const favResult = await db.favorites.isFavorite(userInfo._id, this.data.lessonId);
          isFav = favResult.total > 0;
        } catch (err) {
            console.log('检查收藏状态失败', err);
          }
      }

      this.setData({
        lessonData: lesson,
        questions: questions,
        showAnswers: showAnswers,
        userAnswers: showAnswers,
        isFavorite: isFav,
        loading: false
      });

      // 更新学习进度
      if (userInfo && userInfo._id) {
        try {
          await db.progress.updateProgress(
            userInfo._id,
            this.data.courseId,
            this.data.chapterId,
            this.data.lessonId
          );
        } catch (err) {
          console.log('更新进度失败', err);
        }
      }
    } catch (err) {
      console.error('加载知识点失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 选择答案（选择题）
  selectAnswer(e) {
    const qIndex = e.currentTarget.dataset.qindex;
    const option = e.currentTarget.dataset.option;
    const userAnswers = this.data.userAnswers;
    userAnswers[qIndex] = option;
    this.setData({ userAnswers });
  },

  // 填空题输入
  onAnswerInput(e) {
    const qIndex = e.currentTarget.dataset.qindex;
    const userAnswers = this.data.userAnswers;
    userAnswers[qIndex] = e.detail.value;
    this.setData({ userAnswers });
  },

  // 显示/隐藏答案
  toggleAnswer(e) {
    const qIndex = e.currentTarget.dataset.qindex;
    const showAnswers = this.data.showAnswers;
    showAnswers[qIndex] = !showAnswers[qIndex];
    this.setData({ showAnswers });
  },

  // 切换收藏
  async toggleFavorite() {
    const userInfo = app.getUserInfo();
    if (!userInfo || !userInfo._id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      const result = await db.favorites.toggleFavorite(userInfo._id, this.data.lessonId);
      if (result.result.success) {
        this.setData({ isFavorite: result.result.isFavorite });
        wx.showToast({
          title: result.result.isFavorite ? '已收藏' : '已取消收藏',
          icon: 'success'
        });
      }
    } catch (err) {
      console.error('收藏操作失败', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 复制代码示例
  copyCode() {
    if (this.data.lessonData && this.data.lessonData.codeExample) {
      wx.setClipboardData({
        data: this.data.lessonData.codeExample,
        success: () => {
          wx.showToast({ title: '代码已复制', icon: 'success' });
        }
      });
    }
  }
});
