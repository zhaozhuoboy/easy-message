#!/usr/bin/env node

/**
 * 定时任务管理器
 * 用于管理 cron 任务和内置定时任务
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// 动态获取项目根目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_DIR = resolve(__dirname, '..')
const LOG_DIR = resolve(PROJECT_DIR, 'logs')
const LOG_FILE = resolve(LOG_DIR, 'cleanup.log')

console.log('🕐 定时任务管理器')
console.log('================')

/**
 * 安装 cron 任务
 */
function installCronTask() {
  try {
    console.log('📅 安装 cron 定时任务...')
    
    // 创建日志目录
    if (!existsSync(LOG_DIR)) {
      execSync(`mkdir -p "${LOG_DIR}"`)
      console.log('✅ 创建日志目录')
    }
    
    // 创建 cron 任务 - 使用相对路径和动态目录
    const cronJob = `*/10 * * * * cd "${PROJECT_DIR}" && npm run cleanup:run >> "${LOG_FILE}" 2>&1`
    
    // 检查是否已存在相同的任务
    let existingCron = ''
    try {
      existingCron = execSync('crontab -l', { encoding: 'utf8' })
    } catch (error) {
      // 没有现有的 crontab
    }
    
    if (existingCron.includes('cleanup:run')) {
      console.log('⚠️ 定时任务已存在')
      return
    }
    
    // 添加新任务
    const newCron = existingCron + '\n' + cronJob + '\n'
    execSync(`echo "${newCron.trim()}" | crontab -`)
    
    console.log('✅ cron 定时任务已安装')
    console.log('   - 每10分钟执行一次房间清理')
    console.log(`   - 日志文件: ${LOG_FILE}`)
    
  } catch (error) {
    console.error('❌ 安装 cron 任务失败:', error.message)
  }
}

/**
 * 卸载 cron 任务
 */
function uninstallCronTask() {
  try {
    console.log('🗑️ 卸载 cron 定时任务...')
    
    let existingCron = ''
    try {
      existingCron = execSync('crontab -l', { encoding: 'utf8' })
    } catch (error) {
      console.log('⚠️ 没有找到现有的 cron 任务')
      return
    }
    
    // 过滤掉包含 cleanup:run 的行
    const lines = existingCron.split('\n')
    const filteredLines = lines.filter(line => 
      !line.includes('cleanup:run') && line.trim() !== ''
    )
    
    if (filteredLines.length === 0) {
      execSync('crontab -r')
      console.log('✅ 已删除所有 cron 任务')
    } else {
      const newCron = filteredLines.join('\n')
      execSync(`echo "${newCron}" | crontab -`)
      console.log('✅ 已移除房间清理的 cron 任务')
    }
    
  } catch (error) {
    console.error('❌ 卸载 cron 任务失败:', error.message)
  }
}

/**
 * 查看 cron 任务状态
 */
function showCronStatus() {
  try {
    console.log('📋 当前 cron 任务:')
    const cronJobs = execSync('crontab -l', { encoding: 'utf8' })
    
    if (!cronJobs.trim()) {
      console.log('   (无 cron 任务)')
    } else {
      console.log(cronJobs)
    }
    
    // 检查日志文件
    if (existsSync(LOG_FILE)) {
      console.log(`\n📄 日志文件: ${LOG_FILE}`)
      console.log('最近几行日志:')
      
      try {
        const logContent = execSync(`tail -n 5 "${LOG_FILE}"`, { encoding: 'utf8' })
        console.log(logContent)
      } catch (error) {
        console.log('   (日志文件为空)')
      }
    }
    
  } catch (error) {
    console.log('⚠️ 无法读取 cron 任务')
  }
}

/**
 * 测试清理脚本
 */
function testCleanupScript() {
  try {
    console.log('🧪 测试清理脚本...')
    execSync('npm run cleanup:run', { 
      cwd: PROJECT_DIR,
      stdio: 'inherit'
    })
    console.log('✅ 清理脚本测试成功')
  } catch (error) {
    console.error('❌ 清理脚本测试失败:', error.message)
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
使用方法:
  node scripts/scheduler-manager.js [命令]

命令:
  install    安装 cron 定时任务
  uninstall  卸载 cron 定时任务
  status     查看定时任务状态
  test       测试清理脚本
  help       显示此帮助信息

示例:
  node scripts/scheduler-manager.js install
  node scripts/scheduler-manager.js status
  `)
}

// 主函数
function main() {
  const command = process.argv[2] || 'help'
  
  switch (command) {
    case 'install':
      installCronTask()
      break
    case 'uninstall':
      uninstallCronTask()
      break
    case 'status':
      showCronStatus()
      break
    case 'test':
      testCleanupScript()
      break
    case 'help':
    default:
      showHelp()
      break
  }
}

main()
