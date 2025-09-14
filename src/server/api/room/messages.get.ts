import { MessageService } from '~/server/database/services/MessageService'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const roomId = query.roomId as string
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const type = query.type as 'latest' | 'history' || 'latest'

    if (!roomId) {
      throw createError({
        statusCode: 400,
        statusMessage: '房间ID不能为空'
      })
    }

    let messages
    let total = 0

    if (type === 'latest') {
      // 获取最新消息 - 从最新的消息开始获取
      messages = await MessageService.getLatestMessages(roomId, limit)
      // 获取总数用于分页计算
      const result = await MessageService.getMessagesByRoomId(roomId, 1, 1)
      total = result.total
    } else {
      // 获取历史消息 - 根据消息ID获取更早的消息
      const beforeId = query.beforeId ? parseInt(query.beforeId as string) : null
      if (beforeId) {
        // 获取指定消息ID之前的消息
        const result = await MessageService.getMessagesBeforeId(roomId, beforeId, limit)
        messages = result.messages
        total = result.total
      } else {
        // 获取历史消息（分页）
        const result = await MessageService.getMessagesByRoomId(roomId, page, limit)
        messages = result.messages
        total = result.total
      }
    }

    return {
      code: 0,
      message: '获取消息成功',
      data: {
        messages: messages.map(msg => ({
          id: msg.id,
          room_id: msg.room_id,
          user_id: msg.user_id,
          user: msg.username || `用户${msg.user_id}`,
          uid: msg.user_id,
          content: msg.content,
          type: msg.type,
          file_url: msg.file_url,
          file_name: msg.file_name,
          file_size: msg.file_size,
          created_at: msg.created_at,
          updated_at: msg.updated_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    }
  } catch (error: any) {
    console.error('获取房间消息失败:', error)
    
    return {
      code: -1,
      message: error.message || '获取消息失败',
      data: null
    }
  }
})
