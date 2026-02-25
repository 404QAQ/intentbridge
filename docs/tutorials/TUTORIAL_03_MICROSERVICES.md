# 📚 IntentBridge 实战教程 - 微服务架构系统

**难度**: ⭐⭐⭐⭐☆ (高级)
**时间**: 60 分钟
**目标**: 从零开始构建一个完整的微服务架构系统

---

## 🎯 学习目标

通过这个教程，你将学会：

- ✅ 微服务架构设计和拆分
- ✅ 服务间通信（REST、gRPC、消息队列）
- ✅ API 网关设计
- ✅ 服务注册与发现
- ✅ 分布式配置管理
- ✅ 链路追踪和监控
- ✅ 容器编排（Docker Compose）
- ✅ 数据一致性（分布式事务）

---

## 📋 项目概述

### 微服务架构系统

**核心服务**:
- 🚪 API 网关（路由、限流、认证）
- 👤 用户服务（用户、认证、权限）
- 📦 商品服务（商品、分类、库存）
- 🛒 订单服务（订单、购物车）
- 💳 支付服务（支付、退款）
- 📢 通知服务（邮件、短信、推送）
- 🔍 搜索服务（Elasticsearch）
- 📊 分析服务（数据统计）

**基础设施**:
- 🗄️ PostgreSQL（多数据库）
- 🔴 Redis（缓存、分布式锁）
- 📨 RabbitMQ（消息队列）
- 🔍 Elasticsearch（搜索引擎）
- 📈 Prometheus + Grafana（监控）
- 🔗 Jaeger（链路追踪）
- ⚙️ Consul（服务注册与配置中心）

**技术栈**:
- 语言: Python (FastAPI) + Go (高性能服务)
- 通信: REST API + gRPC + RabbitMQ
- 部署: Docker Compose + Kubernetes (可选)
- 监控: Prometheus + Grafana + Jaeger

---

## ⏱️ 第 5 分钟: 初始化项目

### 步骤 1: 创建项目目录

```bash
mkdir microservices-platform
cd microservices-platform
```

### 步骤 2: 初始化 IntentBridge

```bash
ib init
```

### 步骤 3: 配置项目信息

```bash
ib "配置项目：微服务架构平台，包含 API 网关、用户服务、商品服务、订单服务、支付服务、通知服务、搜索服务、分析服务"
```

---

## ⏱️ 第 10 分钟: 添加核心需求

### 需求 1: API 网关服务

```bash
ib "添加 API 网关服务：
- 路由转发（动态路由、负载均衡）
- 限流熔断（令牌桶、漏桶算法）
- 认证授权（JWT、OAuth2.0）
- 日志记录（请求日志、响应日志）
- 监控指标（QPS、延迟、错误率）
- API 版本管理（v1、v2、v3）
技术: Kong / Nginx + Lua / 自研
优先级: high
标签: gateway, infrastructure"
```

### 需求 2: 用户服务

```bash
ib "添加用户服务：
- 用户注册（邮箱、手机号、第三方登录）
- 用户登录（JWT Token、刷新 Token）
- 用户信息（资料、头像、密码修改）
- 权限管理（RBAC、角色、权限）
- 服务间认证（服务Token、API Key）
技术: Python + FastAPI
优先级: high
标签: user, auth"
```

### 需求 3: 商品服务

```bash
ib "添加商品服务：
- 商品管理（CRUD、SKU、规格）
- 分类管理（树形结构）
- 库存管理（库存扣减、库存回滚）
- 商品搜索（Elasticsearch）
- 商品推荐（协同过滤）
技术: Go + Gin（高性能）
优先级: high
标签: product"
```

### 需求 4: 订单服务

```bash
ib "添加订单服务：
- 订单创建（库存检查、价格计算）
- 订单支付（支付状态、支付回调）
- 订单取消（库存回滚、退款）
- 订单查询（订单列表、订单详情）
- 分布式事务（Saga、TCC）
技术: Python + FastAPI
优先级: high
标签: order"
```

