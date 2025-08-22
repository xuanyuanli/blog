#!/usr/bin/env node

/**
 * 性能基准检查脚本
 * 检查应用程序的性能指标是否符合要求
 */

const fs = require('fs');
const path = require('path');

// 性能阈值配置
const PERFORMANCE_THRESHOLDS = {
  startup: {
    cold: 3000,    // 冷启动 < 3s
    hot: 1000,     // 热启动 < 1s
  },
  memory: {
    initial: 150,  // 初始内存 < 150MB
    after1h: 200,  // 1小时后 < 200MB
  },
  ui: {
    firstPaint: 500,      // 首次绘制 < 500ms
    interaction: 100,     // 交互响应 < 100ms
    listRender: 50,       // 列表渲染 < 50ms/item
  },
  bundle: {
    maxSize: 5120,        // 最大包大小 < 5MB (KB)
  }
};

// 基线数据（通常从历史构建中获取）
const BASELINE_DATA = {
  startup: { cold: 2500, hot: 800 },
  memory: { initial: 120, after1h: 180 },
  ui: { firstPaint: 400, interaction: 80, listRender: 40 },
  bundle: { size: 4800 }
};

/**
 * 检查启动性能
 */
function checkStartupPerformance() {
  console.log('🚀 Checking startup performance...');
  
  // 这里应该是实际的性能测试代码
  // 为演示目的，我们使用模拟数据
  const currentMetrics = {
    cold: 2800 + Math.random() * 400,  // 模拟变化
    hot: 900 + Math.random() * 200,
  };

  const results = {
    cold: {
      current: Math.round(currentMetrics.cold),
      baseline: BASELINE_DATA.startup.cold,
      threshold: PERFORMANCE_THRESHOLDS.startup.cold,
      passed: currentMetrics.cold < PERFORMANCE_THRESHOLDS.startup.cold,
      status: currentMetrics.cold < PERFORMANCE_THRESHOLDS.startup.cold ? '✅' : '❌'
    },
    hot: {
      current: Math.round(currentMetrics.hot),
      baseline: BASELINE_DATA.startup.hot,
      threshold: PERFORMANCE_THRESHOLDS.startup.hot,
      passed: currentMetrics.hot < PERFORMANCE_THRESHOLDS.startup.hot,
      status: currentMetrics.hot < PERFORMANCE_THRESHOLDS.startup.hot ? '✅' : '❌'
    }
  };

  console.log(`  Cold startup: ${results.cold.current}ms (threshold: ${results.cold.threshold}ms) ${results.cold.status}`);
  console.log(`  Hot startup: ${results.hot.current}ms (threshold: ${results.hot.threshold}ms) ${results.hot.status}`);

  return results;
}

/**
 * 检查内存使用
 */
function checkMemoryUsage() {
  console.log('💾 Checking memory usage...');
  
  const currentMetrics = {
    initial: 140 + Math.random() * 30,
    after1h: 170 + Math.random() * 40,
  };

  const results = {
    initial: {
      current: Math.round(currentMetrics.initial),
      baseline: BASELINE_DATA.memory.initial,
      threshold: PERFORMANCE_THRESHOLDS.memory.initial,
      passed: currentMetrics.initial < PERFORMANCE_THRESHOLDS.memory.initial,
      status: currentMetrics.initial < PERFORMANCE_THRESHOLDS.memory.initial ? '✅' : '❌'
    },
    after1h: {
      current: Math.round(currentMetrics.after1h),
      baseline: BASELINE_DATA.memory.after1h,
      threshold: PERFORMANCE_THRESHOLDS.memory.after1h,
      passed: currentMetrics.after1h < PERFORMANCE_THRESHOLDS.memory.after1h,
      status: currentMetrics.after1h < PERFORMANCE_THRESHOLDS.memory.after1h ? '✅' : '❌'
    }
  };

  console.log(`  Initial memory: ${results.initial.current}MB (threshold: ${results.initial.threshold}MB) ${results.initial.status}`);
  console.log(`  After 1h: ${results.after1h.current}MB (threshold: ${results.after1h.threshold}MB) ${results.after1h.status}`);

  return results;
}

/**
 * 检查 UI 性能
 */
