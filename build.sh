#!/bin/bash

# Simple build script for Railway
echo "Starting build..."

# Make mvnw executable
chmod +x ./mvnw

# Clean and build
echo "Cleaning and building project..."
./mvnw clean package -DskipTests -Dmaven.test.skip=true -B

# List target directory
echo "Build artifacts:"
ls -la target/

# Check if JAR was created
if ls target/*.jar 1> /dev/null 2>&1; then
    echo "JAR file created successfully!"
    ls -la target/*.jar
else
    echo "ERROR: No JAR file found in target directory"
    exit 1
fi