### 需求 5: 支付服务

```bash
ib "添加支付服务：
- 支付渠道（支付宝、微信、银联）
- 支付创建（支付单、支付参数）
- 支付回调（异步通知、签名验证）
- 支付查询（支付状态、支付详情）
- 退款管理（退款申请、退款处理）
技术: Python + FastAPI
优先级: high
标签: payment"
```

### 需求 6: 通知服务

```bash
ib "添加通知服务：
- 邮件通知（SMTP、模板邮件）
- 短信通知（阿里云、腾讯云）
- 站内信（消息列表、已读未读）
- 推送通知（极光、个推）
- 消息队列（异步发送、失败重试）
技术: Python + FastAPI + Celery
优先级: medium
标签: notification"
```

### 需求 7: 搜索服务

```bash
ib "添加搜索服务：
- 商品搜索（全文搜索、高亮）
- 搜索建议（自动补全、纠错）
- 搜索过滤（分类、价格、品牌）
- 搜索排序（相关性、销量、价格）
- 搜索统计（搜索词、点击率）
技术: Elasticsearch + Python
优先级: medium
标签: search"
```

### 需求 8: 分析服务

```bash
ib "添加分析服务：
- 用户分析（新增、活跃、留存）
- 商品分析（销量、库存、转化）
- 订单分析（GMV、客单价、转化率）
- 行为分析（PV、UV、点击流）
- 报表生成（日报、周报、月报）
技术: Python + FastAPI + ClickHouse
优先级: low
标签: analytics"
```

### 查看所有需求

```bash
ib ls
```

**输出**:
```
需求列表 (共 8 个)
━━━━━━━━━━━━━━━━━━━━━━

REQ-001  [active]  high    API 网关服务
REQ-002  [active]  high    用户服务
REQ-003  [active]  high    商品服务
REQ-004  [active]  high    订单服务
REQ-005  [active]  high    支付服务
REQ-006  [active]  medium  通知服务
REQ-007  [active]  medium  搜索服务
REQ-008  [active]  low     分析服务
```

---

## ⏱️ 第 15 分钟: AI 理解需求

### 让 AI 理解 API 网关需求

```bash
ib understand REQ-001
```

**AI 输出示例**:
```
🤖 AI 需求理解: REQ-001 - API 网关服务

## 功能分析

### 核心功能点

1. 路由转发
   - 动态路由: 根据路径前缀转发到不同服务
   - 负载均衡: 轮询、权重、最少连接
   - 健康检查: 定期检查服务健康状态
   - 路由规则: 支持正则表达式匹配

2. 限流熔断
   - 限流算法: 令牌桶、漏桶、滑动窗口
   - 熔断策略: 错误率、响应时间、并发数
   - 降级处理: 返回默认值、缓存数据
   - 限流维度: IP、用户、API、服务

3. 认证授权
   - JWT 认证: Token 验证、Token 刷新
   - OAuth2.0: 第三方登录、授权码流程
   - API Key: 服务间认证
   - 权限验证: RBAC、ABAC

4. 日志记录
   - 请求日志: 请求方法、路径、参数、IP
   - 响应日志: 响应状态、响应时间、响应大小
   - 错误日志: 错误信息、堆栈跟踪
   - 审计日志: 敏感操作、权限变更

5. 监控指标
   - QPS: 每秒请求数
   - 延迟: 平均延迟、P95、P99
   - 错误率: 4xx、5xx 错误率
   - 流量: 入流量、出流量

### 技术选型

**方案 1: Kong**
- 优点: 功能强大、插件丰富、性能好
- 缺点: 配置复杂、依赖 PostgreSQL/Cassandra

**方案 2: Nginx + Lua**
- 优点: 性能极高、配置灵活
- 缺点: 需要编写 Lua 脚本、维护成本高

**方案 3: 自研网关（Python + FastAPI）**
- 优点: 完全可控、易于定制
- 缺点: 性能不如 Nginx、需要自己实现所有功能

**推荐方案**: **Kong**（生产环境）或 **自研网关**（学习项目）

### 架构设计

```
客户端
  ↓
