/**
 * Task Decomposition Engine (任务拆解引擎)
 *
 * 功能：
 * 1. 从 PRD/Requirement 拆解为技术任务
 * 2. 分析任务依赖关系
 * 3. 生成执行计划
 * 4. 生成 Gantt 图数据
 *
 * v3.0.0 新增
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { callModel, getAIConfig } from './ai-client.js';
import { getIntentBridgeDir } from '../utils/paths.js';
import { readRequirements, readProject } from './store.js';
import type {
  Requirement,
  Feature,
  Task,
  TasksData,
  Dependency,
  DependencyGraph,
  ExecutionPlan,
  PlanMilestone,
  GanttData,
  TaskType,
  TaskPriority,
} from '../models/types.js';

let tasksPath: string;

/**
 * 加载任务数据
 */
function loadTasks(): TasksData {
  return readTasks();
}

/**
 * 初始化引擎
 */
export function initEngine(cwd?: string): void {
  const intentBridgeDir = getIntentBridgeDir(cwd);
  tasksPath = join(intentBridgeDir, 'tasks.yml');
}

/**
 * 从 PRD 拆解任务
 */
export async function decomposePRD(prdPath: string): Promise<TasksData> {
  initEngine();

  // 读取 PRD
  const prd = loadPRD(prdPath);

  // 使用 AI 拆解任务
  const tasks = await decomposeWithAI(prd);

  // 分析依赖关系
  const dependencyGraph = analyzeDependencies(tasks);

  // 生成执行计划
  const executionPlan = generateExecutionPlan(tasks, dependencyGraph);

  // 保存任务数据
  const tasksData: TasksData = {
    tasks,
    executionPlan,
  };

  saveTasks(tasksData);

  return tasksData;
}

/**
 * 从需求拆解任务
 */
export async function decomposeRequirement(requirementId: string): Promise<TasksData> {
  initEngine();

  // 读取需求
  const requirements = readRequirements();
  const requirement = requirements.requirements.find((r) => r.id === requirementId);

  if (!requirement) {
    throw new Error(`Requirement ${requirementId} not found`);
  }

  // 检查是否已有任务
  const existingTasks = loadTasks();
  const existingTaskIds = existingTasks.tasks
    .filter((t: Task) => t.requirementId === requirementId)
    .map((t: Task) => t.id);

  if (existingTaskIds.length > 0) {
    console.log(`⚠️  Requirement ${requirementId} already has tasks: ${existingTaskIds.join(', ')}`);
    return existingTasks;
  }

  // 使用 AI 拆解任务
  const tasks = await decomposeRequirementWithAI(requirement);

  // 分析依赖关系
  const dependencyGraph = analyzeDependencies(tasks);

  // 合并到现有任务
  const allTasks = [...existingTasks.tasks, ...tasks];
  const updatedGraph = analyzeDependencies(allTasks);

  // 更新执行计划
  const executionPlan = generateExecutionPlan(allTasks, updatedGraph);

  // 保存
  const tasksData: TasksData = {
    tasks: allTasks,
    executionPlan,
  };

  saveTasks(tasksData);

  return tasksData;
}

/**
 * 使用 AI 拆解任务（从 PRD）
 */
