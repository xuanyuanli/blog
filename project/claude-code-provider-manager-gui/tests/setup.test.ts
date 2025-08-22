/**
 * 基础测试设置验证
 */

describe('Test Setup', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('Testing Library DOM matchers work', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);
    
    expect(div).toBeInTheDocument();
    expect(div).toHaveTextContent('Hello World');
    
    document.body.removeChild(div);
  });

  test('Basic imports work', () => {
    const React = require('react');
    
    expect(React).toBeDefined();
    expect(React.createElement).toBeDefined();
  });
});