[API 网关]
  ├─ 认证中间件
  ├─ 限流中间件
  ├─ 日志中间件
  └─ 路由转发
      ↓
  ┌─────┴─────┬─────────┬─────────┐
  │           │         │         │
用户服务   商品服务  订单服务  支付服务
```

### API 设计

**网关统一入口**:
```
POST   /api/v1/auth/login          → 用户服务: /auth/login
GET    /api/v1/products            → 商品服务: /products
POST   /api/v1/orders              → 订单服务: /orders
POST   /api/v1/payments            → 支付服务: /payments
```

### 配置示例

**Kong 配置**:
```yaml
_format_version: "2.1"

services:
  - name: user-service
    url: http://user-service:8001
    routes:
      - name: user-route
        paths:
          - /api/v1/auth
          - /api/v1/users

  - name: product-service
    url: http://product-service:8002
    routes:
      - name: product-route
        paths:
          - /api/v1/products

plugins:
  - name: rate-limiting
    config:
      minute: 100
      policy: local

  - name: jwt
    config:
      secret_is_base64: false
```

**自研网关代码**:
```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import jwt
from typing import Dict

app = FastAPI()

# 服务注册表
SERVICES = {
    "user": "http://user-service:8001",
    "product": "http://product-service:8002",
    "order": "http://order-service:8003",
    "payment": "http://payment-service:8004",
}

# 路由规则
ROUTES = {
    "/api/v1/auth": "user",
    "/api/v1/users": "user",
    "/api/v1/products": "product",
    "/api/v1/orders": "order",
    "/api/v1/payments": "payment",
}

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    """认证中间件"""
    # 跳过登录接口
    if request.url.path == "/api/v1/auth/login":
        return await call_next(request)

    # 验证 JWT Token
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="未登录")

    try:
        payload = jwt.decode(token, "SECRET_KEY", algorithms=["HS256"])
        request.state.user_id = payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token 已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效 Token")

    return await call_next(request)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """限流中间件"""
    # TODO: 实现 Redis 令牌桶限流
    return await call_next(request)

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(request: Request, path: str):
    """路由转发"""
    # 匹配路由规则
    target_service = None
    for route_prefix, service_name in ROUTES.items():
        if f"/{path}".startswith(route_prefix):
            target_service = service_name
            break

    if not target_service:
        raise HTTPException(status_code=404, detail="路由不存在")

    # 转发请求
    service_url = SERVICES[target_service]
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=request.method,
            url=f"{service_url}/{path}",
            headers=request.headers,
            content=await request.body()
        )

    return response
```

### 验收标准

- ✅ 支持动态路由转发
- ✅ 支持 JWT 认证
- ✅ 支持限流熔断
- ✅ 支持日志记录
- ✅ 支持监控指标
- ✅ 高可用（健康检查、故障转移）

### 建议实现步骤

1. 选择网关方案（Kong 或自研）
2. 实现基础路由转发
3. 实现认证中间件
4. 实现限流中间件
5. 实现日志中间件
6. 集成 Prometheus 监控
7. 编写单元测试
8. 压力测试和性能优化
```

### 理解其他服务需求

```bash
ib understand REQ-002  # 用户服务
ib understand REQ-003  # 商品服务
ib understand REQ-004  # 订单服务
ib understand REQ-005  # 支付服务
ib understand REQ-006  # 通知服务
ib understand REQ-007  # 搜索服务
ib understand REQ-008  # 分析服务
```

---

## ⏱️ 第 20 分钟: 设计微服务架构

### 服务拆分原则

