import { Client, Stomp } from '@stomp/stompjs';
import {useAccessStore, useUserStore} from '@vben/stores';
import { ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import SockJS from 'sockjs-client';

// 修复后的前端WebSocket服务类
class WebSocketService {
  private stompClient: any | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private pendingAcks = new Map<string, { acknowledged: boolean; timestamp: number }>();
  private pendingMessages = new Map<string, { destination: string; body: string; timestamp: number; retryCount: number }>();

  // 回调函数
  private permissionUpdateCallback: ((data: any) => void) | null = null;
  private progressCallback: ((data: any) => void) | null = null;
  private messageCallback: ((data: any) => void) | null = null;
  private connectionCallback: ((connected: boolean) => void) | null = null;

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
   * 设置连接状态回调
   */
  setConnectionCallback(callback: ((connected: boolean) => void) | null) {
    this.connectionCallback = callback;
  }

  /**
   * 解析消息内容
   * @param messageBody 消息体
   * @returns 解析后的数据
   */
  private parseMessage(messageBody: string): any {
    try {
      return JSON.parse(messageBody);
    } catch (parseError) {
      // 如果JSON解析失败，将消息体作为纯文本处理
      return {
        type: 'TEXT_MESSAGE',
        content: messageBody,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 获取WebSocket地址
   */
  private getWebSocketUrl(): string {
    // 确保VITE_WEBSOCKET_URL环境变量正确配置
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8888/ws';
    return wsUrl;
  }

  /**
   * 获取认证头
   */
  private getAuthHeaders(): { [key: string]: string } {
    // 如果需要认证，从localStorage或cookie获取token
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    // 如果没有找到authToken，尝试从Vben Admin的标准存储中获取
    if (!token) {
      const authInfo = localStorage.getItem('persist:vben-admin-user-store');
      if (authInfo) {
        try {
          const authData = JSON.parse(authInfo);
          if (authData.token) {
            return { Authorization: `Bearer ${authData.token}` };
          }
        } catch (e) {
          console.warn('Failed to parse auth info from persist store');
        }
      }
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * 连接到WebSocket服务器
   */
  connect() {
    // 如果已经连接，先断开旧连接
    if (this.stompClient && this.stompClient.active) {
      this.disconnect();
    }

    try {
      const wsUrl = this.getWebSocketUrl();
      console.log('Connecting to WebSocket URL:', wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 处理连接成功的事件
   */
  handleConnect(frame: any) {
    console.log("WebSocket连接成功", frame);
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // 订阅用户专属队列 - 权限更新
    if (this.stompClient && this.stompClient.active) {
      try {
        this.stompClient.subscribe('/user/queue/permission/update', this.handlePermissionUpdate);
        console.log('Subscribed to /user/queue/permission/update');
      } catch (error) {
        console.error('Failed to subscribe to /user/queue/permission/update:', error);
      }
    }

    // 订阅用户专属队列 - 进度信息
    if (this.stompClient && this.stompClient.active) {
      try {
        this.stompClient.subscribe('/user/queue/progress', this.handleProgress);
        console.log('Subscribed to /user/queue/progress');
      } catch (error) {
        console.error('Failed to subscribe to /user/queue/progress:', error);
      }
    }

    // 订阅公共主题
    if (this.stompClient && this.stompClient.active) {
      try {
        this.stompClient.subscribe('/topic/messages', this.handlePublicMessage);
        console.log('Subscribed to /topic/messages');
      } catch (error) {
        console.error('Failed to subscribe to /topic/messages:', error);
      }
    }

    // 连接成功后重试待发送的消息
    this.retryPendingMessages();

    // 连接成功后触发回调
    if (this.connectionCallback) {
      this.connectionCallback(true);
    }
  }

  /**
   * 处理权限更新消息
   */
  handlePermissionUpdate(message: any) {
    try {
      console.log('Received permission update message:', message);
      const data = this.parseMessage(message.body);

      // 调用回调函数
      if (this.permissionUpdateCallback) {
        this.permissionUpdateCallback(data);
      }

      // 发送确认消息（如果有messageId）
      if (data.messageId) {
        this.acknowledgeMessage(data.messageId, true);
      }

      // 处理权限更新逻辑
      this.handlePermissionUpdateLogic(data);
    } catch (error) {
      console.error('Error processing permission update:', error);
      console.error('Full message that caused error:', message);
    }
  }

  /**
   * 处理权限更新逻辑
   */
  private async handlePermissionUpdateLogic(data: any) {
    try {
      // 显示权限更新提醒
      if (typeof window !== 'undefined' && (window as any).ElMessageBox) {
        await (window as any).ElMessageBox.confirm(
          data.payload || '您的权限已更新，为了保证系统安全，建议重新登录。是否立即重新登录？',
          data.title || '权限更新提醒',
          {
            confirmButtonText: '立即重新登录',
            cancelButtonText: '稍后手动处理',
            type: 'warning',
          }
        );

        // 用户选择立即重新登录
        // 这里可以添加实际的重新登录逻辑
        // 例如：window.location.reload() 或者跳转到登录页面
        // window.location.reload();
      } else {
        // 如果没有Element UI的MessageBox，使用普通提示
        alert(data.payload || '您的权限已更新，请重新登录');
      }
    } catch (error) {
      // 用户选择稍后手动处理，不做任何操作
      console.log('User chose to handle later');
    }
  }

  /**
   * 处理进度消息
   */
  handleProgress(message: any) {
    try {
      console.log('Received progress message:', message);
      const data = this.parseMessage(message.body);

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
  handlePublicMessage(message: any) {
    try {
      console.log('Received public message:', message);
      const data = this.parseMessage(message.body);

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
  handleDisconnect(frame?: any) {
    console.log("WebSocket disconnected", frame);
    this.isConnected = false;
    this.stompClient = null;

    // 断开连接后触发回调
    if (this.connectionCallback) {
      this.connectionCallback(false);
    }

    this.scheduleReconnect();
  }

  /**
   * 处理错误事件
   */
  handleError(frame: any) {
    console.error('STOMP error:', frame);
    this.isConnected = false;
    this.stompClient = null;

    // 错误发生时触发回调
    if (this.connectionCallback) {
      this.connectionCallback(false);
    }

    this.scheduleReconnect();
  }

  /**
   * 安排重连
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.warn('Max reconnection attempts reached');
      // 重置重连计数器，允许用户手动重新连接
      this.reconnectAttempts = 0;
    }
  }

  /**
   * 发送消息确认
   */
  private acknowledgeMessage(messageId: string, acknowledged: boolean) {
    if (!this.stompClient || !this.isConnected) {
      return;
    }

    try {
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
   * 发送消息（带重试机制）
   */
  private sendMessage(destination: string, body: any) {
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const messageBody = typeof body === 'string' ? body : JSON.stringify(body);

    if (!this.stompClient || !this.isConnected) {
      // 将消息加入待发送队列
      this.pendingMessages.set(messageId, {
        destination,
        body: messageBody,
        timestamp: Date.now(),
        retryCount: 0
      });
      console.log('Message queued for later sending:', messageId);
      return messageId;
    }

    try {
      this.stompClient.publish({
        destination,
        body: messageBody,
      });
      console.log('Message sent:', messageId);
      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      // 发送失败时也将消息加入待发送队列
      this.pendingMessages.set(messageId, {
        destination,
        body: messageBody,
        timestamp: Date.now(),
        retryCount: 0
      });
      return messageId;
    }
  }

  /**
   * 重试待发送的消息
   */
  private retryPendingMessages() {
    if (!this.stompClient || !this.isConnected) {
      return;
    }

    const maxRetries = 3;
    const now = Date.now();
    const timeout = 60000; // 60秒超时

    for (const [messageId, messageInfo] of this.pendingMessages.entries()) {
      // 检查是否超时
      if (now - messageInfo.timestamp > timeout) {
        this.pendingMessages.delete(messageId);
        continue;
      }

      // 检查重试次数
      if (messageInfo.retryCount >= maxRetries) {
        this.pendingMessages.delete(messageId);
        continue;
      }

      try {
        this.stompClient.publish({
          destination: messageInfo.destination,
          body: messageInfo.body,
        });
        console.log('Retried message:', messageId);

        // 发送成功，删除消息
        this.pendingMessages.delete(messageId);
      } catch (error) {
        console.error('Retry failed for message:', messageId, error);
        // 发送失败时更新重试次数
        this.pendingMessages.set(messageId, {
          ...messageInfo,
          retryCount: messageInfo.retryCount + 1
        });
      }
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
    // 清空待发送消息
    this.pendingMessages.clear();

    console.log('WebSocket disconnected');

    // 触发连接状态回调
    if (this.connectionCallback) {
      this.connectionCallback(false);
    }
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

  /**
   * 获取待发送消息数量
   */
  getPendingMessageCount(): number {
    return this.pendingMessages.size;
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats(): {
    isConnected: boolean;
    reconnectAttempts: number;
    pendingAcks: number;
    pendingMessages: number
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      pendingAcks: this.pendingAcks.size,
      pendingMessages: this.pendingMessages.size
    };
  }
}

// 创建单例实例
const webSocketService = new WebSocketService();

export default webSocketService;
