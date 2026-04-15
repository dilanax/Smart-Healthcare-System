# Payment Service - Java/Spring Boot
# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src/ src/
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
# We remove the EXPOSE line because docker-compose handles the ports via environment variables dynamically!
ENTRYPOINT ["java", "-jar", "app.jar"]
