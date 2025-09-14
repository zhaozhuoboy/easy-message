import { sequelize } from '../config'
import { RoomModel } from './RoomModel'
import { MessageModel } from './MessageModel'

// 导出所有模型
export { RoomModel, MessageModel }
export { sequelize }

// 定义模型关联关系
export const setupAssociations = () => {
  // 房间与消息的关联关系
  // 一个房间可以有多个消息
  RoomModel.hasMany(MessageModel, {
    foreignKey: 'room_id',
    sourceKey: 'room_id',
    as: 'messages'
  })
  
  // 消息属于房间
  MessageModel.belongsTo(RoomModel, {
    foreignKey: 'room_id',
    targetKey: 'room_id',
    as: 'room'
  })
  
  console.log('✅ 模型关联关系设置完成')
}

// 初始化所有模型
export const initializeModels = async () => {
  try {
    // 设置模型关联
    setupAssociations()
    
    // 测试数据库连接
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')
    
    return true
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    return false
  }
}

// 同步数据库（开发环境使用）
export const syncAllModels = async (force = false) => {
  try {
    await sequelize.sync({ force })
    console.log('✅ 所有模型同步成功')
    return true
  } catch (error) {
    console.error('❌ 模型同步失败:', error)
    return false
  }
} 