```bash
ib "设计微服务拆分原则：
- 业务边界清晰
- 数据独立（每个服务独立数据库）
- 接口标准（REST API + gRPC）
- 服务自治（独立部署、独立扩展）
- 故障隔离（服务降级、熔断）
标签: architecture"
```

### 服务通信方式

**1. 同步通信（REST API）**:
```
用户服务 → 商品服务: GET /api/v1/products/:id
订单服务 → 用户服务: GET /api/v1/users/:id
```

**2. 异步通信（消息队列）**:
```
订单服务 → RabbitMQ: 订单创建事件
库存服务 ← RabbitMQ: 订阅订单创建事件
通知服务 ← RabbitMQ: 订阅订单创建事件
```

**3. 高性能通信（gRPC）**:
```
商品服务 → 搜索服务: gRPC 调用（批量索引）
分析服务 → 订单服务: gRPC 流式传输（数据同步）
```

### 数据一致性方案

**分布式事务 - Saga 模式**:
```
订单创建流程:
1. 订单服务: 创建订单（pending）
2. 库存服务: 扣减库存
   ↓ 成功
3. 支付服务: 创建支付单
   ↓ 成功
4. 订单服务: 更新订单状态（paid）

补偿流程（失败回滚）:
4. 支付服务: 取消支付单
3. 库存服务: 回滚库存
2. 订单服务: 取消订单
```

---

## ⏱️ 第 25 分钟: 实现第一个微服务

### 开始实现用户服务

```bash
ib done REQ-002
```

### 创建项目结构

```bash
# 创建服务目录
mkdir -p services/{user-service,product-service,order-service,payment-service}

# 创建用户服务结构
mkdir -p services/user-service/{app/{api,models,schemas,services,core},tests}

# 创建共享库
mkdir -p shared/{utils,middleware,config}
```

### 添加文件映射

```bash
ib map add REQ-002 \
  services/user-service/app/main.py \
  services/user-service/app/api/auth.py \
  services/user-service/app/models/user.py \
  services/user-service/app/services/auth_service.py \
  services/user-service/Dockerfile \
  services/user-service/requirements.txt
```

### 实现用户服务

**services/user-service/app/main.py**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, users
from app.core.database import engine, Base
from app.core.config import settings

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="User Service",
    description="用户服务 - 处理用户注册、登录、权限管理",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/auth", tags=["认证"])
app.include_router(users.router, prefix="/users", tags=["用户"])

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "service": "user-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

**services/user-service/app/api/auth.py**:
```python
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, Token
from app.services.auth_service import AuthService
from datetime import timedelta

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    service = AuthService(db)

    # 检查用户是否存在
    if service.get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    # 创建用户
    db_user = service.create_user(user)

    # 生成 Token
    access_token = service.create_access_token(
        data={"user_id": db_user.id},
        expires_delta=timedelta(hours=24)
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    service = AuthService(db)

    # 验证用户
    db_user = service.authenticate_user(user.email, user.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    # 生成 Token
    access_token = service.create_access_token(
        data={"user_id": db_user.id},
        expires_delta=timedelta(hours=24)
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh")
async def refresh_token():
    """刷新 Token"""
    # TODO: 实现 Token 刷新
    pass
```

**services/user-service/app/services/auth_service.py**:
```python
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User:
        """根据邮箱获取用户"""
        return self.db.query(User).filter(User.email == email).first()

    def create_user(self, user: UserCreate) -> User:
        """创建用户"""
        hashed_password = pwd_context.hash(user.password)
        db_user = User(
            email=user.email,
            username=user.username,
            hashed_password=hashed_password
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def authenticate_user(self, email: str, password: str) -> User:
        """验证用户"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not pwd_context.verify(password, user.hashed_password):
            return None
        return user

    def create_access_token(self, data: dict, expires_delta: timedelta):
        """生成 JWT Token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt
```

---

## ⏱️ 第 30 分钟: 实现服务间通信

### 实现 HTTP 客户端

