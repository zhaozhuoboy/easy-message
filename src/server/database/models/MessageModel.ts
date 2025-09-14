import { Model, DataTypes, type Optional } from 'sequelize'
import { sequelize } from '../config'

// 消息接口定义
export interface MessageAttributes {
  id: number
  room_id: string // 房间ID
  user_id: number // 用户ID
  username?: string // 用户名（冗余存储，便于查询）
  content: string // 消息内容
  type: 'text' | 'image' | 'file' | 'system' // 消息类型
  file_url?: string // 文件URL（图片、文件等）
  file_name?: string // 文件名
  file_size?: number // 文件大小（字节）
  is_deleted: boolean // 是否已删除
  created_at: Date
  updated_at: Date
}

export interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'is_deleted' | 'created_at' | 'updated_at'> {}

export class MessageModel extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number
  public room_id!: string
  public user_id!: number
  public username?: string
  public content!: string
  public type!: 'text' | 'image' | 'file' | 'system'
  public file_url?: string
  public file_name?: string
  public file_size?: number
  public is_deleted!: boolean
  public created_at!: Date
  public updated_at!: Date

  // 时间戳
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

MessageModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: '消息ID'
    },
    room_id: {
      type: DataTypes.STRING(6),
      allowNull: false,
      comment: '房间ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '用户名（冗余存储）'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '消息内容'
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system'),
      allowNull: false,
      defaultValue: 'text',
      comment: '消息类型'
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '文件URL'
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '文件名'
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '文件大小（字节）'
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否已删除'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间',
      get() {
        const rawValue = this.getDataValue('created_at');
        return rawValue ? new Date(rawValue).getTime() : null;
      }
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      comment: '更新时间',
      get() {
        const rawValue = this.getDataValue('updated_at');
        return rawValue ? new Date(rawValue).getTime() : null;
      }
    }
  },
  {
    sequelize,
    tableName: 'messages',
    modelName: 'Message',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['room_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['room_id', 'created_at']
      },
      {
        fields: ['is_deleted']
      }
    ]
  }
)

export default MessageModel
