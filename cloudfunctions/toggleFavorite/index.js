// cloudfunctions/toggleFavorite/index.js - 切换收藏状态
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, lessonId } = event;

  if (!userId || !lessonId) {
    return {
      success: false,
      message: '参数不完整'
    };
  }

  try {
    // 检查是否已收藏
    const existing = await db.collection('favorites').where({
      userId,
      lessonId
    }).get();

    if (existing.data.length > 0) {
      // 取消收藏
      await db.collection('favorites').doc(existing.data[0]._id).remove();
      return {
        success: true,
        isFavorite: false,
        message: '已取消收藏'
      };
    } else {
      // 添加收藏
      await db.collection('favorites').add({
        data: {
          userId,
          lessonId,
          createdAt: db.serverDate()
        }
      });
      return {
        success: true,
        isFavorite: true,
        message: '已加入收藏'
      };
    }
  } catch (err) {
    console.error('切换收藏失败', err);
    return {
      success: false,
      message: '操作失败'
    };
  }
};
