#!/bin/bash
# Railway build script - Force Nixpacks usage
echo "Starting Nixpacks build for Spring Boot application..."
mvn clean package -DskipTests -B -q
echo "Build completed successfully!"