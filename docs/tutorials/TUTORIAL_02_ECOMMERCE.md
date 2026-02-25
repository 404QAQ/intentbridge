# 📚 IntentBridge 实战教程 - 电商后台管理系统

**难度**: ⭐⭐⭐☆☆ (进阶级)
**时间**: 45 分钟
**目标**: 构建一个完整的电商后台管理系统

---

## 🎯 学习目标

通过这个教程，你将学会：

- ✅ 管理复杂的电商业务需求
- ✅ 多模块系统设计和协调
- ✅ 权限管理和角色控制
- ✅ 数据统计和可视化
- ✅ 文件上传和图片处理
- ✅ 批量操作和数据导入导出

---

## 📋 项目概述

### 电商后台管理系统功能

**核心模块**:
- 📦 商品管理（分类、SKU、库存）
- 🛒 订单管理（订单流程、退款、物流）
- 👥 用户管理（客户、权限、角色）
- 📊 数据统计（销售、流量、转化）
- 💰 营销活动（优惠券、秒杀、满减）
- 📝 内容管理（轮播图、公告、帮助）

**技术栈**:
- 前端: Vue 3 + TypeScript + Element Plus
- 后端: Python + FastAPI
- 数据库: PostgreSQL
- 缓存: Redis
- 存储: MinIO
- 部署: Docker Compose

---

## ⏱️ 第 5 分钟: 初始化项目

### 步骤 1: 创建项目目录

```bash
mkdir ecommerce-admin
cd ecommerce-admin
```

### 步骤 2: 初始化 IntentBridge

```bash
ib init
```

### 步骤 3: 配置项目信息

```bash
ib "配置项目：电商后台管理系统，使用 Vue3 + FastAPI + PostgreSQL + Redis + MinIO"
```

---

## ⏱️ 第 10 分钟: 添加核心需求

### 需求 1: 商品管理

```bash
ib "添加商品管理功能：
- 商品列表（搜索、筛选、排序）
- 商品分类（树形结构、拖拽排序）
- 商品详情（基础信息、SKU、规格参数）
- 库存管理（库存预警、库存日志）
- 商品审核（上架、下架、审核流程）
- 图片管理（主图、详情图、规格图）
优先级: high
标签: product, core"
```

**IntentBridge 输出**:
```
✅ 创建需求: REQ-001
标题: 商品管理系统
优先级: high
标签: product, core, backend, frontend
子需求:
  - REQ-001-1: 商品列表
  - REQ-001-2: 商品分类
  - REQ-001-3: 商品详情
  - REQ-001-4: 库存管理
  - REQ-001-5: 商品审核
  - REQ-001-6: 图片管理
```

### 需求 2: 订单管理

```bash
ib "添加订单管理功能：
- 订单列表（多状态、搜索、筛选）
- 订单详情（商品、物流、支付）
- 订单流程（待付款、待发货、已发货、已完成、已取消）
- 退款管理（退款申请、审核、处理）
- 物流跟踪（快递公司、物流单号、轨迹查询）
- 订单导出（Excel、CSV）
优先级: high
标签: order, core"
```

### 需求 3: 用户管理

```bash
ib "添加用户管理功能：
- 用户列表（搜索、筛选、封禁）
- 用户详情（基础信息、订单历史、积分）
- 权限管理（RBAC、角色、权限）
- 管理员管理（账号、权限、操作日志）
- 用户标签（自动打标、手动打标）
优先级: high
标签: user, core, auth"
```

### 需求 4: 数据统计

```bash
ib "添加数据统计功能：
- 销售统计（GMV、订单量、客单价）
- 商品统计（销量排行、库存预警）
- 用户统计（新增、活跃、留存）
- 流量统计（PV、UV、转化率）
- 数据图表（折线图、柱状图、饼图）
- 报表导出（日报、周报、月报）
优先级: medium
标签: analytics, dashboard"
```

### 需求 5: 营销活动

```bash
ib "添加营销活动功能：
- 优惠券管理（创建、发放、核销）
- 秒杀活动（时间段、库存、限购）
- 满减活动（满减规则、自动计算）
- 拼团活动（开团、参团、成团）
- 活动统计（参与人数、转化率）
优先级: medium
标签: marketing"
```

### 需求 6: 内容管理

```bash
ib "添加内容管理功能：
- 轮播图管理（位置、排序、跳转）
- 公告管理（发布、置顶、过期）
- 帮助中心（分类、文章、搜索）
- 富文本编辑器支持
优先级: low
标签: cms"
```

### 查看所有需求

```bash
ib ls
```

