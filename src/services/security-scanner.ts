/**
 * Security Scanner (安全扫描器)
 *
 * 功能：
 * 1. 检查硬编码密钥
 * 2. 扫描 OWASP Top 10 漏洞
 * 3. 验证 HTTPS 使用
 * 4. 检查认证实现
 * 5. 验证输入净化
 *
 * v3.0.0 Phase 4 新增 - 硬验证机制
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

/**
 * 安全扫描结果
 */
export interface SecurityScanResult {
  filePath: string;
  vulnerabilities: Vulnerability[];
  secrets: SecretDetection[];
  securityScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  passed: boolean;
}

/**
 * 漏洞检测
 */
export interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  line?: number;
  column?: number;
  recommendation: string;
  references: string[];
  cwe?: string; // Common Weakness Enumeration
  owasp?: string; // OWASP Top 10 reference
}

/**
 * 漏洞类型
 */
export type VulnerabilityType =
  | 'injection'
  | 'broken_authentication'
  | 'sensitive_data_exposure'
  | 'xml_external_entities'
  | 'broken_access_control'
  | 'security_misconfiguration'
  | 'cross_site_scripting'
  | 'insecure_deserialization'
  | 'using_components_with_vulnerabilities'
  | 'insufficient_logging'
  | 'hardcoded_credentials'
  | 'insecure_communication'
  | 'path_traversal'
  | 'code_injection'
  | 'command_injection';

/**
 * 密钥检测
 */
