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
    submitted: [],    // 记录每道题是否已提交
    isCorrect: [],    // 记录每道题是否正确
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
      const submitted = questions.map(() => false);
      const isCorrect = questions.map(() => null);

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
        userAnswers: userAnswers,   // 注意：原代码第75行有 bug，写成了 showAnswers，需要改成 userAnswers
        submitted: submitted,       // 新增
        isCorrect: isCorrect,       // 新增
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
    // 如果已经提交，不允许修改答案
    if (this.data.submitted[qIndex]) {
      return;
    }
    const option = e.currentTarget.dataset.option;
    const userAnswers = this.data.userAnswers;
    userAnswers[qIndex] = option;
    this.setData({ userAnswers });
  },

  // 填空题输入
  onAnswerInput(e) {
    const qIndex = e.currentTarget.dataset.qindex;
    // 如果已经提交，不允许修改答案
    if (this.data.submitted[qIndex]) {
      return;
    }
    const userAnswers = this.data.userAnswers;
    userAnswers[qIndex] = e.detail.value;
    this.setData({ userAnswers });
  },

  // 提交并查看答案
  submitAndShowAnswer(e) {
    const qIndex = e.currentTarget.dataset.qindex;

    // 如果已经提交过，不再处理
    if (this.data.submitted[qIndex]) {
      return;
    }

    const question = this.data.questions[qIndex];
    const userAnswer = this.data.userAnswers[qIndex];

    if (!userAnswer) {
      wx.showToast({
        title: '请先选择或填写答案',
        icon: 'none'
      });
      return;
    }

    // 判断对错
    let correct = false;
    if (question.type === 'choice') {
      correct = userAnswer.toUpperCase() === question.answer.toUpperCase();
    } else {
      correct = userAnswer.trim() === question.answer.trim();
    }

    // 更新状态
    const submitted = this.data.submitted;
    const isCorrect = this.data.isCorrect;
    const showAnswers = this.data.showAnswers;

    submitted[qIndex] = true;
    isCorrect[qIndex] = correct;
    showAnswers[qIndex] = true;

    this.setData({
      submitted,
      isCorrect,
      showAnswers
    });
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
