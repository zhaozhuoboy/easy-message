// import { useNuxtApp } from "nuxt/app"

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

// 使用全局变量来共享客户端数据
declare global {
  var roomClients: Map<string, Client> | undefined;
  var roomUsers: Map<string, Set<string>> | undefined; // 房间ID -> 用户ID集合
}

// 获取全局客户端映射
function getClients() {
  if (!global.roomClients) {
    global.roomClients = new Map<string, Client>();
  }
  return global.roomClients;
}

// 获取房间用户映射
function getRoomUsersMap() {
  if (!global.roomUsers) {
    global.roomUsers = new Map<string, Set<string>>();
  }
  return global.roomUsers;
}

// 获取房间内的所有用户（优化版本）
function getRoomUsers(roomId: string) {
  const clients = getClients();
  const roomUsersMap = getRoomUsersMap();
  const userIds = roomUsersMap.get(roomId) || new Set();
  
  const roomUsers = Array.from(userIds)
    .map(userId => {
      const client = clients.get(userId);
      return client ? {
        uid: client.id,
        username: client.user
      } : null;
    })
    .filter(user => user !== null);
    
  console.log(`房间 ${roomId} 的用户列表:`, roomUsers);
  return roomUsers;
}

// 向房间内所有用户广播消息（优化版本）
function broadcastToRoom(roomId: string, payload: SSEPayload, excludeClientId?: string) {
  const clients = getClients();
  const roomUsersMap = getRoomUsersMap();
  const userIds = roomUsersMap.get(roomId) || new Set();
  
  const targetClients = Array.from(userIds)
    .filter(userId => !excludeClientId || userId !== excludeClientId)
    .map(userId => clients.get(userId))
    .filter(client => client !== undefined);
    
  console.log(`向房间 ${roomId} 的 ${targetClients.length} 个用户广播消息:`, payload.type, excludeClientId ? `(排除 ${excludeClientId})` : '');
  targetClients.forEach(client => client.send(payload));
}

// 向特定客户端发送消息
function sendToClient(clientId: string, payload: SSEPayload) {
  const clients = getClients();
  const client = clients.get(clientId);
  if (client) {
    client.send(payload);
  }
}

// 添加用户到房间
function addUserToRoom(roomId: string, userId: string) {
  const roomUsersMap = getRoomUsersMap();
  if (!roomUsersMap.has(roomId)) {
    roomUsersMap.set(roomId, new Set());
  }
  roomUsersMap.get(roomId)!.add(userId);
}

// 从房间移除用户
function removeUserFromRoom(roomId: string, userId: string) {
  const roomUsersMap = getRoomUsersMap();
  const roomUsers = roomUsersMap.get(roomId);
  if (roomUsers) {
    roomUsers.delete(userId);
    // 如果房间没有用户了，删除房间记录
    if (roomUsers.size === 0) {
      roomUsersMap.delete(roomId);
    }
  }
}

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)
  // const nuxtApp = useNuxtApp()
  // query 参数  roomId   user  uid
  const { user, uid, roomId } = getQuery(event)

  const clientId = uid as string;
  const roomIdStr = roomId as string;
  const username = user as string;

  // 添加新客户端
  const newClient: Client = {
    id: clientId,
    user: username,
    roomId: roomIdStr,
    send: (data: SSEPayload) => {
      eventStream.push(JSON.stringify(data));
    }
  };

  const clients = getClients();
  clients.set(clientId, newClient);
  
  // 添加用户到房间
  addUserToRoom(roomIdStr, clientId);
  
  console.log(`用户 ${username} 进入房间 ${roomIdStr}, 当前房间用户数:`, getRoomUsers(roomIdStr).length);

  // 获取当前房间的所有用户
  const currentUsers = getRoomUsers(roomIdStr);
  console.log(`用户 ${username} 进入房间 ${roomIdStr}, 当前房间用户:`, currentUsers);

  // 向新用户发送当前房间用户列表
  sendToClient(clientId, {
    type: 'room:users:list',
    data: {
      users: currentUsers,
      roomId: roomIdStr,
      timestamp: new Date().toISOString()
    }
  });

  // 通知房间内其他用户有新用户加入，并发送更新后的用户列表
  broadcastToRoom(roomIdStr, {
    type: 'room:user:enter',
    data: {
      user: username,
      uid: clientId,
      roomId: roomIdStr,
      timestamp: new Date().toISOString()
    }
  }, clientId);

  // 向房间内其他用户发送更新后的用户列表
  broadcastToRoom(roomIdStr, {
    type: 'room:users:list',
    data: {
      users: currentUsers,
      roomId: roomIdStr,
      timestamp: new Date().toISOString()
    }
  }, clientId);

  // 处理连接关闭
  eventStream.onClosed(async () => {
    // 从客户端列表中移除
    const clients = getClients();
    clients.delete(clientId);
    
    // 从房间用户列表中移除
    removeUserFromRoom(roomIdStr, clientId);
    
    console.log(`用户 ${username} 离开房间 ${roomIdStr}, 当前房间用户数:`, getRoomUsers(roomIdStr).length);
    
    // 通知房间内其他用户有用户离开
    broadcastToRoom(roomIdStr, {
      type: 'room:user:leave',
      data: {
        user: username,
        uid: clientId,
        roomId: roomIdStr,
        timestamp: new Date().toISOString()
      }
    });

    // 更新剩余用户的用户列表
    broadcastToRoom(roomIdStr, {
      type: 'room:users:list',
      data: {
        users: getRoomUsers(roomIdStr),
        roomId: roomIdStr,
        timestamp: new Date().toISOString()
      }
    });

    await eventStream.close()
  })

  return eventStream.send()
})