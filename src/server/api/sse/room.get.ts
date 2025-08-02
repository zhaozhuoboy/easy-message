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

const clients = new Map<string, Client>();
function broadcastToRoom(roomId: string, payload: SSEPayload, excludeClientId?: string) {
  Array.from(clients.values())
    .filter(client => 
      client.roomId === roomId && 
      (!excludeClientId || client.id !== excludeClientId)
    )
    .forEach(client => client.send(payload));
}

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)
  // const nuxtApp = useNuxtApp()
  // query 参数  roomId   user  uid
  const { user, uid, roomId } = getQuery(event)

  const clientId = uid as string;

  // 添加新客户端
  const newClient: Client = {
    id: clientId,
    user: user as string,
    roomId: roomId as string,
    send: (data: SSEPayload) => {
      eventStream.push(JSON.stringify(data));
    }
  };

  clients.set(clientId, newClient);
  console.log('room users', clients.size)

   // 通知房间内其他用户有新用户加入
   broadcastToRoom(roomId as string, {
    type: 'room:user:enter',
    data: {
      user,
      uid,
      roomId,
      timestamp: new Date().toISOString()
    }
  }, clientId);

  eventStream.onClosed(async () => {
    await eventStream.close()
  })

  return eventStream.send()
})