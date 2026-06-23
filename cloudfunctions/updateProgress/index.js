// cloudfunctions/updateProgress/index.js - 更新学习进度
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, courseId, chapterId, lessonId } = event;

  if (!userId || !courseId || !chapterId || !lessonId) {
    return {
      success: false,
      message: '参数不完整'
    };
  }

  try {
    // 检查是否已有该课程的进度记录
    const existing = await db.collection('progress').where({
      userId,
      courseId
    }).get();

    if (existing.data.length > 0) {
      // 更新现有记录
      await db.collection('progress').doc(existing.data[0]._id).update({
        data: {
          chapterId,
          lessonId,
          updatedAt: db.serverDate()
        }
      });
    } else {
      // 创建新记录
      await db.collection('progress').add({
        data: {
          userId,
          courseId,
          chapterId,
          lessonId,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      });
    }

    return {
      success: true,
      message: '进度已更新'
    };
  } catch (err) {
    console.error('更新进度失败', err);
    return {
      success: false,
      message: '更新进度失败'
    };
  }
};
