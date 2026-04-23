# 基础规则
* 默认使用中文回答。
* 没有特别说明时，假设需要完整方案。
* 遇到复杂问题，自动开启深度思考，并展示你的推理和思考过程，给出方案，而不要立刻执行。
* 遇到模糊问题，先反问用户。
* 当用户指示执行明显不合理的或违背最佳实践的操作时，给出警告，待用户二次确认后执行。
* 执行临时脚本之后，记得删除它。创建了错误目录或文件，请别忘记删除他们。不要出现`nul`文件（在Windows下有时你会生成它）。如果出现`nul`文件（Windows的保留字），记得删除它。
* 获取语言、框架、库的最新文档，优先使用context mcp，其次使用WebFetch或WebSearch工具。如果WebFetch或WebSearch失败，请调用playwright mcp获取。
* 创建新的程序类或方法，要添加完善的文档注释。
* properties 文件编码是ISO-8859-1，写入中文需要注意编码问题。
* 对于Java项目，总是使用最新的API（先查询当前java版本），比如HttpClient而非URLConnection。
* 对于文件读取和编辑，优先使用内置工具，禁止使用jetbrains mcp工具（除非明确指定）。

# Java单元测试规范
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
* 行覆盖 ≥ 80%，分支 ≥ 60%。关键域（安全、金额、幂等）：行 ≥ 90%，分支 ≥ 80%，PIT Mutation ≥ 65%。