async function decomposeWithAI(prd: any): Promise<Task[]> {
  if (!getAIConfig()) {
    // 无 AI 时使用规则拆解
    return decomposeWithRules(prd);
  }

  try {
    const prompt = `作为技术架构师，将以下产品需求拆解为技术任务。

产品需求：
${JSON.stringify(prd, null, 2)}

拆解要求：
1. 每个功能拆分为 4 类任务：frontend, backend, testing, deployment
2. 每个任务包含：名称、描述、工时估算
3. 识别任务之间的依赖关系
4. 优先级：P0（必须）、P1（重要）、P2（次要）

输出纯 JSON 格式：
{
  "tasks": [
    {
      "id": "T-001",
      "requirementId": "${prd.id || 'REQ-XXX'}",
      "name": "任务名称",
      "description": "任务描述",
      "type": "frontend|backend|testing|deployment",
      "priority": "P0|P1|P2",
      "estimatedHours": 2,
      "dependsOn": []
    }
  ]
}

只输出 JSON。`;

    const response = await callModel(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return normalizeTasks(data.tasks, prd.id || 'REQ-XXX');
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    // 回退到规则拆解
    return decomposeWithRules(prd);
  }
}

/**
 * 使用 AI 拆解任务（从 Requirement）
 */
async function decomposeRequirementWithAI(requirement: Requirement): Promise<Task[]> {
  if (!getAIConfig()) {
    return decomposeRequirementWithRules(requirement);
  }

  try {
    const prompt = `作为技术架构师，将以下需求拆解为技术任务。

需求：
- ID: ${requirement.id}
- 标题: ${requirement.title}
- 描述: ${requirement.description}
- 优先级: ${requirement.priority}

${requirement.features?.length ? `功能拆分：\n${requirement.features.map((f) => `- ${f.name}: ${f.description}`).join('\n')}` : ''}

${requirement.acceptance?.length ? `验收标准：\n${requirement.acceptance.map((a) => `- ${a.criterion}`).join('\n')}` : ''}

拆解要求：
1. 将需求拆分为具体的技术任务
2. 任务类型：frontend（前端）、backend（后端）、testing（测试）、deployment（部署）
3. 估算工时
4. 识别依赖关系
5. 优先级：P0（必须）、P1（重要）、P2（次要）

输出纯 JSON 格式：
{
  "tasks": [
    {
      "name": "任务名称",
      "description": "任务描述",
      "type": "frontend|backend|testing|deployment",
      "priority": "P0|P1|P2",
      "estimatedHours": 2,
      "dependsOn": []
    }
  ]
}

只输出 JSON。`;

    const response = await callModel(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return normalizeTasks(data.tasks, requirement.id);
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    return decomposeRequirementWithRules(requirement);
  }
}

/**
 * 基于规则拆解任务（无 AI 时的后备方案）
 */
function decomposeWithRules(prd: any): Task[] {
  const tasks: Task[] = [];
  let taskNum = 1;

  // 为每个功能创建任务
  if (prd.features) {
    for (const feature of prd.features) {
      // 前端任务
      tasks.push(createTask(`T-${String(taskNum++).padStart(3, '0')}`, prd.id || 'REQ-XXX', feature, 'frontend'));

      // 后端任务
      tasks.push(createTask(`T-${String(taskNum++).padStart(3, '0')}`, prd.id || 'REQ-XXX', feature, 'backend'));

      // 测试任务
      tasks.push(createTask(`T-${String(taskNum++).padStart(3, '0')}`, prd.id || 'REQ-XXX', feature, 'testing'));
    }
  }

  // 部署任务
  tasks.push(createDeploymentTask(`T-${String(taskNum).padStart(3, '0')}`, prd.id || 'REQ-XXX'));

  return tasks;
}

/**
 * 基于规则拆解任务（从 Requirement）
 */
function decomposeRequirementWithRules(requirement: Requirement): Task[] {
  const tasks: Task[] = [];
  let taskNum = 1;
  const baseId = requirement.id;

  // 如果有 features，基于 features 拆解
  if (requirement.features && requirement.features.length > 0) {
    for (const feature of requirement.features) {
      tasks.push(createTask(`T-${String(taskNum++).padStart(3, '0')}`, baseId, feature, 'frontend'));
      tasks.push(createTask(`T-${String(taskNum++).padStart(3, '0')}`, baseId, feature, 'backend'));
      tasks.push(createTask(`T-${String(taskNum++).padStart(3, '0')}`, baseId, feature, 'testing'));
    }
  } else {
    // 否则创建通用任务
    tasks.push(createGenericTask(`T-001`, baseId, requirement.title, 'frontend'));
    tasks.push(createGenericTask(`T-002`, baseId, requirement.title, 'backend'));
    tasks.push(createGenericTask(`T-003`, baseId, requirement.title, 'testing'));
  }

  // 部署任务
  tasks.push(createDeploymentTask(`T-${String(taskNum).padStart(3, '0')}`, baseId));

  return tasks;
}

/**
 * 创建任务
 */
function createTask(id: string, requirementId: string, feature: Feature, type: TaskType): Task {
  const typeLabels = {
    frontend: '前端',
    backend: '后端',
    testing: '测试',
    deployment: '部署',
  };

  return {
    id,
    requirementId,
    featureId: feature.id,
    name: `${feature.name} - ${typeLabels[type]}实现`,
    description: feature.description,
    type,
    status: 'pending',
    priority: 'P1',
    estimatedHours: feature.estimated_hours || 2,
    dependsOn: type === 'testing' ? [getPreviousTask(id, type)] : [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

/**
 * 创建通用任务
 */
function createGenericTask(id: string, requirementId: string, title: string, type: TaskType): Task {
  const typeLabels = {
    frontend: '前端页面开发',
    backend: '后端 API 开发',
    testing: '功能测试',
    deployment: '部署配置',
  };

  return {
    id,
    requirementId,
    name: `${title} - ${typeLabels[type]}`,
    description: `${title}的${typeLabels[type]}`,
    type,
    status: 'pending',
    priority: 'P1',
    estimatedHours: type === 'deployment' ? 1 : 3,
    dependsOn: type === 'testing' ? ['T-001', 'T-002'] : [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

/**
 * 创建部署任务
 */
function createDeploymentTask(id: string, requirementId: string): Task {
  return {
    id,
    requirementId,
    name: '部署和发布',
    description: '配置生产环境并发布',
    type: 'deployment',
    status: 'pending',
    priority: 'P1',
    estimatedHours: 1,
    dependsOn: [],  // 将在依赖分析时填充
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

/**
 * 获取前一个任务 ID（用于测试任务依赖）
 */
function getPreviousTask(currentId: string, type: TaskType): string {
  const num = parseInt(currentId.replace('T-', ''), 10);
  return `T-${String(num - 1).padStart(3, '0')}`;
}

/**
 * 规范化任务数据
 */
function normalizeTasks(tasks: any[], requirementId: string): Task[] {
  return tasks.map((task, index) => ({
    id: `T-${String(index + 1).padStart(3, '0')}`,
    requirementId: task.requirementId || requirementId,
    name: task.name,
    description: task.description || '',
    type: task.type || 'backend',
    status: 'pending' as const,
    priority: task.priority || 'P1',
    estimatedHours: task.estimatedHours || 2,
    dependsOn: task.dependsOn || [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }));
}

/**
 * 分析任务依赖关系
 */
export function analyzeDependencies(tasks: Task[]): DependencyGraph {
  const edges: Dependency[] = [];

  // 构建依赖图
  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      edges.push({
        from: depId,
        to: task.id,
        type: 'hard',
      });
    }
  }

  // 添加隐式依赖（测试任务依赖前端和后端）
  for (const task of tasks) {
    if (task.type === 'testing') {
      const relatedTasks = tasks.filter(
        (t) =>
          t.requirementId === task.requirementId &&
          (t.type === 'frontend' || t.type === 'backend')
      );

      for (const relatedTask of relatedTasks) {
        if (!task.dependsOn.includes(relatedTask.id)) {
          edges.push({
            from: relatedTask.id,
            to: task.id,
            type: 'hard',
          });
          task.dependsOn.push(relatedTask.id);
        }
      }
    }

    // 部署任务依赖所有其他任务
    if (task.type === 'deployment') {
      const nonDeploymentTasks = tasks.filter(
        (t) => t.requirementId === task.requirementId && t.type !== 'deployment'
      );

      for (const nonDeploymentTask of nonDeploymentTasks) {
        if (!task.dependsOn.includes(nonDeploymentTask.id)) {
          edges.push({
            from: nonDeploymentTask.id,
            to: task.id,
            type: 'hard',
          });
          task.dependsOn.push(nonDeploymentTask.id);
        }
      }
    }
  }

  // 拓扑排序
  const topologyOrder = topologicalSort(tasks, edges);

  return {
    nodes: tasks,
    edges,
    topologyOrder,
  };
}

/**
 * 拓扑排序
 */
function topologicalSort(tasks: Task[], edges: Dependency[]): string[] {
  const inDegree: Map<string, number> = new Map();
  const adjacency: Map<string, string[]> = new Map();

  // 初始化
  for (const task of tasks) {
    inDegree.set(task.id, 0);
    adjacency.set(task.id, []);
  }

  // 构建图
  for (const edge of edges) {
    adjacency.get(edge.from)?.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  }

  // Kahn's 算法
  const queue: string[] = [];
  const result: string[] = [];

  // 找出入度为 0 的节点
  for (const [taskId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(taskId);
    }
  }

  while (queue.length > 0) {
    const taskId = queue.shift()!;
    result.push(taskId);

    for (const neighbor of adjacency.get(taskId) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result;
}

/**
 * 生成执行计划
 */
export function generateExecutionPlan(tasks: Task[], dependencyGraph: DependencyGraph): ExecutionPlan {
  // 计算总工时
  const estimatedTotalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  // 生成里程碑
  const milestones = generateMilestones(tasks, dependencyGraph);

  // 生成 Gantt 图数据
  const ganttData = generateGanttData(tasks, dependencyGraph);

  return {
    tasks,
    dependencyGraph,
    milestones,
    estimatedTotalHours,
    ganttData,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 生成里程碑
 */
function generateMilestones(tasks: Task[], graph: DependencyGraph): PlanMilestone[] {
  const milestones: PlanMilestone[] = [];

  // 按类型分组
  const frontendTasks = tasks.filter((t) => t.type === 'frontend');
  const backendTasks = tasks.filter((t) => t.type === 'backend');
  const testingTasks = tasks.filter((t) => t.type === 'testing');
  const deploymentTasks = tasks.filter((t) => t.type === 'deployment');

  if (frontendTasks.length > 0) {
    milestones.push({
      name: '前端开发完成',
      tasks: frontendTasks.map((t) => t.id),
      status: 'planned',
    });
  }

  if (backendTasks.length > 0) {
    milestones.push({
      name: '后端开发完成',
      tasks: backendTasks.map((t) => t.id),
      status: 'planned',
    });
  }

  if (testingTasks.length > 0) {
    milestones.push({
      name: '测试完成',
      tasks: testingTasks.map((t) => t.id),
      status: 'planned',
    });
  }

  if (deploymentTasks.length > 0) {
    milestones.push({
      name: '部署上线',
      tasks: deploymentTasks.map((t) => t.id),
      status: 'planned',
    });
  }

  return milestones;
}

/**
 * 生成 Gantt 图数据
 */
function generateGanttData(tasks: Task[], graph: DependencyGraph): GanttData {
  const ganttTasks: GanttData['tasks'] = [];
  const startDate = new Date();
  let currentDate = new Date(startDate);

  // 按拓扑顺序处理任务
  for (const taskId of graph.topologyOrder) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) continue;

    const taskStart = new Date(currentDate);
    const taskEnd = new Date(currentDate);
    taskEnd.setHours(taskEnd.getHours() + task.estimatedHours);

    ganttTasks.push({
      id: task.id,
      name: task.name,
      start: taskStart.toISOString(),
      end: taskEnd.toISOString(),
      progress: 0,
      dependencies: task.dependsOn,
    });

    currentDate = new Date(taskEnd);
  }

  return { tasks: ganttTasks };
}

/**
 * 读取任务数据
 */
export function readTasks(): TasksData {
  initEngine();

  if (!existsSync(tasksPath)) {
    return { tasks: [] };
  }

  const raw = readFileSync(tasksPath, 'utf-8');
  const data = yaml.load(raw) as TasksData | null;
  return data ?? { tasks: [] };
}

/**
 * 保存任务数据
 */
export function saveTasks(data: TasksData): void {
  initEngine();
  writeFileSync(tasksPath, yaml.dump(data, { lineWidth: -1 }));
}

/**
 * 加载 PRD
 */
function loadPRD(prdPath: string): any {
  const raw = readFileSync(prdPath, 'utf-8');
  return yaml.load(raw);
}

/**
 * 获取下一个任务 ID
 */
export function getNextTaskId(tasks: Task[]): string {
  if (tasks.length === 0) return 'T-001';
  const maxNum = tasks.reduce((max, t) => {
    const num = parseInt(t.id.replace('T-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `T-${String(maxNum + 1).padStart(3, '0')}`;
}
