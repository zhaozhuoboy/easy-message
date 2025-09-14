import { defineEventHandler } from 'h3'

interface SSEPayload {
  type: string,
  data: any
}

interface Client {
  id: string;
  user: string;
  roomId: string;
  send: (data: SSEPayload) => void;
}

// 这里需要从SSE文件中导入clients，但为了避免循环依赖，我们使用全局变量
declare global {
  var roomClients: Map<string, Client> | undefined;
}

// 获取全局客户端映射
function getClients() {
  if (!global.roomClients) {
    global.roomClients = new Map<string, Client>();
  }
  return global.roomClients;
}

// 向房间内所有用户广播消息
function broadcastToRoom(roomId: string, payload: SSEPayload, excludeClientId?: string) {
  const clients = getClients();
  Array.from(clients.values())
    .filter(client => 
      client.roomId === roomId && 
      (!excludeClientId || client.id !== excludeClientId)
    )
    .forEach(client => client.send(payload));
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log('message request body', body)
  
  if (!body.roomId || !body.user || !body.uid || !body.content) {
    return {
      code: -2000,
      message: '缺少必要参数'
    }
  }

  try {
    const { roomId, user, uid, content, type = 'text' } = body;
    
    // 创建消息数据
    const messageData = {
      id: Date.now() + Math.random().toString(36).substr(2, 9), // 生成唯一ID
      user,
      uid,
      content,
      type,
      timestamp: new Date().toISOString()
    };

    // 向房间内所有用户广播消息（排除发送者）
    broadcastToRoom(roomId, {
      type: 'room:message',
      data: messageData
    }, uid);

    return {
      code: 0,
      data: messageData,
      message: '消息发送成功'
    }
  } catch (err) {
    console.error('发送消息失败:', err);
    return {
      code: -3000,
      message: '发送消息失败'
    }
  }
})