**shared/utils/http_client.py**:
```python
import httpx
from typing import Dict, Any, Optional

class HttpClient:
    """HTTP 客户端 - 用于服务间通信"""

    def __init__(self, base_url: str, timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

    async def get(self, path: str, params: Dict = None) -> Dict:
        """GET 请求"""
        response = await self.client.get(
            f"{self.base_url}{path}",
            params=params
        )
        response.raise_for_status()
        return response.json()

    async def post(self, path: str, data: Dict = None) -> Dict:
        """POST 请求"""
        response = await self.client.post(
            f"{self.base_url}{path}",
            json=data
        )
        response.raise_for_status()
        return response.json()

    async def close(self):
        """关闭客户端"""
        await self.client.aclose()
```

### 实现消息队列

**shared/utils/message_queue.py**:
```python
import aio_pika
import json
from typing import Callable, Dict

class MessageQueue:
    """消息队列 - RabbitMQ 封装"""

    def __init__(self, url: str = "amqp://guest:guest@localhost/"):
        self.url = url
        self.connection = None
        self.channel = None

    async def connect(self):
        """连接 RabbitMQ"""
        self.connection = await aio_pika.connect_robust(self.url)
        self.channel = await self.connection.channel()

    async def publish(self, queue_name: str, message: Dict):
        """发布消息"""
        await self.channel.default_exchange.publish(
            aio_pika.Message(body=json.dumps(message).encode()),
            routing_key=queue_name
        )

    async def consume(self, queue_name: str, callback: Callable):
        """消费消息"""
        queue = await self.channel.declare_queue(queue_name, durable=True)

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    data = json.loads(message.body)
                    await callback(data)

    async def close(self):
        """关闭连接"""
        if self.connection:
            await self.connection.close()
```

### 使用示例

**订单服务调用用户服务**:
```python
from shared.utils.http_client import HttpClient

async def get_user_info(user_id: int):
    """获取用户信息"""
    client = HttpClient("http://user-service:8001")
    try:
        user = await client.get(f"/users/{user_id}")
        return user
    finally:
        await client.close()
```

**订单服务发布事件**:
```python
from shared.utils.message_queue import MessageQueue

async def publish_order_created(order_id: int):
    """发布订单创建事件"""
    mq = MessageQueue()
    await mq.connect()
    try:
        await mq.publish("order.created", {
            "order_id": order_id,
            "event": "created",
            "timestamp": datetime.now().isoformat()
        })
    finally:
        await mq.close()
```

---

## ⏱️ 第 35 分钟: 实现分布式配置

### 使用 Consul 配置中心

**shared/config/consul_config.py**:
```python
import consul
import json
from typing import Dict, Any

class ConsulConfig:
    """Consul 配置中心"""

    def __init__(self, host: str = "localhost", port: int = 8500):
        self.client = consul.Consul(host=host, port=port)

    def get_config(self, key: str) -> Dict[str, Any]:
        """获取配置"""
        index, data = self.client.kv.get(key)
        if data:
            return json.loads(data['Value'])
        return {}

    def set_config(self, key: str, value: Dict[str, Any]):
        """设置配置"""
        self.client.kv.put(key, json.dumps(value))

    def watch_config(self, key: str, callback):
        """监听配置变化"""
        index = None
        while True:
            index, data = self.client.kv.get(key, index=index)
            if data:
                config = json.loads(data['Value'])
                callback(config)
```

### 服务注册与发现

**shared/utils/service_discovery.py**:
```python
import consul
from typing import List, Dict

class ServiceDiscovery:
    """服务注册与发现"""

    def __init__(self, consul_host: str = "localhost"):
        self.client = consul.Consul(host=consul_host)

    def register_service(
        self,
        service_name: str,
        service_id: str,
        address: str,
        port: int,
        tags: List[str] = None
    ):
        """注册服务"""
        self.client.agent.service.register(
            name=service_name,
            service_id=service_id,
            address=address,
            port=port,
            tags=tags or [],
            check=consul.Check.http(
                f"http://{address}:{port}/health",
                interval="10s",
                timeout="5s"
            )
        )

    def deregister_service(self, service_id: str):
        """注销服务"""
        self.client.agent.service.deregister(service_id)

    def discover_service(self, service_name: str) -> Dict:
        """发现服务"""
        services = self.client.health.service(service_name, passing=True)
        if services:
            service = services[1][0]['Service']
            return {
                "address": service['Address'],
                "port": service['Port']
            }
        return None
```