export interface SecretDetection {
  type: SecretType;
  value: string;
  line: number;
  confidence: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * 密钥类型
 */
export type SecretType =
  | 'api_key'
  | 'password'
  | 'private_key'
  | 'access_token'
  | 'secret_key'
  | 'jwt_token'
  | 'database_url'
  | 'aws_access_key'
  | 'github_token';

/**
 * 安全配置
 */
export interface SecurityConfig {
  checkHardcodedSecrets: boolean;
  checkOWASPTop10: boolean;
  checkHTTPS: boolean;
  checkAuthentication: boolean;
  checkInputValidation: boolean;
  failOnCritical: boolean;
  failOnHigh: boolean;
  maxCriticalIssues: number; // 默认 0
  maxHighIssues: number; // 默认 0
}

/**
 * 默认安全配置
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  checkHardcodedSecrets: true,
  checkOWASPTop10: true,
  checkHTTPS: true,
  checkAuthentication: true,
  checkInputValidation: true,
  failOnCritical: true,
  failOnHigh: true,
  maxCriticalIssues: 0,
  maxHighIssues: 0,
};

/**
 * 扫描文件安全性
 */
export function scanFile(
  filePath: string,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): SecurityScanResult {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const vulnerabilities: Vulnerability[] = [];
  const secrets: SecretDetection[] = [];

  // 检查硬编码密钥
  if (config.checkHardcodedSecrets) {
    const detectedSecrets = detectSecrets(content);
    secrets.push(...detectedSecrets);

    // 将严重密钥作为漏洞
    detectedSecrets.forEach((secret) => {
      if (secret.confidence === 'high') {
        vulnerabilities.push({
          id: `SECRET-${Date.now()}-${Math.random()}`,
          type: 'hardcoded_credentials',
          severity: 'critical',
          title: 'Hardcoded Secret Detected',
          description: `Found ${secret.type} hardcoded in source code`,
          line: secret.line,
          recommendation: 'Use environment variables or a secrets manager',
          references: ['https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password'],
          cwe: 'CWE-798',
          owasp: 'A2:2017-Broken Authentication',
        });
      }
    });
  }

  // 检查 OWASP Top 10
  if (config.checkOWASPTop10) {
    const owaspVulnerabilities = detectOWASPTop10(content);
    vulnerabilities.push(...owaspVulnerabilities);
  }

  // 检查 HTTPS 使用
  if (config.checkHTTPS) {
    const httpsIssues = checkHTTPSUsage(content);
    vulnerabilities.push(...httpsIssues);
  }

  // 检查认证实现
  if (config.checkAuthentication) {
    const authIssues = checkAuthentication(content);
    vulnerabilities.push(...authIssues);
  }

  // 检查输入验证
  if (config.checkInputValidation) {
    const inputIssues = checkInputValidation(content);
    vulnerabilities.push(...inputIssues);
  }

  // 计算安全评分
  const securityScore = calculateSecurityScore(vulnerabilities, secrets);

  // 确定风险等级
  const riskLevel = determineRiskLevel(vulnerabilities);

  // 确定是否通过
  const passed = checkPassed(vulnerabilities, config);

  return {
    filePath,
    vulnerabilities,
    secrets,
    securityScore,
    riskLevel,
    passed,
  };
}

/**
 * 扫描多个文件
 */
export function scanFiles(
  filePaths: string[],
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): SecurityScanResult[] {
  return filePaths.map((file) => {
    try {
      return scanFile(file, config);
    } catch (error: any) {
      return {
        filePath: file,
        vulnerabilities: [
          {
            id: `SCAN-ERROR-${Date.now()}`,
            type: 'security_misconfiguration',
            severity: 'medium',
            title: 'Scan Failed',
            description: error.message,
            recommendation: 'Fix file accessibility issue',
            references: [],
          },
        ],
        secrets: [],
        securityScore: 0,
        riskLevel: 'medium',
        passed: false,
      };
    }
  });
}

/**
 * 扫描目录
 */
export function scanDirectory(
  dirPath: string,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go']
): SecurityScanResult[] {
  const files = getAllFiles(dirPath, extensions);
  return scanFiles(files, config);
}

/**
 * 检测密钥
 */
function detectSecrets(content: string): SecretDetection[] {
  const secrets: SecretDetection[] = [];
  const lines = content.split('\n');

  // 密钥模式
  const patterns: Array<{ pattern: RegExp; type: SecretType; confidence: 'low' | 'medium' | 'high' }> = [
    // API Keys
    {
      pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]([a-zA-Z0-9]{32,})['"]/i,
      type: 'api_key',
      confidence: 'high',
    },
    // AWS Access Key
    {
      pattern: /(?:aws[_-]?access[_-]?key[_-]?id)\s*[=:]\s*['"]([A-Z0-9]{20})['"]/i,
      type: 'aws_access_key',
      confidence: 'high',
    },
    // Password
    {
      pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]([^'"]{8,})['"]/i,
      type: 'password',
      confidence: 'high',
    },
    // Private Key
    {
      pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/,
      type: 'private_key',
      confidence: 'high',
    },
    // JWT Token
    {
      pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/,
      type: 'jwt_token',
      confidence: 'high',
    },
    // GitHub Token
    {
      pattern: /ghp_[a-zA-Z0-9]{36}/,
      type: 'github_token',
      confidence: 'high',
    },
    // Database URL
    {
      pattern: /(?:mongodb|mysql|postgres|postgresql):\/\/[^:]+:[^@]+@[^\s]+/i,
      type: 'database_url',
      confidence: 'high',
    },
    // Generic Secret
    {
      pattern: /(?:secret|token|key)\s*[=:]\s*['"]([a-zA-Z0-9+/=]{16,})['"]/i,
      type: 'secret_key',
      confidence: 'medium',
    },
  ];

  lines.forEach((line, index) => {
    patterns.forEach(({ pattern, type, confidence }) => {
      if (pattern.test(line)) {
        const match = line.match(pattern);
        secrets.push({
          type,
          value: match ? maskSecret(match[0]) : '[REDACTED]',
          line: index + 1,
          confidence,
          description: `Detected ${type.replace(/_/g, ' ')} in code`,
        });
      }
    });
  });

  return secrets;
}

/**
 * 检测 OWASP Top 10 漏洞
 */
function detectOWASPTop10(content: string): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // A1: Injection (SQL)
    if (/\+\s*['"]*SELECT|SELECT.*\+/i.test(line) || /exec\s*\(\s*[^)]*\+/.test(line)) {
      vulnerabilities.push({
        id: `OWASP-A1-${Date.now()}-${Math.random()}`,
        type: 'injection',
        severity: 'critical',
        title: 'SQL Injection Risk',
        description: 'Potential SQL injection vulnerability detected',
        line: index + 1,
        recommendation: 'Use parameterized queries or prepared statements',
        references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
        cwe: 'CWE-89',
        owasp: 'A1:2017-Injection',
      });
    }

    // A1: Command Injection
    if (/exec\s*\(\s*[^)]*\$\{|eval\s*\(|new\s+Function\s*\(/.test(line)) {
      vulnerabilities.push({
        id: `OWASP-A1-CMD-${Date.now()}-${Math.random()}`,
        type: 'command_injection',
        severity: 'critical',
        title: 'Command Injection Risk',
        description: 'Potential command injection vulnerability',
        line: index + 1,
        recommendation: 'Avoid executing dynamic code or commands',
        references: ['https://owasp.org/www-community/attacks/Command_Injection'],
        cwe: 'CWE-78',
        owasp: 'A1:2017-Injection',
      });
    }

    // A7: Cross-Site Scripting (XSS)
    if (/innerHTML\s*=|document\.write\s*\(|dangerouslySetInnerHTML/.test(line)) {
      vulnerabilities.push({
        id: `OWASP-A7-${Date.now()}-${Math.random()}`,
        type: 'cross_site_scripting',
        severity: 'high',
        title: 'XSS Risk',
        description: 'Potential XSS vulnerability',
        line: index + 1,
        recommendation: 'Sanitize user input before rendering',
        references: ['https://owasp.org/www-community/attacks/xss/'],
        cwe: 'CWE-79',
        owasp: 'A7:2017-Cross-Site Scripting (XSS)',
      });
    }

    // Path Traversal
    if (/\.\.\/|\.\.\\/.test(line) && /readFile|writeFile|fs\./.test(line)) {
      vulnerabilities.push({
        id: `PATH-TRAVERSAL-${Date.now()}-${Math.random()}`,
        type: 'path_traversal',
        severity: 'high',
        title: 'Path Traversal Risk',
        description: 'Potential path traversal vulnerability',
        line: index + 1,
        recommendation: 'Validate and sanitize file paths',
        references: ['https://owasp.org/www-community/attacks/Path_Traversal'],
        cwe: 'CWE-22',
        owasp: 'A5:2017-Broken Access Control',
      });
    }

    // Insecure Deserialization
    if (/JSON\.parse\s*\(|pickle\.loads|yaml\.load\s*\(/.test(line)) {
      vulnerabilities.push({
        id: `OWASP-A8-${Date.now()}-${Math.random()}`,
        type: 'insecure_deserialization',
        severity: 'high',
        title: 'Insecure Deserialization',
        description: 'Potential insecure deserialization',
        line: index + 1,
        recommendation: 'Use safe deserialization methods',
        references: ['https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data'],
        cwe: 'CWE-502',
        owasp: 'A8:2017-Insecure Deserialization',
      });
    }

    // XXE (XML External Entities)
    if (/new\s+DOMParser\(\)|xml\.parse|lxml\.parse|DocumentBuilder/.test(line)) {
      vulnerabilities.push({
        id: `OWASP-A4-${Date.now()}-${Math.random()}`,
        type: 'xml_external_entities',
        severity: 'high',
        title: 'XXE Risk',
        description: 'Potential XML External Entity vulnerability',
        line: index + 1,
        recommendation: 'Disable external entities in XML parser',
        references: ['https://owasp.org/www-community/vulnerabilities/XML_External_Entity_(XXE)_Processing'],
        cwe: 'CWE-611',
        owasp: 'A4:2017-XML External Entities (XXE)',
      });
    }
  });

  return vulnerabilities;
}

/**
 * 检查 HTTPS 使用
 */
function checkHTTPSUsage(content: string): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // 检查 HTTP 使用
    if (/http:\/\/(?!localhost|127\.0\.0\.1)/.test(line)) {
      vulnerabilities.push({
        id: `INSECURE-HTTP-${Date.now()}-${Math.random()}`,
        type: 'insecure_communication',
        severity: 'medium',
        title: 'Insecure HTTP Connection',
        description: 'Using HTTP instead of HTTPS',
        line: index + 1,
        recommendation: 'Use HTTPS for secure communication',
        references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'],
        cwe: 'CWE-319',
        owasp: 'A3:2017-Sensitive Data Exposure',
      });
    }

    // 检查禁用 SSL 验证
    if (/rejectUnauthorized\s*:\s*false|verify\s*:\s*false|ssl_verify\s*:\s*false/i.test(line)) {
      vulnerabilities.push({
        id: `SSL-VERIFY-DISABLED-${Date.now()}-${Math.random()}`,
        type: 'security_misconfiguration',
        severity: 'critical',
        title: 'SSL Verification Disabled',
        description: 'SSL/TLS certificate verification is disabled',
        line: index + 1,
        recommendation: 'Enable SSL certificate verification',
        references: ['https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration'],
        cwe: 'CWE-295',
        owasp: 'A6:2017-Security Misconfiguration',
      });
    }
  });

  return vulnerabilities;
}

/**
 * 检查认证实现
 */
function checkAuthentication(content: string): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  const lines = content.split('\n');

  // 检查弱密码哈希
  if (/md5\s*\(|sha1\s*\(|\.update\s*\(/.test(content)) {
    const lineNum = lines.findIndex((l) => /md5\s*\(|sha1\s*\(/.test(l));
    vulnerabilities.push({
      id: `WEAK-HASH-${Date.now()}-${Math.random()}`,
      type: 'broken_authentication',
      severity: 'high',
      title: 'Weak Password Hashing',
      description: 'Using weak hashing algorithm (MD5/SHA1)',
      line: lineNum + 1,
      recommendation: 'Use bcrypt, scrypt, or Argon2 for password hashing',
      references: ['https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication'],
      cwe: 'CWE-328',
      owasp: 'A2:2017-Broken Authentication',
    });
  }

  // 检查硬编码会话密钥
  if (/session[_-]?secret\s*[=:]\s*['"]/.test(content)) {
    const lineNum = lines.findIndex((l) => /session[_-]?secret\s*[=:]\s*['"]/.test(l));
    vulnerabilities.push({
      id: `HARDCODED-SESSION-${Date.now()}-${Math.random()}`,
      type: 'broken_authentication',
      severity: 'high',
      title: 'Hardcoded Session Secret',
      description: 'Session secret is hardcoded',
      line: lineNum + 1,
      recommendation: 'Use environment variable for session secret',
      references: ['https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication'],
      cwe: 'CWE-798',
      owasp: 'A2:2017-Broken Authentication',
    });
  }

  return vulnerabilities;
}

/**
 * 检查输入验证
 */
function checkInputValidation(content: string): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  const lines = content.split('\n');

  // 检查缺少输入验证的数据库操作
  if (/db\.(find|insert|update|delete)\s*\(/.test(content) && !/validate|sanitize|check/.test(content)) {
    vulnerabilities.push({
      id: `NO-INPUT-VALIDATION-${Date.now()}-${Math.random()}`,
      type: 'injection',
      severity: 'medium',
      title: 'Missing Input Validation',
      description: 'Database operation without input validation',
      recommendation: 'Add input validation before database operations',
      references: ['https://owasp.org/www-community/vulnerabilities/Improper_Data_Validation'],
      cwe: 'CWE-20',
      owasp: 'A1:2017-Injection',
    });
  }

  // 检查直接使用用户输入
  lines.forEach((line, index) => {
    if (/req\.(body|query|params)\.\w+\s*[=+]/.test(line) && !/validate|sanitize/.test(content)) {
      vulnerabilities.push({
        id: `UNSANITIZED-INPUT-${Date.now()}-${Math.random()}`,
        type: 'injection',
        severity: 'medium',
        title: 'Unsanitized User Input',
        description: 'User input used without sanitization',
        line: index + 1,
        recommendation: 'Sanitize and validate user input',
        references: ['https://owasp.org/www-community/vulnerabilities/Improper_Data_Validation'],
        cwe: 'CWE-20',
        owasp: 'A1:2017-Injection',
      });
    }
  });

  return vulnerabilities;
}

/**
 * 计算安全评分
 */
function calculateSecurityScore(
  vulnerabilities: Vulnerability[],
  secrets: SecretDetection[]
): number {
  let score = 100;

  // 根据漏洞严重程度扣分
  vulnerabilities.forEach((vul) => {
    switch (vul.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 8;
        break;
      case 'low':
        score -= 3;
        break;
    }
  });

  // 根据密钥置信度扣分
  secrets.forEach((secret) => {
    switch (secret.confidence) {
      case 'high':
        score -= 20;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  });

  return Math.max(0, Math.min(100, score));
}

/**
 * 确定风险等级
 */
function determineRiskLevel(vulnerabilities: Vulnerability[]): 'low' | 'medium' | 'high' | 'critical' {
  const criticalCount = vulnerabilities.filter((v) => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter((v) => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter((v) => v.severity === 'medium').length;

  if (criticalCount > 0) return 'critical';
  if (highCount > 1) return 'high';
  if (highCount > 0 || mediumCount > 3) return 'medium';
  return 'low';
}

/**
 * 检查是否通过
 */
function checkPassed(vulnerabilities: Vulnerability[], config: SecurityConfig): boolean {
  const criticalCount = vulnerabilities.filter((v) => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter((v) => v.severity === 'high').length;

  if (config.failOnCritical && criticalCount > config.maxCriticalIssues) {
    return false;
  }

  if (config.failOnHigh && highCount > config.maxHighIssues) {
    return false;
  }

  return true;
}

/**
 * 遮蔽密钥
 */
function maskSecret(secret: string): string {
  if (secret.length <= 8) {
    return '[REDACTED]';
  }
  return secret.substring(0, 4) + '...' + secret.substring(secret.length - 4);
}

/**
 * 获取目录下所有文件
 */
function getAllFiles(dirPath: string, extensions: string[]): string[] {
  const files: string[] = [];

  function traverse(currentPath: string) {
    const items = readdirSync(currentPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = join(currentPath, item.name);

      if (item.isDirectory()) {
        // 跳过 node_modules 和隐藏目录
        if (item.name !== 'node_modules' && !item.name.startsWith('.')) {
          traverse(fullPath);
        }
      } else if (item.isFile()) {
        const ext = extname(item.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dirPath);
  return files;
}
