# Stage 1: Build the Java application using Maven
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app
# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src
# Compile the code and skip tests to make it faster
RUN mvn clean package -DskipTests

# Stage 2: Run the compiled application
FROM eclipse-temurin:25-jre
WORKDIR /app
# Copy the built .jar file from the builder stage
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8086
ENTRYPOINT ["java", "-jar", "app.jar"]
