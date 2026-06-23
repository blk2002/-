// pages/chapters/chapters.js
const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    courseId: '',
    courseName: '',
    chapters: [],
    currentChapterId: '',
    currentLessonId: '',
    loading: true
  },

  onLoad(options) {
    this.setData({
      courseId: options.courseId,
      courseName: options.courseName || '课程'
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({ title: this.data.courseName });

    this.loadChapters();
  },

  onShow() {
    // 如果已经加载过课程ID，则刷新学习进度
    if (this.data.courseId) {
      this.loadChapters();
    }
  },

  // 加载章节列表和学习进度
  async loadChapters() {
    this.setData({ loading: true });

    try {
      const userInfo = app.getUserInfo();

      // 加载章节列表
      const chaptersResult = await db.courses.getChapters(this.data.courseId);
      const chapters = chaptersResult.data;

      // 获取学习进度
      let progressData = [];
      if (userInfo && userInfo._id) {
        try {
          const progressResult = await db.progress.getProgress(userInfo._id, this.data.courseId);
          progressData = progressResult.data;
        } catch (err) {
          console.log('获取进度失败', err);
        }
      }

      // 标记每个章节下的知识点数量
      const chapterList = [];
      for (let chapter of chapters) {
        try {
          const lessonsResult = await db.courses.getLessons(chapter._id);
          chapter.lessonCount = lessonsResult.data.length;
          chapter.lessons = lessonsResult.data;
        } catch (err) {
          chapter.lessonCount = 0;
          chapter.lessons = [];
        }
        chapterList.push(chapter);
      }

      // 标记当前学习位置
      let currentChapterId = '';
      let currentLessonId = '';
      if (progressData.length > 0) {
        currentChapterId = progressData[0].chapterId;
        currentLessonId = progressData[0].lessonId;
      }

      this.setData({
        chapters: chapterList,
        currentChapterId,
        currentLessonId,
        loading: false
      });
    } catch (err) {
      console.error('加载章节失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  // 进入知识点详情
  goToLesson(e) {
    const chapterId = e.currentTarget.dataset.chapter;
    const lessonId = e.currentTarget.dataset.lesson;
    const lessonTitle = e.currentTarget.dataset.title;

    wx.navigateTo({
      url: `/pages/lesson/lesson?chapterId=${chapterId}&lessonId=${lessonId}&title=${encodeURIComponent(lessonTitle)}&courseId=${this.data.courseId}`
    });
  }
});
