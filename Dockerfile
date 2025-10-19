# Multi-stage build for smaller image and faster deploys
FROM maven:3.9.6-openjdk-17-slim AS build

# Set working directory
WORKDIR /app

# Copy pom.xml first for better layer caching
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build the application (skip tests for faster builds)
RUN ./mvnw clean package -DskipTests -B

# Runtime stage
FROM openjdk:17-jre-slim

# Create app user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Create uploads directory
RUN mkdir -p uploads && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application with optimized JVM settings
ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]