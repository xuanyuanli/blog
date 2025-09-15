PostgreSQL 中的 `LATERAL JOIN` 是一种特殊的连接方式，允许连接右侧的子查询引用左侧表中的列，形成“横向关联”。这一特性在处理依赖关系的关联查询时非常有用，能够简化复杂查询并提高效率。


### 一、核心作用
`LATERAL JOIN` 解决了一个关键问题：**让子查询能够引用来自左侧表的字段**。

在普通的 `JOIN` 中，右侧子查询无法直接使用左侧表的列（子查询在关联前就已执行）；而 `LATERAL` 允许右侧子查询“看到”左侧表的每一行数据，实现动态关联。


### 二、基本语法
```sql
SELECT 列名
FROM 表A
LATERAL (
  -- 子查询，可引用表A的列
  SELECT 列名 FROM 表B WHERE 表B.字段 = 表A.字段
) AS 别名;
```

也可以与 `LEFT JOIN` 结合（确保左侧表的所有行都被保留，即使子查询无结果）：
```sql
SELECT 列名
FROM 表A
LEFT JOIN LATERAL (
  子查询，可引用表A的列
) AS 别名 ON true;
```


### 三、典型使用场景

#### 1. 为每行数据关联其“最新一条关联记录”
例如：查询每个用户及其最新的一笔订单。

**无 `LATERAL` 时**（需用子查询嵌套，较繁琐）：
```sql
SELECT u.id, u.name, o.order_time, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.order_time = (
  SELECT MAX(order_time) FROM orders WHERE user_id = u.id
);
```

**用 `LATERAL` 时**（更简洁，且可获取更多字段）：
```sql
SELECT u.id, u.name, o.*
FROM users u
LEFT JOIN LATERAL (
  SELECT * FROM orders 
  WHERE user_id = u.id 
  ORDER BY order_time DESC 
  LIMIT 1  -- 只取最新一条
) o ON true;
```


#### 2. 拆分 JSON/数组并关联
例如：表中存储 JSON 数组，需拆分后与原表关联。

假设有表 `products`，其中 `tags` 字段为 JSON 数组 `["电子", "数码", "新品"]`：
```sql
SELECT p.id, p.name, t.tag
FROM products p
LEFT JOIN LATERAL (
  -- 拆分JSON数组为多行，引用左侧表p的tags字段
  SELECT jsonb_array_elements_text(p.tags) AS tag
) t ON true;
```

结果会将每个标签拆分为一行，与原产品信息关联：
| id  | name   | tag  |
|-----|--------|------|
| 1   | 手机   | 电子 |
| 1   | 手机   | 数码 |
| 1   | 手机   | 新品 |


#### 3. 动态过滤子查询
例如：根据主表字段动态限制子查询范围。

查询每个员工及其近 30 天内的加班记录：
```sql
SELECT e.id, e.name, o.overtime_hours
FROM employees e
LEFT JOIN LATERAL (
  SELECT SUM(hours) AS overtime_hours
  FROM overtimes 
  WHERE employee_id = e.id
    AND overtime_date >= CURRENT_DATE - INTERVAL '30 days'
) o ON true;
```


### 四、与普通 JOIN 的区别
| 特性                | 普通 JOIN                          | LATERAL JOIN                       |
|---------------------|------------------------------------|------------------------------------|
| 子查询引用范围      | 无法引用左侧表的列                | 可以引用左侧表的列                |
| 执行逻辑            | 子查询先执行，结果再与左侧表关联  | 左侧表每行都会触发一次子查询执行  |
| 适用场景            | 无依赖关系的关联                  | 子查询依赖左侧表字段的动态关联    |


### 五、性能注意事项
- `LATERAL` 子查询会为左侧表的**每一行执行一次**，若左侧表数据量大，需确保子查询高效（如加索引）。
- 与 `LIMIT` 结合使用时（如取前 N 条关联记录），性能通常优于传统子查询（避免全表扫描）。
- 尽量使用 `LEFT JOIN LATERAL` 替代 `CROSS JOIN LATERAL`，避免左侧表行被过滤（除非明确需要）。
