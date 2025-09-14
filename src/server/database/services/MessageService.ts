import { MessageModel, type MessageCreationAttributes, type MessageAttributes } from '../models/MessageModel'
import { Op } from 'sequelize'

/**
 * 消息服务类
 * 提供消息的增删改查功能
 */
export class MessageService {
  /**
   * 创建新消息
   */
  static async createMessage(data: MessageCreationAttributes): Promise<MessageModel> {
    try {
      const message = await MessageModel.create(data)
      console.log('✅ 消息创建成功:', message.id)
      return message
    } catch (error) {
      console.error('❌ 消息创建失败:', error)
      throw error
    }
  }

  /**
   * 根据房间ID获取消息列表
   */
  static async getMessagesByRoomId(
    roomId: string, 
    page: number = 1, 
    limit: number = 50,
    includeDeleted: boolean = false
  ): Promise<{ messages: MessageModel[], total: number }> {
    try {
      const where: any = {
        room_id: roomId
      }

      if (!includeDeleted) {
        where.is_deleted = false
      }

      const offset = (page - 1) * limit

      const { rows: messages, count: total } = await MessageModel.findAndCountAll({
        where,
        order: [['created_at', 'ASC']],
        limit,
        offset
      })

      return { messages, total }
    } catch (error) {
      console.error('❌ 获取消息列表失败:', error)
      throw error
    }
  }

  /**
   * 获取房间的最新消息
   */
  static async getLatestMessages(
    roomId: string, 
    limit: number = 20
  ): Promise<MessageModel[]> {
    try {
      const messages = await MessageModel.findAll({
        where: {
          room_id: roomId,
          is_deleted: false
        },
        order: [['created_at', 'DESC']],
        limit
      })

      return messages.reverse() // 按时间正序返回
    } catch (error) {
      console.error('❌ 获取最新消息失败:', error)
      throw error
    }
  }

  /**
   * 获取指定消息ID之前的消息（用于加载历史消息）
   */
  static async getMessagesBeforeId(
    roomId: string,
    beforeId: number,
    limit: number = 20
  ): Promise<{ messages: MessageModel[], total: number }> {
    try {
      const where: any = {
        room_id: roomId,
        is_deleted: false,
        id: {
          [Op.lt]: beforeId // 获取ID小于指定ID的消息
        }
      }

      const { rows: messages, count: total } = await MessageModel.findAndCountAll({
        where,
        order: [['created_at', 'ASC']], // 按时间正序排列
        limit
      })

      return { messages, total }
    } catch (error) {
      console.error('❌ 获取历史消息失败:', error)
      throw error
    }
  }

  /**
   * 根据用户ID获取消息
   */
  static async getMessagesByUserId(
    userId: number, 
    page: number = 1, 
    limit: number = 50
  ): Promise<{ messages: MessageModel[], total: number }> {
    try {
      const offset = (page - 1) * limit

      const { rows: messages, count: total } = await MessageModel.findAndCountAll({
        where: {
          user_id: userId,
          is_deleted: false
        },
        order: [['created_at', 'DESC']],
        limit,
        offset
      })

      return { messages, total }
    } catch (error) {
      console.error('❌ 获取用户消息失败:', error)
      throw error
    }
  }

  /**
   * 软删除消息
   */
  static async deleteMessage(messageId: number): Promise<boolean> {
    try {
      const [affectedRows] = await MessageModel.update(
        { is_deleted: true },
        { where: { id: messageId } }
      )

      if (affectedRows > 0) {
        console.log('✅ 消息删除成功:', messageId)
        return true
      } else {
        console.log('⚠️ 消息不存在或已被删除:', messageId)
        return false
      }
    } catch (error) {
      console.error('❌ 消息删除失败:', error)
      throw error
    }
  }

  /**
   * 物理删除消息
   */
  static async permanentDeleteMessage(messageId: number): Promise<boolean> {
    try {
      const affectedRows = await MessageModel.destroy({
        where: { id: messageId }
      })

      if (affectedRows > 0) {
        console.log('✅ 消息永久删除成功:', messageId)
        return true
      } else {
        console.log('⚠️ 消息不存在:', messageId)
        return false
      }
    } catch (error) {
      console.error('❌ 消息永久删除失败:', error)
      throw error
    }
  }

  /**
   * 更新消息内容
   */
  static async updateMessage(messageId: number, data: Partial<MessageAttributes>): Promise<MessageModel | null> {
    try {
      const [affectedRows] = await MessageModel.update(data, {
        where: { id: messageId }
      })

      if (affectedRows > 0) {
        const updatedMessage = await MessageModel.findByPk(messageId)
        console.log('✅ 消息更新成功:', messageId)
        return updatedMessage
      } else {
        console.log('⚠️ 消息不存在:', messageId)
        return null
      }
    } catch (error) {
      console.error('❌ 消息更新失败:', error)
      throw error
    }
  }

  /**
   * 根据ID获取消息详情
   */
  static async getMessageById(messageId: number): Promise<MessageModel | null> {
    try {
      const message = await MessageModel.findByPk(messageId)
      return message
    } catch (error) {
      console.error('❌ 获取消息详情失败:', error)
      throw error
    }
  }

  /**
   * 搜索消息
   */
  static async searchMessages(
    roomId: string,
    keyword: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ messages: MessageModel[], total: number }> {
    try {
      const offset = (page - 1) * limit

      const { rows: messages, count: total } = await MessageModel.findAndCountAll({
        where: {
          room_id: roomId,
          content: {
            [Op.like]: `%${keyword}%`
          },
          is_deleted: false
        },
        order: [['created_at', 'DESC']],
        limit,
        offset
      })

      return { messages, total }
    } catch (error) {
      console.error('❌ 搜索消息失败:', error)
      throw error
    }
  }

  /**
   * 获取房间消息统计
   */
  static async getRoomMessageStats(roomId: string): Promise<{
    total: number
    textCount: number
    imageCount: number
    fileCount: number
    systemCount: number
  }> {
    try {
      const stats = await MessageModel.findAll({
        where: {
          room_id: roomId,
          is_deleted: false
        },
        attributes: [
          'type',
          [MessageModel.sequelize!.fn('COUNT', MessageModel.sequelize!.col('id')), 'count']
        ],
        group: ['type']
      })

      const result = {
        total: 0,
        textCount: 0,
        imageCount: 0,
        fileCount: 0,
        systemCount: 0
      }

      stats.forEach((stat: any) => {
        const count = parseInt(stat.get('count'))
        result.total += count

        switch (stat.type) {
          case 'text':
            result.textCount = count
            break
          case 'image':
            result.imageCount = count
            break
          case 'file':
            result.fileCount = count
            break
          case 'system':
            result.systemCount = count
            break
        }
      })

      return result
    } catch (error) {
      console.error('❌ 获取消息统计失败:', error)
      throw error
    }
  }
}

export default MessageService