### 使用示例

**服务启动时注册**:
```python
from shared.utils.service_discovery import ServiceDiscovery

@app.on_event("startup")
async def startup_event():
    """服务启动"""
    # 注册服务
    discovery = ServiceDiscovery()
    discovery.register_service(
        service_name="user-service",
        service_id="user-service-1",
        address="localhost",
        port=8001,
        tags=["auth", "user"]
    )

@app.on_event("shutdown")
async def shutdown_event():
    """服务关闭"""
    # 注销服务
    discovery = ServiceDiscovery()
    discovery.deregister_service("user-service-1")
```

**服务调用时发现**:
```python
from shared.utils.service_discovery import ServiceDiscovery
from shared.utils.http_client import HttpClient

async def call_product_service(product_id: int):
    """调用商品服务"""
    discovery = ServiceDiscovery()

    # 发现服务
    service = discovery.discover_service("product-service")
    if not service:
        raise Exception("商品服务不可用")

    # 调用服务
    client = HttpClient(f"http://{service['address']}:{service['port']}")
    try:
        product = await client.get(f"/products/{product_id}")
        return product
    finally:
        await client.close()
```

---

## ⏱️ 第 40 分钟: 实现链路追踪

### 使用 Jaeger 链路追踪

**shared/utils/tracing.py**:
```python
from jaeger_client import Config
from opentracing import tracer, Span
from functools import wraps

def init_tracer(service_name: str):
    """初始化 Jaeger Tracer"""
    config = Config(
        config={
            'sampler': {'type': 'const', 'param': 1},
            'logging': True,
        },
        service_name=service_name,
    )
    return config.initialize_tracer()

def trace(operation_name: str):
    """链路追踪装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            with tracer.start_span(operation_name) as span:
                span.set_tag('function', func.__name__)
                span.log_kv({'args': str(args), 'kwargs': str(kwargs)})
                try:
                    result = await func(*args, **kwargs)
                    span.set_tag('status', 'success')
                    return result
                except Exception as e:
                    span.set_tag('status', 'error')
                    span.log_kv({'error': str(e)})
                    raise
        return wrapper
    return decorator
```

### 使用示例

```python
from shared.utils.tracing import trace

@trace("get_user_info")
async def get_user_info(user_id: int):
    """获取用户信息"""
    # 业务逻辑
    pass

@trace("create_order")
async def create_order(order_data: dict):
    """创建订单"""
    # 业务逻辑
    pass
```

---

## ⏱️ 第 45 分钟: 实现 Docker Compose 编排

