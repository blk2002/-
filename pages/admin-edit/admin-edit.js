// pages/admin-edit/admin-edit.js
const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    type: 'chapter', // chapter / lesson / lessonlist
    courseId: '',
    chapterId: '',
    chapterTitle: '',
    lessonId: '',
    // 章节数据
    chapterData: {
      title: '',
      order: 1
    },
    // 知识点数据
    lessonData: {
      title: '',
      content: '',
      codeExample: '',
      order: 1,
      questionsText: ''
    },
    // 知识点列表（用于lessonlist类型）
    lessons: [],
    loading: true,
    submitting: false
  },

  onLoad(options) {
    const type = options.type;
    const courseId = options.courseId;
    const chapterId = options.id || options.chapterId || '';
    const chapterTitle = options.chapterTitle ? decodeURIComponent(options.chapterTitle) : '';
    const lessonId = options.lessonId || '';

    this.setData({
      type,
      courseId,
      chapterId,
      chapterTitle,
      lessonId
    });

    // 设置导航标题
    let title = '';
    if (type === 'chapter') {
      title = chapterId ? '编辑章节' : '新增章节';
    } else if (type === 'lessonlist') {
      title = chapterTitle ? chapterTitle + '-知识点' : '知识点管理';
    } else if (type === 'lesson') {
      title = lessonId ? '编辑知识点' : '新增知识点';
    }
    wx.setNavigationBarTitle({ title });

    if (type === 'chapter' && chapterId) {
      this.loadChapter(chapterId);
    } else if (type === 'lesson' && lessonId) {
      this.loadLesson(lessonId);
    } else if (type === 'lessonlist') {
      this.loadLessons(chapterId);
    } else {
      this.setData({ loading: false });
    }
  },

  // 加载章节详情
  async loadChapter(id) {
    try {
      const result = await db.courses.getChapter(id);
      this.setData({
        chapterData: {
          title: result.data.title || '',
          order: result.data.order || 1
        },
        loading: false
      });
    } catch (err) {
      console.error('加载章节失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 加载知识点列表
  async loadLessons(chapterId) {
    try {
      const result = await db.courses.getLessons(chapterId);
      this.setData({
        lessons: result.data,
        loading: false
      });
    } catch (err) {
      console.error('加载知识点失败', err);
      this.setData({ loading: false });
    }
  },

  // 加载知识点详情
  async loadLesson(id) {
    try {
      const result = await db.courses.getLesson(id);
      const lesson = result.data;

      // 格式化题目数据
      let questionsText = '';
      if (lesson.questions) {
        try {
          if (typeof lesson.questions === 'string') {
            questionsText = lesson.questions;
          } else {
            questionsText = JSON.stringify(lesson.questions, null, 2);
          }
        } catch (e) {
          questionsText = '';
        }
      }

      this.setData({
        lessonData: {
          title: lesson.title || '',
          content: lesson.content || '',
          codeExample: lesson.codeExample || '',
          order: lesson.order || 1,
          questionsText: questionsText
        },
        loading: false
      });
    } catch (err) {
      console.error('加载知识点失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 输入处理
  onTitleInput(e) {
    if (this.data.type === 'chapter') {
      this.setData({ 'chapterData.title': e.detail.value });
    } else {
      this.setData({ 'lessonData.title': e.detail.value });
    }
  },

  onOrderInput(e) {
    const val = parseInt(e.detail.value) || 1;
    if (this.data.type === 'chapter') {
      this.setData({ 'chapterData.order': val });
    } else {
      this.setData({ 'lessonData.order': val });
    }
  },

  onContentInput(e) {
    this.setData({ 'lessonData.content': e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ 'lessonData.codeExample': e.detail.value });
  },

  onQuestionsInput(e) {
    this.setData({ 'lessonData.questionsText': e.detail.value });
  },

  // 保存章节
  async saveChapter() {
    const { title, order } = this.data.chapterData;

    if (!title.trim()) {
      wx.showToast({ title: '请输入章节标题', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    try {
      if (this.data.chapterId) {
        // 更新
        await db.courses.updateChapter(this.data.chapterId, {
          title: title.trim(),
          order: parseInt(order) || 1
        });
      } else {
        // 新增
        await db.courses.addChapter({
          courseId: this.data.courseId,
          title: title.trim(),
          order: parseInt(order) || 1,
          createdAt: Date.now()
        });
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('保存章节失败', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 保存知识点
  async saveLesson() {
    const { title, content, codeExample, order, questionsText } = this.data.lessonData;

    if (!title.trim()) {
      wx.showToast({ title: '请输入知识点标题', icon: 'none' });
      return;
    }

    // 验证题目格式
    let questions = [];
    if (questionsText.trim()) {
      try {
        questions = JSON.parse(questionsText);
        if (!Array.isArray(questions)) {
          throw new Error('题目需为数组格式');
        }
      } catch (err) {
        wx.showToast({ title: '题目格式错误', icon: 'none' });
        return;
      }
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    try {
      const data = {
        chapterId: this.data.chapterId,
        title: title.trim(),
        content: content || '',
        codeExample: codeExample || '',
        order: parseInt(order) || 1,
        questions: questions.length > 0 ? questions : null
      };

      if (this.data.lessonId) {
        await db.courses.updateLesson(this.data.lessonId, data);
      } else {
        await db.courses.addLesson(data);
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('保存知识点失败', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 保存按钮
  onSave() {
    if (this.data.type === 'chapter') {
      this.saveChapter();
    } else {
      this.saveLesson();
    }
  },

  // 知识点列表：编辑知识点
  editLesson(e) {
    const lessonId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin-edit/admin-edit?type=lesson&lessonId=${lessonId}&chapterId=${this.data.chapterId}&courseId=${this.data.courseId}`
    });
  },

  // 知识点列表：新增知识点
  addLesson() {
    wx.navigateTo({
      url: `/pages/admin-edit/admin-edit?type=lesson&chapterId=${this.data.chapterId}&courseId=${this.data.courseId}`
    });
  },

  // 知识点列表：删除知识点
  async deleteLesson(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定删除此知识点吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });
            await db.courses.deleteLesson(id);
            wx.hideLoading();
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadLessons(this.data.chapterId);
          } catch (err) {
            wx.hideLoading();
            console.error('删除失败', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 显示题目格式说明
  showQuestionFormat() {
    wx.showModal({
      title: '题目格式说明',
      content: '题目使用JSON数组格式。\n\n选择题示例：\n[{"type":"choice","question":"Python是什么类型语言？","options":{"A":"编译型","B":"解释型","C":"混合型","D":"机器语言"},"answer":"B","explanation":"Python是解释型语言。"}]\n\n填空题示例：\n[{"type":"fill","question":"Python使用____来定义代码块。","answer":"缩进","explanation":"Python使用缩进来定义代码块。"}]',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