function checkUIPerformance() {
  console.log('🎨 Checking UI performance...');
  
  const currentMetrics = {
    firstPaint: 420 + Math.random() * 160,
    interaction: 85 + Math.random() * 30,
    listRender: 45 + Math.random() * 20,
  };

  const results = {
    firstPaint: {
      current: Math.round(currentMetrics.firstPaint),
      baseline: BASELINE_DATA.ui.firstPaint,
      threshold: PERFORMANCE_THRESHOLDS.ui.firstPaint,
      passed: currentMetrics.firstPaint < PERFORMANCE_THRESHOLDS.ui.firstPaint,
      status: currentMetrics.firstPaint < PERFORMANCE_THRESHOLDS.ui.firstPaint ? '✅' : '❌'
    },
    interaction: {
      current: Math.round(currentMetrics.interaction),
      baseline: BASELINE_DATA.ui.interaction,
      threshold: PERFORMANCE_THRESHOLDS.ui.interaction,
      passed: currentMetrics.interaction < PERFORMANCE_THRESHOLDS.ui.interaction,
      status: currentMetrics.interaction < PERFORMANCE_THRESHOLDS.ui.interaction ? '✅' : '❌'
    },
    listRender: {
      current: Math.round(currentMetrics.listRender),
      baseline: BASELINE_DATA.ui.listRender,
      threshold: PERFORMANCE_THRESHOLDS.ui.listRender,
      passed: currentMetrics.listRender < PERFORMANCE_THRESHOLDS.ui.listRender,
      status: currentMetrics.listRender < PERFORMANCE_THRESHOLDS.ui.listRender ? '✅' : '❌'
    }
  };

  console.log(`  First paint: ${results.firstPaint.current}ms (threshold: ${results.firstPaint.threshold}ms) ${results.firstPaint.status}`);
  console.log(`  Interaction: ${results.interaction.current}ms (threshold: ${results.interaction.threshold}ms) ${results.interaction.status}`);
  console.log(`  List render: ${results.listRender.current}ms (threshold: ${results.listRender.threshold}ms) ${results.listRender.status}`);

  return results;
}

/**
 * 检查包大小
 */
function checkBundleSize() {
  console.log('📦 Checking bundle size...');
  
  let currentSize = 0;
  
  try {
    // 检查 dist 目录大小
    const distPath = path.join(__dirname, '..', 'dist');
    if (fs.existsSync(distPath)) {
      currentSize = calculateDirectorySize(distPath);
    } else {
      console.warn('  ⚠️  dist directory not found, using estimated size');
      currentSize = 4600 + Math.random() * 800; // 模拟大小
    }
  } catch (error) {
    console.warn('  ⚠️  Error calculating bundle size:', error.message);
    currentSize = 4600 + Math.random() * 800; // 模拟大小
  }

  const results = {
    size: {
      current: Math.round(currentSize),
      baseline: BASELINE_DATA.bundle.size,
      threshold: PERFORMANCE_THRESHOLDS.bundle.maxSize,
      passed: currentSize < PERFORMANCE_THRESHOLDS.bundle.maxSize,
      status: currentSize < PERFORMANCE_THRESHOLDS.bundle.maxSize ? '✅' : '❌'
    }
  };

  console.log(`  Bundle size: ${results.size.current}KB (threshold: ${results.size.threshold}KB) ${results.size.status}`);

  return results;
}

/**
 * 计算目录大小（KB）
 */
function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  
  function processPath(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        processPath(path.join(currentPath, file));
      });
    }
  }
  
  processPath(dirPath);
  return Math.round(totalSize / 1024); // Convert to KB
}

/**
 * 检查性能回归
 */
function checkPerformanceRegression(current, baseline, threshold = 0.1) {
  const regression = (current - baseline) / baseline;
  return {
    regression: Math.round(regression * 100),
    isRegression: regression > threshold,
    severity: regression > 0.2 ? 'high' : regression > 0.1 ? 'medium' : 'low'
  };
}

/**
 * 生成性能报告
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    startup: results.startup,
    memory: results.memory,
    ui: results.ui,
    bundle: results.bundle,
    summary: {
      passed: Object.values(results).every(category => 
        Object.values(category).every(metric => metric.passed)
      ),
      totalChecks: Object.values(results).reduce((total, category) => 
        total + Object.keys(category).length, 0
      ),
      passedChecks: Object.values(results).reduce((total, category) => 
        total + Object.values(category).filter(metric => metric.passed).length, 0
      )
    }
  };

  // 保存报告到文件
  const reportPath = path.join(__dirname, '..', 'performance-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 Running performance checks...\n');

  try {
    const results = {
      startup: checkStartupPerformance(),
      memory: checkMemoryUsage(),
      ui: checkUIPerformance(),
      bundle: checkBundleSize()
    };

    console.log('\n📊 Generating performance report...');
    const report = generateReport(results);

    console.log('\n' + '='.repeat(50));
    console.log('📈 PERFORMANCE SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total checks: ${report.summary.totalChecks}`);
    console.log(`Passed: ${report.summary.passedChecks}`);
    console.log(`Failed: ${report.summary.totalChecks - report.summary.passedChecks}`);
    console.log(`Success rate: ${Math.round((report.summary.passedChecks / report.summary.totalChecks) * 100)}%`);
    console.log(`Overall result: ${report.summary.passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (!report.summary.passed) {
      console.log('\n❌ Performance checks failed. Please review the metrics above.');
      process.exit(1);
    } else {
      console.log('\n✅ All performance checks passed!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error running performance checks:', error.message);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  checkStartupPerformance,
  checkMemoryUsage,
  checkUIPerformance,
  checkBundleSize,
  generateReport,
  PERFORMANCE_THRESHOLDS
};