**输出**:
```
需求列表 (共 6 个)
━━━━━━━━━━━━━━━━━━━━━━

REQ-001  [active]  high    商品管理系统 (6 子需求)
REQ-002  [active]  high    订单管理系统
REQ-003  [active]  high    用户管理系统
REQ-004  [active]  medium  数据统计系统
REQ-005  [active]  medium  营销活动系统
REQ-006  [active]  low     内容管理系统
```

---

## ⏱️ 第 15 分钟: AI 理解需求

### 让 AI 理解商品管理需求

```bash
ib understand REQ-001
```

**AI 输出示例**:
```
🤖 AI 需求理解: REQ-001 - 商品管理系统

## 功能分析

### 核心功能点

1. 商品列表
   - 搜索: 商品名、SKU、分类
   - 筛选: 状态、分类、价格区间
   - 排序: 创建时间、销量、价格
   - 分页: 每页 20 条

2. 商品分类
   - 树形结构: 支持多级分类
   - 拖拽排序: 前端拖拽调整顺序
   - 分类图标: 支持上传图片
   - SEO 优化: 分类标题、描述、关键词

3. 商品详情
   - 基础信息: 名称、描述、分类、品牌
   - SKU 管理: 规格、价格、库存、SKU 编码
   - 规格参数: 自定义规格参数模板
   - 关联商品: 推荐商品、关联配件

4. 库存管理
   - 库存预警: 低库存提醒（阈值可配置）
   - 库存日志: 记录所有库存变动
   - 批量调整: 支持批量修改库存
   - 库存锁定: 订单创建时锁定库存

5. 商品审核
   - 审核流程: 草稿 → 待审核 → 已上架/已拒绝
   - 审核记录: 记录审核人和审核意见
   - 批量审核: 支持批量上架/下架
   - 定时上架: 支持定时自动上架

6. 图片管理
   - 主图: 商品主图（1 张）
   - 详情图: 商品详情图（多张）
   - 规格图: SKU 规格图
   - 图片压缩: 自动压缩优化
   - 图片水印: 可选添加水印

### 技术要求

**数据库设计**:
```sql
-- 商品表
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  brand_id INTEGER REFERENCES brands(id),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SKU 表
CREATE TABLE product_skus (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  sku_code VARCHAR(100) UNIQUE NOT NULL,
  specs JSONB, -- {"颜色": "红色", "尺寸": "XL"}
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT
);

-- 分类表
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  level INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  icon_url TEXT
);
```

**API 端点**:
```
GET    /api/products           # 商品列表
POST   /api/products           # 创建商品
GET    /api/products/:id       # 商品详情
PUT    /api/products/:id       # 更新商品
DELETE /api/products/:id       # 删除商品
POST   /api/products/:id/audit # 审核商品

GET    /api/categories         # 分类列表（树形）
POST   /api/categories         # 创建分类
PUT    /api/categories/:id     # 更新分类
DELETE /api/categories/:id     # 删除分类

GET    /api/skus               # SKU 列表
PUT    /api/skus/:id/stock     # 更新库存
```

### 验收标准

- ✅ 用户可以创建、编辑、删除商品
- ✅ 商品支持多级分类
- ✅ 商品支持多 SKU
- ✅ 库存变动有日志记录
- ✅ 商品可以上架、下架、审核
- ✅ 支持图片上传和管理
- ✅ 支持商品搜索和筛选
- ✅ 支持批量操作

### 建议实现步骤

1. 设计数据库模型（Product, SKU, Category, Brand）
2. 实现分类管理 API（树形结构）
3. 实现商品 CRUD API
4. 实现 SKU 管理 API
5. 实现库存管理 API
6. 实现图片上传 API（MinIO）
7. 实现商品审核流程
8. 创建前端商品列表页
9. 创建前端商品表单页
10. 创建前端分类管理页
```

### 理解其他需求

```bash
ib understand REQ-002  # 订单管理
ib understand REQ-003  # 用户管理
ib understand REQ-004  # 数据统计
ib understand REQ-005  # 营销活动
ib understand REQ-006  # 内容管理
```

---

## ⏱️ 第 20 分钟: 设计技术架构

### 系统架构设计

```bash
ib "设计技术架构：
- 前端: Vue 3 + TypeScript + Element Plus + Pinia
- 后端: Python + FastAPI + SQLAlchemy
- 数据库: PostgreSQL（主库） + Redis（缓存）
- 存储: MinIO（对象存储）
- 搜索: Elasticsearch（商品搜索）
- 消息队列: RabbitMQ（异步任务）
- 部署: Docker Compose + Nginx
标签: architecture"
```

### 数据库设计

