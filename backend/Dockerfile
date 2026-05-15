# Stage 1: Build
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /api ./cmd/api

# Stage 2: Runtime
FROM alpine:3.19

WORKDIR /app

# Install certificates for HTTPS
RUN apk add --no-cache ca-certificates

# Copy binary from builder
COPY --from=builder /api /app/api

# Copy config
COPY configs/config.yaml /app/configs/config.yaml

# Expose port
EXPOSE 8081

# Run the binary
CMD ["/app/api"]