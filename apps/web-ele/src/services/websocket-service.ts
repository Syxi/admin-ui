import { Client } from '@stomp/stompjs';
import { useAccessStore } from '@vben/stores';
import { ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';

class WebSocketService {
  private stompClient: Client | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private pendingAcks = new Map<string, { acknowledged: boolean; timestamp: number }>();

  // 回调函数
  private permissionUpdateCallback: ((data: any) => void) | null = null;
  private progressCallback: ((data: any) => void) | null = null;
  private messageCallback: ((data: any) => void) | null = null;

  constructor() {
    // 绑定this上下文
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handlePermissionUpdate = this.handlePermissionUpdate.bind(this);
    this.handleProgress = this.handleProgress.bind(this);
    this.handlePublicMessage = this.handlePublicMessage.bind(this);
  }

  /**
   * 设置权限更新回调
   */
  setPermissionUpdateCallback(callback: (data: any) => void) {
    this.permissionUpdateCallback = callback;
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback: (data: any) => void) {
    this.progressCallback = callback;
  }

  /**
   * 设置公共消息回调
   */
  setMessageCallback(callback: (data: any) => void) {
    this.messageCallback = callback;
  }

  /**
   * 获取WebSocket地址
   */
  private getWebSocketUrl(): string {
    // 根据环境变量确定WebSocket地址
    const baseUrl = import.meta.env.VITE_GLOB_API_URL || '/api';
    // 将HTTP/HTTPS协议替换为WS协议
    if (baseUrl.startsWith('http://')) {
      return baseUrl.replace('http://', 'ws://') + '/ws';
    } else if (baseUrl.startsWith('https://')) {
      return baseUrl.replace('https://', 'wss://') + '/ws';
    }
    // 默认使用相对路径
    return '/ws';
  }

  /**
   * 获取认证头
   */
  private getAuthHeaders(): { [key: string]: string } {
    const accessStore = useAccessStore();
    const token = accessStore.accessToken;
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }

  /**
   * 连接到WebSocket服务器
   */
  connect() {
    if (this.isConnected || this.stompClient) {
      console.warn('WebSocket已经连接或正在连接');
      return;
    }

    try {
      const wsUrl = this.getWebSocketUrl();
      console.log('Connecting to WebSocket server:', wsUrl);

      this.stompClient = new Client({
        brokerURL: wsUrl,
        connectHeaders: this.getAuthHeaders(),
        debug: (str) => {
          console.log('[STOMP]', str);
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 10000, // 后端要求10秒
        heartbeatOutgoing: 10000, // 后端要求10秒
      });

      // 设置事件处理器
      this.stompClient.onConnect = this.handleConnect;
      this.stompClient.onDisconnect = this.handleDisconnect;
      this.stompClient.onStompError = this.handleError;
      this.stompClient.onWebSocketError = this.handleError;
      this.stompClient.onWebSocketClose = this.handleDisconnect;

      this.stompClient.activate();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 处理连接成功的事件
   */
  private handleConnect(frame: any) {
    console.log('Connected to WebSocket server:', frame);
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // 订阅用户专属队列 - 权限更新
    this.stompClient?.subscribe('/user/queue/permission/update', this.handlePermissionUpdate);

    // 订阅用户专属队列 - 进度信息
    this.stompClient?.subscribe('/user/queue/progress', this.handleProgress);

    // 订阅公共主题
    this.stompClient?.subscribe('/topic/messages', this.handlePublicMessage);
  }

  /**
   * 处理权限更新消息
   */
  private handlePermissionUpdate(message: any) {
    try {
      const data = JSON.parse(message.body);
      console.log('Received permission update:', data);

      // 调用回调函数
      if (this.permissionUpdateCallback) {
        this.permissionUpdateCallback(data);
      }

      // 发送确认消息
      this.acknowledgeMessage(data.messageId, true);

      // 处理权限更新逻辑
      this.handlePermissionUpdateLogic(data);
    } catch (error) {
      console.error('Error processing permission update:', error);
    }
  }

  /**
   * 处理权限更新逻辑
   */
  private async handlePermissionUpdateLogic(data: any) {
    try {
      await ElMessageBox.confirm(
        '您的权限已更新，为了保证系统安全，建议重新登录。是否立即重新登录？',
        '权限更新提醒',
        {
          confirmButtonText: '立即重新登录',
          cancelButtonText: '稍后手动处理',
          type: 'warning',
        }
      );

      // 用户选择立即重新登录
      // 注意：这里需要在实际使用时确保router可用
      console.log('User chose to re-login immediately');
      // 实际的重新登录逻辑将在使用时实现
    } catch {
      // 用户选择稍后手动处理，不做任何操作
      console.log('User chose to handle login manually later');
    }
  }

  /**
   * 处理进度消息
   */
  private handleProgress(message: any) {
    try {
      const data = JSON.parse(message.body);
      console.log('Received progress message:', data);

      // 调用回调函数
      if (this.progressCallback) {
        this.progressCallback(data);
      }

      // 发送确认消息（如果需要）
      if (data.messageId) {
        this.acknowledgeMessage(data.messageId, true);
      }
    } catch (error) {
      console.error('Error processing progress message:', error);
    }
  }

  /**
   * 处理公共消息
   */
  private handlePublicMessage(message: any) {
    try {
      const data = JSON.parse(message.body);
      console.log('Received public message:', data);

      // 调用回调函数
      if (this.messageCallback) {
        this.messageCallback(data);
      }

      // 发送确认消息（如果需要）
      if (data.messageId) {
        this.acknowledgeMessage(data.messageId, true);
      }
    } catch (error) {
      console.error('Error processing public message:', error);
    }
  }

  /**
   * 处理断开连接事件
   */
  private handleDisconnect(frame?: any) {
    console.log('Disconnected from WebSocket server:', frame);
    this.isConnected = false;
    this.stompClient = null;
    this.scheduleReconnect();
  }

  /**
   * 处理错误事件
   */
  private handleError(frame: any) {
    console.error('WebSocket error:', frame);
    this.isConnected = false;
    this.stompClient = null;
    this.scheduleReconnect();
  }

  /**
   * 安排重连
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnect attempts reached. Giving up.');
    }
  }

  /**
   * 发送消息确认
   */
  acknowledgeMessage(messageId: string, acknowledged: boolean) {
    if (!this.stompClient || !this.isConnected) {
      console.warn('WebSocket not connected. Cannot send acknowledgment.');
      return;
    }

    try {
      // 记录待确认消息
      this.pendingAcks.set(messageId, {
        acknowledged,
        timestamp: Date.now(),
      });

      // 发送确认消息
      this.stompClient.publish({
        destination: '/app/acknowledge',
        body: JSON.stringify({
          messageId,
          acknowledged,
        }),
      });

      console.log('Sent acknowledgment for message:', messageId);
    } catch (error) {
      console.error('Error sending acknowledgment:', error);
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
    // 清空待确认消息
    this.pendingAcks.clear();
  }

  /**
   * 检查连接状态
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 获取待确认消息数量
   */
  getPendingAckCount(): number {
    return this.pendingAcks.size;
  }
}

// 创建单例实例
const webSocketService = new WebSocketService();

export default webSocketService;