**核心表**:
- `users` - 用户表
- `roles` - 角色表
- `permissions` - 权限表
- `products` - 商品表
- `categories` - 分类表
- `product_skus` - SKU 表
- `orders` - 订单表
- `order_items` - 订单明细表
- `coupons` - 优惠券表
- `banners` - 轮播图表

### API 设计

**RESTful API**:
```
/api/v1/auth       # 认证相关
/api/v1/users      # 用户管理
/api/v1/products   # 商品管理
/api/v1/orders     # 订单管理
/api/v1/coupons    # 优惠券管理
/api/v1/analytics  # 数据统计
/api/v1/cms        # 内容管理
```

---

## ⏱️ 第 25 分钟: 实现第一个模块

### 开始实现商品管理

```bash
ib done REQ-001
```

### 创建项目结构

```bash
# 创建后端目录
mkdir -p backend/{app/{api,models,schemas,services,core},tests}

# 创建前端目录
mkdir -p frontend/{src/{views,components,api,stores},public}

# 创建部署目录
mkdir -p deployment/{docker,nginx}
```

### 添加文件映射

```bash
ib map add REQ-001 \
  backend/app/models/product.py \
  backend/app/models/category.py \
  backend/app/api/products.py \
  backend/app/schemas/product.py \
  backend/app/services/product_service.py \
  frontend/src/views/ProductList.vue \
  frontend/src/views/ProductForm.vue \
  frontend/src/api/products.ts
```

### 实现商品模型

**backend/app/models/product.py**:
```python
from sqlalchemy import Column, Integer, String, Text, Decimal, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class ProductStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"
    INACTIVE = "inactive"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    status = Column(Enum(ProductStatus), default=ProductStatus.DRAFT)

    # Relationships
    category = relationship("Category", back_populates="products")
    skus = relationship("ProductSKU", back_populates="product")

    class Config:
        orm_mode = True

class ProductSKU(Base):
    __tablename__ = "product_skus"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    sku_code = Column(String(100), unique=True, nullable=False)
    specs = Column(JSON)  # {"颜色": "红色", "尺寸": "XL"}
    price = Column(Decimal(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(Text)

    product = relationship("Product", back_populates="skus")
```

### 实现商品 API

**backend/app/api/products.py**:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.product_service import ProductService

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = 20,
    category_id: int = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """获取商品列表"""
    service = ProductService(db)
    return service.list_products(skip, limit, category_id, status)

@router.post("/", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    """创建商品"""
    service = ProductService(db)
    return service.create_product(product)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """获取商品详情"""
    service = ProductService(db)
    product = service.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db)
):
    """更新商品"""
    service = ProductService(db)
    return service.update_product(product_id, product)
```

### 实现前端页面

**frontend/src/views/ProductList.vue**:
```vue
<template>
  <div class="product-list">
    <el-card>
      <template #header>
        <div class="header">
          <span>商品列表</span>
          <el-button type="primary" @click="handleAdd">添加商品</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-cascader
            v-model="searchForm.category_id"
            :options="categories"
            :props="{ checkStrictly: true }"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已上架" value="active" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>

      <!-- 商品表格 -->
      <el-table :data="products" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="category.name" label="分类" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        @current-change="fetchProducts"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getProducts } from '@/api/products'

const products = ref([])
const loading = ref(false)
const categories = ref([])