### 创建 Docker Compose

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  # API 网关
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - CONSUL_URL=http://consul:8500
      - JAEGER_URL=http://jaeger:14268/api/traces
    depends_on:
      - consul
      - jaeger
    networks:
      - microservices-network

  # 用户服务
  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres-user:5432/user_db
      - REDIS_URL=redis://redis:6379/0
      - CONSUL_URL=http://consul:8500
      - JAEGER_URL=http://jaeger:14268/api/traces
    depends_on:
      - postgres-user
      - redis
      - consul
    networks:
      - microservices-network

  # 商品服务
  product-service:
    build:
      context: ./services/product-service
      dockerfile: Dockerfile
    ports:
      - "8002:8002"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres-product:5432/product_db
      - REDIS_URL=redis://redis:6379/1
      - CONSUL_URL=http://consul:8500
    depends_on:
      - postgres-product
      - redis
      - consul
    networks:
      - microservices-network

  # 订单服务
  order-service:
    build:
      context: ./services/order-service
      dockerfile: Dockerfile
    ports:
      - "8003:8003"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres-order:5432/order_db
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq/
      - CONSUL_URL=http://consul:8500
    depends_on:
      - postgres-order
      - rabbitmq
      - consul
    networks:
      - microservices-network

  # PostgreSQL (用户服务)
  postgres-user:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=user_db
    volumes:
      - postgres-user-data:/var/lib/postgresql/data
    networks:
      - microservices-network

  # PostgreSQL (商品服务)
  postgres-product:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=product_db
    volumes:
      - postgres-product-data:/var/lib/postgresql/data
    networks:
      - microservices-network

  # PostgreSQL (订单服务)
  postgres-order:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=order_db
    volumes:
      - postgres-order-data:/var/lib/postgresql/data
    networks:
      - microservices-network

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - microservices-network

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - microservices-network

  # Consul (服务注册与配置中心)
  consul:
    image: consul:latest
    ports:
      - "8500:8500"
    networks:
      - microservices-network

  # Jaeger (链路追踪)
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"
    networks:
      - microservices-network

  # Prometheus (监控)
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - microservices-network

  # Grafana (可视化)
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - microservices-network

volumes:
  postgres-user-data:
  postgres-product-data:
  postgres-order-data:
  grafana-data:

networks:
  microservices-network:
    driver: bridge
```

---

## ⏱️ 第 50 分钟: 实现监控和日志

### Prometheus 配置

**monitoring/prometheus.yml**:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8000']

  - job_name: 'user-service'
    static_configs:
      - targets: ['user-service:8001']

  - job_name: 'product-service'
    static_configs:
      - targets: ['product-service:8002']

  - job_name: 'order-service'
    static_configs:
      - targets: ['order-service:8003']

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### 日志收集

**shared/utils/logger.py**:
```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """JSON 格式日志"""

    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "service": record.__dict__.get("service", "unknown"),
            "trace_id": record.__dict__.get("trace_id", ""),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_logger(service_name: str):
    """设置日志"""
    logger = logging.getLogger(service_name)
    logger.setLevel(logging.INFO)

    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    return logger
```

---

## ⏱️ 第 55 分钟: 验证实现

### AI 验证微服务架构

```bash
ib validate REQ-001 --with-code
```

**AI 输出示例**:
```
🔍 AI 验证: REQ-001 - API 网关服务

## 验证结果

### 功能完整性: ✅ 95%
- ✅ 路由转发功能已实现
- ✅ 认证授权功能已实现
- ✅ 限流熔断功能已实现
- ✅ 日志记录功能已实现
- ✅ 监控指标功能已实现
- ✅ 服务注册与发现已实现

### 代码质量: ✅ 92%
- ✅ 代码结构清晰
- ✅ 类型定义完整
- ✅ 错误处理完善
- ✅ 有单元测试

### 架构合理性: ✅ 95%
- ✅ 服务拆分合理
- ✅ 通信方式选择恰当
- ✅ 数据一致性方案完善
- ✅ 容错机制健全

## 改进建议

1. 添加 API 文档（Swagger）
2. 补充性能测试
3. 添加安全测试

总体评分: 94/100 ✅ 通过
```

### 验证其他服务

```bash
ib validate REQ-002  # 用户服务
ib validate REQ-003  # 商品服务
ib validate REQ-004  # 订单服务
ib validate REQ-005  # 支付服务
ib validate REQ-006  # 通知服务
ib validate REQ-007  # 搜索服务
ib validate REQ-008  # 分析服务
```

---

## ⏱️ 第 60 分钟: 项目总结

### 查看项目状态

```bash
ib status
```

**输出**:
```
项目状态: 微服务架构平台
━━━━━━━━━━━━━━━━━━━━━━

需求总数: 8
  ✅ 已完成: 8
  🔄 进行中: 0
  ⏳ 待开发: 0

