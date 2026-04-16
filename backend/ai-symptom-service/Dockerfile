# Use Eclipse Temurin OpenJDK 17 as base image
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY target/ai-symptom-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8087

ENTRYPOINT ["java", "-jar", "app.jar"]
