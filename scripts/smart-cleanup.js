#!/usr/bin/env node

/**
 * 智能清理脚本 - 支持环境变量加载
 */

import { Sequelize, Op } from 'sequelize'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 加载环境变量
 */
function loadEnv() {
  const envFiles = [
    resolve(__dirname, '../.env'),
    resolve(__dirname, '../.env.local'),
    resolve(__dirname, '../.env.development'),
    resolve(__dirname, '../.env.production')
  ]

  for (const envFile of envFiles) {
    if (existsSync(envFile)) {
      console.log(`📄 加载环境变量文件: ${envFile}`)
      const envContent = readFileSync(envFile, 'utf8')
      
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=')
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim()
            process.env[key.trim()] = value
          }
        }
      })
      break
    }
  }
}

// 加载环境变量
loadEnv()

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'nuxt_start_app',
  dialect: 'mysql',
  logging: false,
  timezone: '+08:00',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
}

console.log('🚀 启动智能房间清理脚本...')
console.log(`📊 数据库配置:`)
console.log(`   - 主机: ${dbConfig.host}:${dbConfig.port}`)
console.log(`   - 数据库: ${dbConfig.database}`)
console.log(`   - 用户名: ${dbConfig.username}`)

// 创建 Sequelize 实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    timezone: dbConfig.timezone,
    pool: dbConfig.pool
  }
)

// 房间模型定义
const RoomModel = sequelize.define('Room', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  room_id: {
    type: Sequelize.STRING(6),
    allowNull: false
  },
  expired_time: {
    type: Sequelize.DATE,
    allowNull: true
  }
}, {
  tableName: 'rooms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

/**
 * 删除过期的房间
 */
async function cleanupExpiredRooms() {
  try {
    console.log('🔍 开始扫描过期房间...')
    
    const now = new Date()
    console.log(`⏰ 当前时间: ${now.toISOString()}`)
    
    // 查询过期房间
    const expiredRooms = await RoomModel.findAll({
      where: {
        expired_time: {
          [Op.lt]: now
        }
      }
    })

    console.log(`📋 找到 ${expiredRooms.length} 个过期房间`)

    if (expiredRooms.length === 0) {
      console.log('✅ 没有发现过期的房间')
      return 0
    }

    // 显示过期房间详情
    console.log('🗑️ 过期房间详情:')
    expiredRooms.forEach((room, index) => {
      console.log(`   ${index + 1}. ID: ${room.id}, Room ID: ${room.room_id}, 过期时间: ${room.expired_time}`)
    })

    // 删除过期房间
    console.log('🗑️ 正在删除过期房间...')
    const deletedCount = await RoomModel.destroy({
      where: {
        expired_time: {
          [Op.lt]: now
        }
      }
    })

    console.log(`✅ 已删除 ${deletedCount} 个过期房间`)
    return deletedCount
  } catch (error) {
    console.error('❌ 删除过期房间失败:', error)
    throw error
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 测试数据库连接
    console.log('🔌 连接数据库...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')
    
    // 检查表是否存在
    console.log('🔍 检查 rooms 表...')
    const tableExists = await sequelize.getQueryInterface().tableExists('rooms')
    
    if (!tableExists) {
      console.log('❌ rooms 表不存在')
      console.log('💡 请先启动 Nuxt 应用创建表结构: npm run dev')
      process.exit(1)
    }
    
    console.log('✅ rooms 表存在')
    
    // 查询总房间数
    const totalRooms = await RoomModel.count()
    console.log(`📊 当前总房间数: ${totalRooms}`)
    
    // 执行清理
    const deletedCount = await cleanupExpiredRooms()
    
    console.log(`🎉 清理完成，删除了 ${deletedCount} 个过期房间`)
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error)
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 请检查数据库连接配置：')
      console.error(`   - 主机: ${dbConfig.host}:${dbConfig.port}`)
      console.error(`   - 数据库: ${dbConfig.database}`)
      console.error(`   - 用户名: ${dbConfig.username}`)
      console.error('💡 或者创建数据库:')
      console.error(`   CREATE DATABASE ${dbConfig.database};`)
    }
    
    process.exit(1)
  } finally {
    // 关闭数据库连接
    await sequelize.close()
    console.log('✅ 数据库连接已关闭')
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { cleanupExpiredRooms }