文件映射: 120 个文件
  服务: 80 个
  基础设施: 30 个
  共享库: 10 个

最近活动:
  2026-02-24 16:30  验证 REQ-008 通过 (91分)
  2026-02-24 16:25  验证 REQ-007 通过 (92分)
  2026-02-24 16:20  验证 REQ-006 通过 (93分)
  2026-02-24 16:15  验证 REQ-005 通过 (94分)
  2026-02-24 16:10  验证 REQ-004 通过 (92分)
  2026-02-24 16:05  验证 REQ-003 通过 (93分)
  2026-02-24 16:00  验证 REQ-002 通过 (94分)
  2026-02-24 15:55  验证 REQ-001 通过 (94分)
```

### 启动项目

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 访问服务
curl http://localhost:8000/health

# 访问 Consul UI
open http://localhost:8500

# 访问 Jaeger UI
open http://localhost:16686

# 访问 Grafana
open http://localhost:3000
```

### 导出项目报告

```bash
ib req export --format markdown
```

---

## 📊 学习总结

### 你学会了

1. **微服务架构设计** ✅
   - 服务拆分原则
   - 服务边界定义
   - 数据独立性

2. **服务间通信** ✅
   - REST API 同步通信
   - RabbitMQ 异步通信
   - gRPC 高性能通信

3. **分布式系统** ✅
   - 服务注册与发现
   - 分布式配置管理
   - 链路追踪
   - 分布式事务（Saga）

4. **DevOps 实践** ✅
   - Docker 容器化
   - Docker Compose 编排
   - 监控和日志
   - CI/CD（可选）

### 架构图

```
┌────────────────────────────────────────────┐
│             客户端 / 前端                   │
└────────────────┬───────────────────────────┘
                 │
         ┌───────▼────────┐
         │   API 网关     │
         │  (路由/认证)   │
         └───────┬────────┘
                 │
    ┌────────────┼────────────┬────────────┐
    │            │            │            │
┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
│用户   │   │商品   │   │订单   │   │支付   │
│服务   │   │服务   │   │服务   │   │服务   │
└───┬───┘   └───┬───┘   └───┬───┘   └───┬───┘
    │           │           │           │
    └───────────┴───────────┴───────────┘
                 │
         ┌───────▼────────┐
         │  RabbitMQ      │
         │  (消息队列)    │
         └────────────────┘

基础设施:
  - Consul (服务注册与配置)
  - Jaeger (链路追踪)
  - Prometheus + Grafana (监控)
  - PostgreSQL (数据库)
  - Redis (缓存)
  - Elasticsearch (搜索)
```

### 下一步

- 📚 **Kubernetes 部署教程** - 学习 K8s 编排
- 📚 **服务网格教程** - 学习 Istio / Linkerd
- 📚 **性能优化教程** - 学习微服务性能调优

---

## 🎯 实践练习

### 练习 1: 添加日志聚合

```bash
ib "添加 ELK Stack 日志聚合系统，收集所有服务的日志"
```

### 练习 2: 添加服务网格

```bash
ib "使用 Istio 实现服务网格，提供流量管理、安全、可观测性"
```

### 练习 3: 添加 CI/CD

```bash
ib "添加 GitHub Actions CI/CD 流水线，自动化测试和部署"
```

---

## 📚 相关资源

- **快速入门**: [QUICK_START_5MIN.md](../QUICK_START_5MIN.md)
- **电商教程**: [TUTORIAL_02_ECOMMERCE.md](TUTORIAL_02_ECOMMERCE.md)
- **故障排查**: [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- **优化计划**: [../OPTIMIZATION_PLAN.md](../OPTIMIZATION_PLAN.md)
- **命令参考**: [../../README.md](../../README.md)

---

**教程完成！** 🎉

你已经学会了使用 IntentBridge 从零开始构建完整的微服务架构系统。

**恭喜你完成了所有三个实战教程！** 🎊
