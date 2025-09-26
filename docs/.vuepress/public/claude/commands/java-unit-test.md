
此命令帮助您创建优秀的单元测试。


## Java单元测试规范
* 阅读获取项目的基础测试框架，一般默认为Junit 5 + Mockito + AssertJ。
* 测试类与被测类保持同名，放在 src/test/java；类名以 Test 结尾。
* 遵循 AAA（Arrange-Act-Assert）模式，用空行分隔结构。
* 测试方法名采用 methodName_shouldExpected_whenContext 格式。
* 每个测试独立运行，避免依赖顺序；禁用 sleep、随机数、真实时间。
* 使用 AssertJ 进行断言，表达业务语义。
* 对于异常测试，明确断言异常类型与信息。
* 优先使用 @ParameterizedTest 覆盖边界值、等价类与特殊情况。
* Mock 仅用于外部依赖（DB、HTTP 等），业务逻辑尽量用真实对象。
* 保持单元测试快速、轻量，关键分支和边界必须覆盖。
* 推荐使用 @Nested 对同一方法的不同场景分组，配合 @ParameterizedTest 提升可读性与覆盖度。
* @DisplayName 使用中文，如果和 @ParameterizedTest 配合，请注意展示参数内容。
* 行覆盖 ≥ 80%，分支 ≥ 60%。关键域（安全、金额、幂等）：行 ≥ 90%，分支 ≥ 80%，PIT Mutation ≥ 65%。