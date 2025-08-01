import { Model, DataTypes, Optional } from 'sequelize'
import { sequelize } from '../config'

// 房间接口定义
export interface RoomAttributes {
  id: number
  room_id: number // 修改为 number 类型
  room_name?: string
  room_type?: string
  room_status?: string
  is_private?: boolean // 是否私密
  password?: string // 密码
  created_at: Date
  updated_at: Date
}

export interface RoomCreationAttributes extends Optional<RoomAttributes, 'room_id' | 'created_at' | 'updated_at'> {}

export class RoomModel extends Model<RoomAttributes, RoomCreationAttributes> implements RoomAttributes {
  public id!: number
  public room_id!: number
  public room_name?: string
  public room_type?: string
  public room_status?: string
  public is_private?: boolean
  public password?: string
  public created_at!: Date
  public updated_at!: Date
}

RoomModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: '自增ID'
    },
    room_id: {
      type: DataTypes.STRING(6),
      allowNull: false,
      unique: true,
      comment: '房间ID'
    },
    room_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '房间名称'
    },
    room_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '房间类型'
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: '是否私密',
      defaultValue: false
    },
    password: {
      type: DataTypes.STRING(6),
      allowNull: true,
      comment: '密码',
      get() {
        return null;
      }
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
    tableName: 'rooms',
    modelName: 'Room',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['room_id']
      },
      {
        fields: ['created_at']
      }
    ]
  }
)