const searchForm = ref({
  name: '',
  category_id: null,
  status: ''
})

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await getProducts({
      skip: (pagination.value.page - 1) * pagination.value.pageSize,
      limit: pagination.value.pageSize,
      ...searchForm.value
    })
    products.value = res.items
    pagination.value.total = res.total
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  const types = {
    draft: 'info',
    pending: 'warning',
    active: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    draft: '草稿',
    pending: '待审核',
    active: '已上架',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

onMounted(() => {
  fetchProducts()
})
</script>
```

---

## ⏱️ 第 30 分钟: 实现 Docker 配置

### 创建 Docker Compose

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  # 前端
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - ecommerce-network

  # 后端
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/ecommerce
      - REDIS_URL=redis://redis:6379/0
      - MINIO_URL=http://minio:9000
    depends_on:
      - postgres
      - redis
      - minio
    networks:
      - ecommerce-network

  # PostgreSQL
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=ecommerce
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - ecommerce-network

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - ecommerce-network

  # MinIO (对象存储)
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=admin
      - MINIO_ROOT_PASSWORD=password
    volumes:
      - minio-data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - ecommerce-network

volumes:
  postgres-data:
  minio-data:

networks:
  ecommerce-network:
    driver: bridge
```

### 创建后端 Dockerfile

**backend/Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 运行
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 创建前端 Dockerfile

**frontend/Dockerfile**:
```dockerfile
# 构建阶段
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## ⏱️ 第 35 分钟: 验证实现

### AI 验证商品管理模块

```bash
ib validate REQ-001 --with-code
```

**AI 输出示例**:
```
🔍 AI 验证: REQ-001 - 商品管理系统

## 验证结果

### 功能完整性: ✅ 92%
- ✅ 商品列表功能已实现
- ✅ 商品分类功能已实现
- ✅ 商品详情功能已实现
- ✅ SKU 管理功能已实现
- ✅ 库存管理功能已实现
- ⚠️  图片管理功能未完全实现（缺少水印功能）

### 代码质量: ✅ 90%
- ✅ 代码结构清晰
- ✅ 类型定义完整
- ✅ 错误处理完善
- ⚠️  缺少单元测试

### 验收标准: ✅ 90%
- ✅ 用户可以创建、编辑、删除商品
- ✅ 商品支持多级分类
- ✅ 商品支持多 SKU
- ✅ 库存变动有日志记录
- ✅ 商品可以上架、下架、审核
- ⚠️  图片水印功能未实现

## 改进建议

1. 添加图片水印功能
2. 补充单元测试
3. 优化商品搜索性能（添加 Elasticsearch）

总体评分: 91/100 ✅ 通过
```

### 根据建议改进

```bash
# 添加图片水印需求
ib "为商品图片添加水印功能，支持配置水印文字、位置、透明度"

# 添加测试需求
ib "为商品管理模块添加单元测试，覆盖率要求 80% 以上"
```

---

## ⏱️ 第 40 分钟: 实现其他模块

### 快速实现剩余模块

```bash
# 实现订单管理
ib done REQ-002
# ... 编写代码 ...

# 实现用户管理
ib done REQ-003
# ... 编写代码 ...

# 实现数据统计
ib done REQ-004
# ... 编写代码 ...

# 实现营销活动
ib done REQ-005
# ... 编写代码 ...

# 实现内容管理
ib done REQ-006
# ... 编写代码 ...
```

---

## ⏱️ 第 45 分钟: 项目总结

### 查看项目状态

```bash
ib status
```

**输出**:
```
项目状态: 电商后台管理系统
━━━━━━━━━━━━━━━━━━━━━━

需求总数: 6
  ✅ 已完成: 6
  🔄 进行中: 0
  ⏳ 待开发: 0

文件映射: 45 个文件
  后端: 25 个
  前端: 20 个

最近活动:
  2026-02-24 14:30  验证 REQ-006 通过 (90分)
  2026-02-24 14:25  验证 REQ-005 通过 (91分)
  2026-02-24 14:20  验证 REQ-004 通过 (93分)
  2026-02-24 14:15  验证 REQ-003 通过 (92分)
  2026-02-24 14:10  验证 REQ-002 通过 (91分)
  2026-02-24 14:05  验证 REQ-001 通过 (91分)
```

### 导出项目报告

```bash
ib req export --format markdown
```

### 启动项目

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 访问应用
open http://localhost:3000
```

---

## 📊 学习总结

### 你学会了

1. **复杂项目管理** ✅
   - 管理多模块电商系统
   - 需求拆分和子需求管理
   - 多技术栈集成

2. **业务流程设计** ✅
   - 订单流程管理
   - 商品审核流程
   - 权限和角色控制

3. **技术架构设计** ✅
   - 微服务架构设计
   - 数据库设计
   - API 设计

4. **DevOps 实践** ✅
   - Docker 容器化
   - Docker Compose 编排
   - 多服务管理

### 下一步

- 📚 **微服务架构教程** - 学习服务拆分和通信
- 📚 **性能优化教程** - 学习缓存和查询优化
- 📚 **安全加固教程** - 学习安全最佳实践

---

## 🎯 实践练习

### 练习 1: 添加支付功能

```bash
ib "添加支付功能，支持支付宝、微信支付、银联支付"
```

### 练习 2: 添加消息通知

```bash
ib "添加消息通知系统，支持邮件、短信、站内信"
```

### 练习 3: 使用 Web UI

```bash
ib web
```

在 Web UI 中：
- 查看所有模块
- 查看需求关系图
- 导出项目报告

---

## 📚 相关资源

- **快速入门**: [QUICK_START_5MIN.md](QUICK_START_5MIN.md)
- **故障排查**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **优化计划**: [OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md)
- **命令参考**: [README.md](../README.md)

---

**教程完成！** 🎉

你已经学会了使用 IntentBridge 管理复杂的电商后台系统。

**下一个教程**: [微服务架构系统](TUTORIAL_03_MICROSERVICES.md)
