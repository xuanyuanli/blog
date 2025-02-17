在 Maven 项目中，将经常变动的 JAR 文件单独放到一个独立的目录中（例如 `dynamic-lib`），可以通过以下步骤实现。我们可以通过 Maven 的插件和配置来完成这一任务。

---

### **1. 修改项目的 `pom.xml`**

在 `pom.xml` 中，使用 Maven 的 `maven-dependency-plugin` 插件，将依赖分类并分别输出到不同的目录中。具体步骤如下：

#### （1）定义分类规则
我们需要将稳定的第三方依赖（如 Spring Boot、Lombok 等）与经常变动的 JAR 文件分开。可以通过 `dependency:copy-dependencies` 目标实现。

#### 示例 `pom.xml` 配置：
```xml
<build>
    <plugins>
        <!-- Spring Boot Maven Plugin -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <layout>ZIP</layout>
            </configuration>
        </plugin>

        <!-- Maven Dependency Plugin -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-dependency-plugin</artifactId>
            <executions>
                <!-- 复制稳定的依赖到 lib 目录 -->
                <execution>
                    <id>copy-stable-dependencies</id>
                    <phase>package</phase>
                    <goals>
                        <goal>copy-dependencies</goal>
                    </goals>
                    <configuration>
                        <outputDirectory>${project.build.directory}/lib</outputDirectory>
                        <includeScope>runtime</includeScope>
                        <excludeArtifactIds>your-dynamic-artifact-id-1,your-dynamic-artifact-id-2</excludeArtifactIds>
                    </configuration>
                </execution>

                <!-- 复制动态的依赖到 dynamic-lib 目录 -->
                <execution>
                    <id>copy-dynamic-dependencies</id>
                    <phase>package</phase>
                    <goals>
                        <goal>copy-dependencies</goal>
                    </goals>
                    <configuration>
                        <outputDirectory>${project.build.directory}/dynamic-lib</outputDirectory>
                        <includeArtifactIds>your-dynamic-artifact-id-1,your-dynamic-artifact-id-2</includeArtifactIds>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

---

### **2. 关键配置解析**

#### （1）复制稳定依赖
- `<outputDirectory>${project.build.directory}/lib</outputDirectory>`：指定稳定的依赖输出到 `target/lib` 目录。
- `<includeScope>runtime</includeScope>`：只包含运行时所需的依赖。
- `<excludeArtifactIds>`：排除经常变动的 JAR 文件（通过 `artifactId` 指定）。

#### （2）复制动态依赖
- `<outputDirectory>${project.build.directory}/dynamic-lib</outputDirectory>`：指定动态的依赖输出到 `target/dynamic-lib` 目录。
- `<includeArtifactIds>`：只包含经常变动的 JAR 文件（通过 `artifactId` 指定）。

#### 示例说明：
假设项目中有两个经常变动的 JAR 文件，分别为 `module-a` 和 `module-b`，则可以在 `includeArtifactIds` 中指定它们：
```xml
<includeArtifactIds>module-a,module-b</includeArtifactIds>
```

---

### **3. 执行打包命令**

运行以下命令，生成分离的 `lib` 和 `dynamic-lib` 目录：
```bash
mvn clean package
```

执行后，`target` 目录中将包含以下内容：
- `lib/`：存放稳定的第三方依赖。
- `dynamic-lib/`：存放经常变动的 JAR 文件。
- `your-app.jar`：不包含依赖的应用程序主 JAR。

---

### **4. 验证启动方式**

确保应用程序能够正确加载分离的依赖。使用以下命令验证启动是否正常：
```bash
java -Dloader.path=target/lib,target/dynamic-lib -jar target/your-app.jar
```

---

### **5. Dockerfile 调整**

在 Dockerfile 中，分别处理 `lib` 和 `dynamic-lib` 目录。示例 Dockerfile 如下：

```dockerfile
# 第一阶段：构建阶段
FROM maven:3.8.6-openjdk-17 AS builder

# 设置工作目录
WORKDIR /build

# 拷贝 Maven 配置文件和源码
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package

# 第二阶段：运行阶段
FROM openjdk:17-jdk-slim

# 设置工作目录
WORKDIR /app

# 拷贝稳定的 lib 依赖
COPY --from=builder /build/target/lib /app/lib

# 拷贝动态的 dynamic-lib 依赖
COPY --from=builder /build/target/dynamic-lib /app/dynamic-lib

# 拷贝主 JAR 文件
COPY --from=builder /build/target/your-app.jar /app/your-app.jar

# 设置启动命令
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dloader.path=/app/lib,/app/dynamic-lib -jar /app/your-app.jar"]
```
